import { COMMON_SKILL_TARGETS } from '../catalog/skills.js';
import {
  BUNDLED_SKILL_SEARCH_SOURCE_REGISTRY,
  loadSkillSearchSourceRegistry,
  type SkillSearchSource,
  type SkillSearchSourceRegistry
} from '../catalog/skill-catalog.js';
import type { SkillDefinition } from '../core/types.js';
import { listGitHubDirectories } from '../adapters/tools/github-skill-source.js';

export const SKILL_SEARCH_SENTINEL = '__search__';

export const SKILL_SEARCH_SOURCES: SkillSearchSource[] = BUNDLED_SKILL_SEARCH_SOURCE_REGISTRY.sources;

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

export async function searchRemoteSkills(sourceIds: string[]): Promise<{ skills: SkillDefinition[]; unknown: string[] }> {
  const registry = await loadSkillSearchSourceRegistry();
  const resolved = resolveSkillSearchSources(sourceIds, registry);
  const skills: SkillDefinition[] = [];

  for (const source of resolved.sources) {
    if (!source.source) {
      continue;
    }

    const directories = await listGitHubDirectories(source.source) ?? [];
    for (const directory of directories) {
      skills.push({
        id: directory,
        name: directory,
        source: `${source.source}/${directory}`,
        category: source.category,
        description: source.displayName,
        installer: {
          strategy: 'github-directory'
        },
        targets: COMMON_SKILL_TARGETS
      });
    }
  }

  return { skills, unknown: resolved.unknown };
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
