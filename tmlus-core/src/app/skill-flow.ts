import type { EnvironmentDefinition, SkillDefinition } from '../core/types.js';
import { installSkills, resolveSkillIds, unknownSkillMessage } from './skill-install.js';
import { loadDefaultSkills } from './skill-install.js';
import { SELECTION_CANCELLED, selectInitSkillIds } from '../ui/selection.js';

export const STARTER_SKILL_IDS = ['skill-creator', 'tml-docs-spec-generate'];
const STARTER_DEFAULTS_SENTINEL = '__starter_defaults__';

export type SkillSelectionOutcome =
  | { status: 'selected'; skills: SkillDefinition[]; usedDefault: boolean }
  | { status: 'cancelled' }
  | { status: 'failed'; message: string };

export async function selectSkillsForInit(): Promise<SkillSelectionOutcome> {
  const catalog = await loadDefaultSkills();
  const selected = await selectInitSkillIds(catalog);
  if (selected === SELECTION_CANCELLED) {
    return { status: 'cancelled' };
  }

  const skillIds = selected?.includes(STARTER_DEFAULTS_SENTINEL)
    ? STARTER_SKILL_IDS
    : selected ?? STARTER_SKILL_IDS;
  const resolved = resolveSkillIds(skillIds, catalog);
  if (resolved.unknown.length) {
    return {
      status: 'failed',
      message: unknownSkillMessage(resolved.unknown, catalog)
    };
  }

  return {
    status: 'selected',
    skills: resolved.skills,
    usedDefault: selected === undefined || selected.includes(STARTER_DEFAULTS_SENTINEL)
  };
}

export async function installSkillsToEnvironments(
  projectRoot: string,
  skills: SkillDefinition[],
  environments: EnvironmentDefinition[],
  options: { quiet?: boolean } = {}
) {
  return installSkills(projectRoot, skills, environments, options);
}
