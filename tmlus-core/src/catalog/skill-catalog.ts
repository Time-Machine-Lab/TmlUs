import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COMMON_SKILL_TARGETS,
  SKILL_CATALOG
} from './skills.js';
import type {
  ResourceTargetType,
  SkillDefinition,
  SkillInstallStrategy,
  SkillInstallTarget,
  SkillInstallerDefinition
} from '../core/types.js';
import {
  envValue,
  SKILL_CATALOG_CACHE_FILE,
  SKILL_SEARCH_SOURCES_CACHE_FILE,
  skillCacheDirectory
} from '../app/cache-paths.js';

const DEFAULT_CATALOG_URL = 'https://raw.githubusercontent.com/Time-Machine-Lab/TmlUs/main/data/skills/catalog.json';
const DEFAULT_SEARCH_SOURCES_URL = 'https://raw.githubusercontent.com/Time-Machine-Lab/TmlUs/main/data/skills/search-sources.json';
const DEFAULT_CACHE_TTL_HOURS = 4;
const SUPPORTED_SCHEMA_VERSION = 1;
const SKILL_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const INSTALL_STRATEGIES: SkillInstallStrategy[] = [
  'github-directory',
  'github-root-skill',
  'github-skill-bundle',
  'local-directory'
];
const TARGET_TYPES: ResourceTargetType[] = ['skills', 'commands', 'prompts', 'rules'];

export interface RemoteSkillCatalogDocument {
  version: number;
  updatedAt?: string;
  skills: RemoteSkillDefinition[];
}

export interface RemoteSkillDefinition {
  id: string;
  aliases?: string[];
  name: string;
  source: string;
  category: string;
  description: string;
  installer?: SkillInstallerDefinition;
  targets: 'common' | SkillInstallTarget[];
}

export type SkillSearchSourceType = 'github-directory';
export type SkillSearchDiscoveryStrategy = 'directory' | 'skill-manifest';
export type SkillSearchResolverType = 'github-skill-files';

export interface SkillSearchResolverMetadata {
  id?: string;
  name?: string;
  category?: string;
  description?: string;
}

export interface SkillSearchResolver {
  type: SkillSearchResolverType;
  patterns: string[];
  metadata?: SkillSearchResolverMetadata;
  installSource?: string;
  includeCategories?: string[];
  excludeCategories?: string[];
  concurrency?: number;
  maxDepth?: number;
}

export interface SkillSearchDiscoveryOptions {
  strategy: SkillSearchDiscoveryStrategy;
  maxDepth?: number;
  includeCategories?: string[];
  excludeCategories?: string[];
  concurrency?: number;
}

export interface SkillSearchSource {
  id: string;
  aliases?: string[];
  displayName: string;
  type: SkillSearchSourceType;
  source?: string;
  category: string;
  description?: string;
  resolver?: SkillSearchResolver;
  discovery?: SkillSearchDiscoveryOptions;
}

export interface RemoteSkillSearchSourcesDocument {
  version: number;
  updatedAt?: string;
  defaultSourceId?: string;
  sources: SkillSearchSource[];
}

export interface SkillSearchSourceRegistry {
  defaultSourceId: string;
  sources: SkillSearchSource[];
}

interface CatalogLoaderOptions {
  env?: NodeJS.ProcessEnv;
  now?: Date;
}

interface CacheEnvelope<T> {
  cachedAt: string;
  data: T;
}

export const BUNDLED_SKILL_SEARCH_SOURCE_REGISTRY: SkillSearchSourceRegistry = {
  defaultSourceId: 'tml-skills',
  sources: [
    {
      id: 'tml-skills',
      aliases: ['tml-team'],
      displayName: 'TML Skills',
      type: 'github-directory',
      source: 'github:Time-Machine-Lab/TML-Skills',
      category: 'TML Team',
      description: 'TML 团队维护的 Skill 来源，提供文档规范、内容处理、前端交付、工具适配等团队认可的 AI 能力。',
      resolver: {
        type: 'github-skill-files',
        patterns: ['skills/{id}/SKILL.md'],
        metadata: {
          id: 'path.id',
          name: 'frontmatter.name',
          category: 'frontmatter.category',
          description: 'frontmatter.description'
        },
        installSource: 'skills/{id}',
        concurrency: 8
      }
    },
    {
      id: 'mattpocock-skills',
      aliases: ['mattpocock', 'real-engineering', 'skills-for-real-engineers'],
      displayName: 'Matt Pocock Skills',
      type: 'github-directory',
      source: 'github:mattpocock/skills',
      category: 'Real Engineering',
      description: '面向真实软件工程的 AI Coding 工作流来源，帮助解决需求未对齐、Agent 过度啰嗦、缺少反馈环、调试不系统、TDD 落地、PRD/Issue 拆分、架构治理、原型验证和会话交接等问题。',
      resolver: {
        type: 'github-skill-files',
        patterns: ['skills/{category}/{id}/SKILL.md'],
        metadata: {
          id: 'path.id',
          name: 'frontmatter.name',
          category: 'path.category',
          description: 'frontmatter.description'
        },
        installSource: 'skills/{category}/{id}',
        includeCategories: ['engineering', 'productivity', 'misc'],
        excludeCategories: ['deprecated', 'personal', 'in-progress'],
        concurrency: 8
      }
    }
  ]
};

