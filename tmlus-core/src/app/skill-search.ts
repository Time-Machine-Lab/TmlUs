import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { COMMON_SKILL_TARGETS } from '../catalog/skills.js';
import {
  BUNDLED_SKILL_SEARCH_SOURCE_REGISTRY,
  loadSkillSearchSourceRegistry,
  type SkillSearchSource,
  type SkillSearchSourceRegistry
} from '../catalog/skill-catalog.js';
import type { SkillDefinition } from '../core/types.js';
import { listGitHubDirectories, listGitHubSkillManifests } from '../adapters/tools/github-skill-source.js';
import { envValue, skillSearchSourceCachePath } from './cache-paths.js';

export const SKILL_SEARCH_SENTINEL = '__search__';
const DEFAULT_SEARCH_CACHE_TTL_HOURS = 4;

export const SKILL_SEARCH_SOURCES: SkillSearchSource[] = BUNDLED_SKILL_SEARCH_SOURCE_REGISTRY.sources;

interface SearchCacheEnvelope {
  cachedAt: string;
  cacheKey: string;
  skills: SkillDefinition[];
}

export function isSkillSearchRequest(values: string[]): boolean {
  return values.some((value) => {
    const normalized = value.trim().toLowerCase();
    return normalized === 'search' || normalized === SKILL_SEARCH_SENTINEL;
  });
}

export function resolveSkillSearchSources(
  ids: string[],
  registry: SkillSearchSourceRegistry = BUNDLED_SKILL_SEARCH_SOURCE_REGISTRY
): { sources: SkillSearchSource[]; unknown: string[] } {
  const requested = ids.length ? ids : [registry.defaultSourceId];
  const sources: SkillSearchSource[] = [];
  const unknown: string[] = [];
  const seen = new Set<string>();

  for (const id of requested) {
    const normalized = id.trim().toLowerCase();
    const source = registry.sources.find((candidate) => {
      return candidate.id === normalized
        || candidate.displayName.toLowerCase() === normalized
        || candidate.aliases?.includes(normalized);
    });

    if (!source) {
      unknown.push(id);
      continue;
    }

    if (!seen.has(source.id)) {
      seen.add(source.id);
      sources.push(source);
    }
  }

  return { sources, unknown };
}

function searchCacheTtlMilliseconds(): number {
  const raw = envValue(process.env, 'TMLUS_SKILL_CATALOG_TTL_HOURS');
  if (!raw) {
    return DEFAULT_SEARCH_CACHE_TTL_HOURS * 60 * 60 * 1000;
  }

  const hours = Number(raw);
  if (!Number.isFinite(hours) || hours < 0) {
    return DEFAULT_SEARCH_CACHE_TTL_HOURS * 60 * 60 * 1000;
  }

  return hours * 60 * 60 * 1000;
}

function cacheIsFresh(cachedAt: string): boolean {
  const timestamp = Date.parse(cachedAt);
  return Number.isFinite(timestamp) && Date.now() - timestamp <= searchCacheTtlMilliseconds();
}

function sourceCachePath(source: SkillSearchSource): string {
  return skillSearchSourceCachePath(source.id);
}

function sourceCacheKey(source: SkillSearchSource): string {
  return JSON.stringify({
    source: source.source,
    resolver: source.resolver,
    discovery: source.discovery
  });
}

function isSkillList(value: unknown): value is SkillDefinition[] {
  return Array.isArray(value)
    && value.every((skill) => {
      return skill
        && typeof skill === 'object'
        && typeof (skill as SkillDefinition).id === 'string'
        && typeof (skill as SkillDefinition).name === 'string'
        && typeof (skill as SkillDefinition).source === 'string'
        && typeof (skill as SkillDefinition).category === 'string'
        && typeof (skill as SkillDefinition).description === 'string'
        && Array.isArray((skill as SkillDefinition).targets);
    });
}

async function readCachedSourceSkills(source: SkillSearchSource, freshOnly: boolean): Promise<SkillDefinition[] | undefined> {
  try {
    const raw = JSON.parse(await readFile(sourceCachePath(source), 'utf8')) as SearchCacheEnvelope;
    if (!raw || typeof raw.cachedAt !== 'string' || raw.cacheKey !== sourceCacheKey(source) || !isSkillList(raw.skills)) {
      return undefined;
    }

    if (freshOnly && !cacheIsFresh(raw.cachedAt)) {
      return undefined;
    }

    return raw.skills;
  } catch {
    return undefined;
  }
}

