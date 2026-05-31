import { COMMON_SKILL_TARGETS } from '../catalog/skills.js';
import type { SkillDefinition } from '../core/types.js';
import { listGitHubDirectories } from '../adapters/tools/github-skill-source.js';

export const SKILL_SEARCH_SENTINEL = '__search__';

interface SkillSearchSource {
  id: string;
  displayName: string;
  source: string;
  category: string;
}

export const SKILL_SEARCH_SOURCES: SkillSearchSource[] = [
  {
    id: 'tml-team',
    displayName: 'TML Team',
    source: 'github:Time-Machine-Lab/TML-Skills/skills',
    category: 'TML Team'
  }
];

export function isSkillSearchRequest(values: string[]): boolean {
  return values.some((value) => {
    const normalized = value.trim().toLowerCase();
    return normalized === 'search' || normalized === SKILL_SEARCH_SENTINEL;
  });
}

export function resolveSkillSearchSources(ids: string[]): { sources: SkillSearchSource[]; unknown: string[] } {
  const requested = ids.length ? ids : ['tml-team'];
  const sources: SkillSearchSource[] = [];
  const unknown: string[] = [];
  const seen = new Set<string>();

  for (const id of requested) {
    const normalized = id.trim().toLowerCase();
    const source = SKILL_SEARCH_SOURCES.find((candidate) => {
      return candidate.id === normalized || candidate.displayName.toLowerCase() === normalized;
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
  const resolved = resolveSkillSearchSources(sourceIds);
  const skills: SkillDefinition[] = [];

  for (const source of resolved.sources) {
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