function remoteDisabled(env: NodeJS.ProcessEnv): boolean {
  return ['1', 'true', 'yes'].includes((env.TMLUS_DISABLE_REMOTE_CATALOG ?? '').trim().toLowerCase());
}

function ttlMilliseconds(env: NodeJS.ProcessEnv): number {
  const raw = envValue(env, 'TMLUS_SKILL_CATALOG_TTL_HOURS');
  if (!raw) {
    return DEFAULT_CACHE_TTL_HOURS * 60 * 60 * 1000;
  }

  const hours = Number(raw);
  if (!Number.isFinite(hours) || hours < 0) {
    return DEFAULT_CACHE_TTL_HOURS * 60 * 60 * 1000;
  }

  return hours * 60 * 60 * 1000;
}

function catalogUrl(env: NodeJS.ProcessEnv): string {
  return envValue(env, 'TMLUS_SKILL_CATALOG_URL') ?? DEFAULT_CATALOG_URL;
}

function searchSourcesUrl(env: NodeJS.ProcessEnv): string {
  return envValue(env, 'TMLUS_SKILL_SEARCH_SOURCES_URL') ?? DEFAULT_SEARCH_SOURCES_URL;
}

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function stringField(value: Record<string, unknown>, field: string, label: string): string {
  const raw = value[field];
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error(`${label}.${field} must be a non-empty string.`);
  }

  return raw.trim();
}

function optionalStringArray(value: Record<string, unknown>, field: string, label: string): string[] | undefined {
  const raw = value[field];
  if (raw === undefined) {
    return undefined;
  }

  if (!Array.isArray(raw) || raw.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new Error(`${label}.${field} must be a string array.`);
  }

  return raw.map((item) => item.trim());
}

function optionalString(value: Record<string, unknown>, field: string, label: string): string | undefined {
  const raw = value[field];
  if (raw === undefined) {
    return undefined;
  }

  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error(`${label}.${field} must be a non-empty string.`);
  }

  return raw.trim();
}

function optionalPositiveInteger(value: Record<string, unknown>, field: string, label: string): number | undefined {
  const raw = value[field];
  if (raw === undefined) {
    return undefined;
  }

  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw <= 0) {
    throw new Error(`${label}.${field} must be a positive integer.`);
  }

  return raw;
}

function validateSchemaVersion(value: Record<string, unknown>, label: string): void {
  if (value.version !== SUPPORTED_SCHEMA_VERSION) {
    throw new Error(`${label}.version must be ${SUPPORTED_SCHEMA_VERSION}.`);
  }
}

function normalizeInstaller(value: unknown, label: string): SkillInstallerDefinition | undefined {
  if (value === undefined) {
    return undefined;
  }

  assertObject(value, `${label}.installer`);
  const strategy = stringField(value, 'strategy', `${label}.installer`) as SkillInstallStrategy;
  if (!INSTALL_STRATEGIES.includes(strategy)) {
    throw new Error(`${label}.installer.strategy is unsupported.`);
  }

  const includePaths = optionalStringArray(value, 'includePaths', `${label}.installer`);
  const bundleDirectoryRaw = value.bundleDirectory;
  const bundleDirectory = bundleDirectoryRaw === undefined
    ? undefined
    : stringField(value, 'bundleDirectory', `${label}.installer`);

  return {
    strategy,
    ...(includePaths ? { includePaths } : {}),
    ...(bundleDirectory ? { bundleDirectory } : {})
  };
}