async function writeCachedSourceSkills(source: SkillSearchSource, skills: SkillDefinition[]): Promise<void> {
  const cachePath = sourceCachePath(source);
  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, JSON.stringify({
    cachedAt: new Date().toISOString(),
    cacheKey: sourceCacheKey(source),
    skills
  }, null, 2), 'utf8');
}

async function discoverDirectorySkills(source: SkillSearchSource): Promise<SkillDefinition[]> {
  if (!source.source) {
    return [];
  }

  const directories = await listGitHubDirectories(source.source) ?? [];
  return directories.map((directory) => ({
    id: directory,
    name: directory,
    source: `${source.source}/${directory}`,
    category: source.category,
    description: source.description ?? source.displayName,
    installer: {
      strategy: 'github-directory'
    },
    targets: COMMON_SKILL_TARGETS
  }));
}

async function discoverManifestSkills(source: SkillSearchSource): Promise<SkillDefinition[]> {
  if (!source.source || !source.resolver) {
    return [];
  }

  const cached = await readCachedSourceSkills(source, true);
  if (cached) {
    return cached;
  }

  const manifests = await listGitHubSkillManifests(source.source, {
    patterns: source.resolver.patterns,
    metadata: source.resolver.metadata,
    sourceMetadata: {
      id: source.id,
      displayName: source.displayName,
      category: source.category,
      description: source.description,
      source: source.source
    },
    installSource: source.resolver.installSource,
    maxDepth: source.resolver.maxDepth,
    includeCategories: source.resolver.includeCategories,
    excludeCategories: source.resolver.excludeCategories,
    concurrency: source.resolver.concurrency
  }) ?? [];
  const skills = manifests.map((manifest) => ({
    id: manifest.id.toLowerCase(),
    name: manifest.name ?? manifest.id,
    source: manifest.source,
    category: manifest.category ?? source.category,
    description: manifest.description ?? source.description ?? source.displayName,
    installer: {
      strategy: 'github-directory' as const
    },
    targets: COMMON_SKILL_TARGETS
  }));
  await writeCachedSourceSkills(source, skills);
  return skills;
}

async function discoverSkillsForSource(source: SkillSearchSource): Promise<{ skills: SkillDefinition[]; failed: boolean }> {
  if (source.resolver?.type !== 'github-skill-files') {
    return {
      skills: await discoverDirectorySkills(source),
      failed: false
    };
  }

  try {
    return {
      skills: await discoverManifestSkills(source),
      failed: false
    };
  } catch {
    const stale = await readCachedSourceSkills(source, false);
    if (stale) {
      return { skills: stale, failed: false };
    }

    if (source.discovery?.strategy === 'skill-manifest') {
      return {
        skills: await discoverDirectorySkills(source),
        failed: true
      };
    }

    return {
      skills: [],
      failed: true
    };
  }
}

export async function searchRemoteSkills(sourceIds: string[]): Promise<{ skills: SkillDefinition[]; unknown: string[]; failed: string[] }> {
  const registry = await loadSkillSearchSourceRegistry();
  const resolved = resolveSkillSearchSources(sourceIds, registry);
  const skills: SkillDefinition[] = [];
  const failed: string[] = [];

  for (const source of resolved.sources) {
    try {
      const discovered = await discoverSkillsForSource(source);
      skills.push(...discovered.skills);
      if (discovered.failed) {
        failed.push(source.id);
      }
    } catch {
      failed.push(source.id);
    }
  }

  return { skills, unknown: resolved.unknown, failed };
}

export function unknownSkillSearchSourceMessage(unknown: string[]): string {
  return [
    `Unknown Skill search source: ${unknown.join(', ')}`,
    `Supported sources: ${SKILL_SEARCH_SOURCES.map((source) => source.displayName).join(', ')}`
  ].join('\n');
}

export async function unknownSkillSearchSourceMessageFromRegistry(unknown: string[]): Promise<string> {
  const registry = await loadSkillSearchSourceRegistry();
  return [
    `Unknown Skill search source: ${unknown.join(', ')}`,
    `Supported sources: ${registry.sources.map((source) => source.displayName).join(', ')}`
  ].join('\n');
}

export async function defaultSkillSearchSources(): Promise<SkillSearchSource[]> {
  return (await loadSkillSearchSourceRegistry()).sources;
}