function normalizeTarget(value: unknown, label: string): SkillInstallTarget {
  assertObject(value, label);
  const environmentId = stringField(value, 'environmentId', label);
  const targetType = stringField(value, 'targetType', label) as ResourceTargetType;
  if (!TARGET_TYPES.includes(targetType)) {
    throw new Error(`${label}.targetType is unsupported.`);
  }

  const targetSubdirectoryRaw = value.targetSubdirectory;
  const targetSubdirectory = targetSubdirectoryRaw === undefined
    ? undefined
    : stringField(value, 'targetSubdirectory', label);

  return {
    environmentId,
    targetType,
    ...(targetSubdirectory ? { targetSubdirectory } : {})
  };
}

function normalizeTargets(value: unknown, label: string): SkillInstallTarget[] {
  if (value === 'common') {
    return COMMON_SKILL_TARGETS;
  }

  if (!Array.isArray(value) || !value.length) {
    throw new Error(`${label}.targets must be "common" or a non-empty target array.`);
  }

  return value.map((target, index) => normalizeTarget(target, `${label}.targets[${index}]`));
}

function normalizeSkill(value: unknown, index: number): SkillDefinition {
  const label = `skills[${index}]`;
  assertObject(value, label);
  const id = stringField(value, 'id', label).toLowerCase();
  if (!SKILL_ID_PATTERN.test(id)) {
    throw new Error(`${label}.id must be kebab-case.`);
  }

  return {
    id,
    aliases: optionalStringArray(value, 'aliases', label)?.map((alias) => alias.toLowerCase()),
    name: stringField(value, 'name', label),
    source: stringField(value, 'source', label),
    category: stringField(value, 'category', label),
    description: stringField(value, 'description', label),
    installer: normalizeInstaller(value.installer, label),
    targets: normalizeTargets(value.targets, label)
  };
}

function validateResolverPattern(pattern: string, label: string): void {
  const normalized = pattern.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  if (!normalized || (!normalized.endsWith('/SKILL.md') && normalized !== 'SKILL.md')) {
    throw new Error(`${label} must point to SKILL.md.`);
  }

  const variables = normalized.match(/\{[^}]+\}/g) ?? [];
  for (const variable of variables) {
    const name = variable.slice(1, -1);
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
      throw new Error(`${label} contains an invalid path variable.`);
    }
  }
}

function optionalResolverMetadata(value: Record<string, unknown>, label: string): SkillSearchResolverMetadata | undefined {
  const raw = value.metadata;
  if (raw === undefined) {
    return undefined;
  }

  assertObject(raw, `${label}.metadata`);
  const metadata: SkillSearchResolverMetadata = {};
  for (const key of ['id', 'name', 'category', 'description'] as const) {
    const mapping = optionalString(raw, key, `${label}.metadata`);
    if (!mapping) {
      continue;
    }

    if (!/^(path|frontmatter|source)\.[A-Za-z][A-Za-z0-9_]*$/.test(mapping)) {
      throw new Error(`${label}.metadata.${key} must reference path.*, frontmatter.*, or source.*.`);
    }

    metadata[key] = mapping;
  }

  return Object.keys(metadata).length ? metadata : undefined;
}

function normalizeSearchResolver(value: unknown, label: string): SkillSearchResolver | undefined {
  if (value === undefined) {
    return undefined;
  }

  assertObject(value, `${label}.resolver`);
  const type = stringField(value, 'type', `${label}.resolver`) as SkillSearchResolverType;
  if (type !== 'github-skill-files') {
    throw new Error(`${label}.resolver.type is unsupported.`);
  }

  const patterns = optionalStringArray(value, 'patterns', `${label}.resolver`);
  if (!patterns?.length) {
    throw new Error(`${label}.resolver.patterns must be a non-empty string array.`);
  }
  patterns.forEach((pattern, index) => validateResolverPattern(pattern, `${label}.resolver.patterns[${index}]`));

  const metadata = optionalResolverMetadata(value, `${label}.resolver`);
  const installSource = optionalString(value, 'installSource', `${label}.resolver`);
  const includeCategories = optionalStringArray(value, 'includeCategories', `${label}.resolver`);
  const excludeCategories = optionalStringArray(value, 'excludeCategories', `${label}.resolver`);
  const concurrency = optionalPositiveInteger(value, 'concurrency', `${label}.resolver`);
  const maxDepth = optionalPositiveInteger(value, 'maxDepth', `${label}.resolver`);

  return {
    type,
    patterns,
    ...(metadata ? { metadata } : {}),
    ...(installSource ? { installSource } : {}),
    ...(includeCategories ? { includeCategories } : {}),
    ...(excludeCategories ? { excludeCategories } : {}),
    ...(concurrency ? { concurrency } : {}),
    ...(maxDepth ? { maxDepth } : {})
  };
}

function normalizeSearchDiscovery(value: unknown, label: string): SkillSearchDiscoveryOptions | undefined {
  if (value === undefined) {
    return undefined;
  }

  assertObject(value, `${label}.discovery`);
  const strategy = stringField(value, 'strategy', `${label}.discovery`) as SkillSearchDiscoveryStrategy;
  if (strategy !== 'directory' && strategy !== 'skill-manifest') {
    throw new Error(`${label}.discovery.strategy is unsupported.`);
  }
  const maxDepth = optionalPositiveInteger(value, 'maxDepth', `${label}.discovery`);
  const includeCategories = optionalStringArray(value, 'includeCategories', `${label}.discovery`);
  const excludeCategories = optionalStringArray(value, 'excludeCategories', `${label}.discovery`);
  const concurrency = optionalPositiveInteger(value, 'concurrency', `${label}.discovery`);

  return {
    strategy,
    ...(maxDepth ? { maxDepth } : {}),
    ...(includeCategories ? { includeCategories } : {}),
    ...(excludeCategories ? { excludeCategories } : {}),
    ...(concurrency ? { concurrency } : {})
  };
}

function resolverFromDiscovery(discovery: SkillSearchDiscoveryOptions | undefined): SkillSearchResolver | undefined {
  if (!discovery || discovery.strategy !== 'skill-manifest') {
    return undefined;
  }

  const categorized = discovery.maxDepth === undefined || discovery.maxDepth > 1;
  return {
    type: 'github-skill-files',
    patterns: [categorized ? '{category}/{id}/SKILL.md' : '{id}/SKILL.md'],
    metadata: {
      id: 'path.id',
      name: 'frontmatter.name',
      category: categorized ? 'path.category' : 'source.category',
      description: 'frontmatter.description'
    },
    installSource: categorized ? '{category}/{id}' : '{id}',
    ...(discovery.includeCategories ? { includeCategories: discovery.includeCategories } : {}),
    ...(discovery.excludeCategories ? { excludeCategories: discovery.excludeCategories } : {}),
    ...(discovery.concurrency ? { concurrency: discovery.concurrency } : {}),
    ...(discovery.maxDepth ? { maxDepth: discovery.maxDepth } : {})
  };
}

export function normalizeSkillCatalogDocument(value: unknown): SkillDefinition[] {
  assertObject(value, 'catalog');
  validateSchemaVersion(value, 'catalog');
  if (!Array.isArray(value.skills)) {
    throw new Error('catalog.skills must be an array.');
  }

  const seen = new Set<string>();
  return value.skills.map((skill, index) => {
    const normalized = normalizeSkill(skill, index);
    if (seen.has(normalized.id)) {
      throw new Error(`Duplicate Skill ID: ${normalized.id}`);
    }
    seen.add(normalized.id);
    return normalized;
  });
}

function normalizeSearchSource(value: unknown, index: number): SkillSearchSource {
  const label = `sources[${index}]`;
  assertObject(value, label);
  const id = stringField(value, 'id', label).toLowerCase();
  if (!SKILL_ID_PATTERN.test(id)) {
    throw new Error(`${label}.id must be kebab-case.`);
  }

  const type = stringField(value, 'type', label) as SkillSearchSourceType;
  if (type !== 'github-directory') {
    throw new Error(`${label}.type is unsupported.`);
  }

  const source = value.source === undefined ? undefined : stringField(value, 'source', label);
  if (!source) {
    throw new Error(`${label}.source is required for github-directory sources.`);
  }

  const description = optionalString(value, 'description', label);
  const resolver = normalizeSearchResolver(value.resolver, label);
  const discovery = normalizeSearchDiscovery(value.discovery, label);
  const compatibleResolver = resolver ?? resolverFromDiscovery(discovery);

  return {
    id,
    aliases: optionalStringArray(value, 'aliases', label)?.map((alias) => alias.toLowerCase()),
    displayName: stringField(value, 'displayName', label),
    type,
    ...(source ? { source } : {}),
    category: stringField(value, 'category', label),
    ...(description ? { description } : {}),
    ...(compatibleResolver ? { resolver: compatibleResolver } : {}),
    ...(discovery ? { discovery } : {})
  };
}

export function normalizeSkillSearchSourcesDocument(value: unknown): SkillSearchSourceRegistry {
  assertObject(value, 'searchSources');
  validateSchemaVersion(value, 'searchSources');
  if (!Array.isArray(value.sources)) {
    throw new Error('searchSources.sources must be an array.');
  }

  const sources = value.sources.map(normalizeSearchSource);
  const defaultSourceId = typeof value.defaultSourceId === 'string' && value.defaultSourceId.trim()
    ? value.defaultSourceId.trim().toLowerCase()
    : sources[0]?.id;
  if (!sources.some((source) => source.id === defaultSourceId)) {
    throw new Error('searchSources.defaultSourceId must match a source ID.');
  }

  return { defaultSourceId, sources };
}

async function readJsonFromUrl(url: string): Promise<unknown> {
  if (url.startsWith('file://')) {
    return JSON.parse(await readFile(fileURLToPath(url), 'utf8')) as unknown;
  }

  if (path.isAbsolute(url) || !/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    return JSON.parse(await readFile(path.resolve(url), 'utf8')) as unknown;
  }

  const response = await fetch(url, {
    headers: {
      'user-agent': 'tmlus-cli',
      accept: 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error(`Remote catalog request failed (${response.status}) for ${url}`);
  }

  return response.json() as Promise<unknown>;
}

async function readCache<T>(
  cachePath: string,
  normalize: (value: unknown) => T
): Promise<CacheEnvelope<T> | undefined> {
  try {
    const raw = JSON.parse(await readFile(cachePath, 'utf8')) as unknown;
    assertObject(raw, 'cache');
    const cachedAt = stringField(raw, 'cachedAt', 'cache');
    return {
      cachedAt,
      data: normalize(raw.data)
    };
  } catch {
    return undefined;
  }
}

async function writeCache(cachePath: string, data: unknown, now: Date): Promise<void> {
  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, JSON.stringify({
    cachedAt: now.toISOString(),
    data
  }, null, 2), 'utf8');
}

function cacheIsFresh(cachedAt: string, now: Date, ttlMs: number): boolean {
  const timestamp = Date.parse(cachedAt);
  return Number.isFinite(timestamp) && now.getTime() - timestamp <= ttlMs;
}

async function loadCachedRemote<T>(
  options: CatalogLoaderOptions,
  cacheFileName: string,
  url: string,
  normalize: (value: unknown) => T,
  fallback: T
): Promise<T> {
  const env = options.env ?? process.env;
  if (remoteDisabled(env)) {
    return fallback;
  }

  const now = options.now ?? new Date();
  const ttlMs = ttlMilliseconds(env);
  const cachePath = path.join(skillCacheDirectory(env), cacheFileName);
  const cached = await readCache(cachePath, normalize);
  if (cached && cacheIsFresh(cached.cachedAt, now, ttlMs)) {
    return cached.data;
  }

  try {
    const remote = await readJsonFromUrl(url);
    const normalized = normalize(remote);
    await writeCache(cachePath, remote, now);
    return normalized;
  } catch {
    return cached?.data ?? fallback;
  }
}

export async function loadSkillCatalog(options: CatalogLoaderOptions = {}): Promise<SkillDefinition[]> {
  return loadCachedRemote(
    options,
    SKILL_CATALOG_CACHE_FILE,
    catalogUrl(options.env ?? process.env),
    normalizeSkillCatalogDocument,
    SKILL_CATALOG
  );
}

export async function loadSkillSearchSourceRegistry(options: CatalogLoaderOptions = {}): Promise<SkillSearchSourceRegistry> {
  return loadCachedRemote(
    options,
    SKILL_SEARCH_SOURCES_CACHE_FILE,
    searchSourcesUrl(options.env ?? process.env),
    normalizeSkillSearchSourcesDocument,
    BUNDLED_SKILL_SEARCH_SOURCE_REGISTRY
  );
}

export function findSkillInCatalog(id: string, catalog: SkillDefinition[]): SkillDefinition | undefined {
  const normalized = id.trim().toLowerCase();
  return catalog.find((skill) => skill.id === normalized || skill.aliases?.includes(normalized));
}

export function supportedSkillIds(catalog: SkillDefinition[]): string {
  return catalog.map((skill) => skill.id).join(', ');
}
