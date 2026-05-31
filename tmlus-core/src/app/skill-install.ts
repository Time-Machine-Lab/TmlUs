import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findEnvironmentByName } from '../catalog/environments.js';
import { findSkillById, SKILL_CATALOG, supportedSkillIds } from '../catalog/skills.js';
import type { EnvironmentDefinition, SkillDefinition, SkillInstallResult } from '../core/types.js';
import { initializeEnvironments, selectDefaultIdeTargets } from './ide-init.js';
import { copyDirectory, ensureDirectory, pathExists, resolveProjectPath } from '../workspace/fs.js';
import { renderSkillDownloadProgress } from '../ui/output.js';
import { downloadGitHubPaths, downloadGitHubSkillBundle, downloadGitHubSource } from '../adapters/tools/github-skill-source.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(currentDir, '..', '..');
const repositoryRoot = path.resolve(packageRoot, '..');

export function resolveSkillIds(ids: string[]): { skills: SkillDefinition[]; unknown: string[] } {
  const skills: SkillDefinition[] = [];
  const unknown: string[] = [];
  const seen = new Set<string>();

  for (const id of ids) {
    const skill = findSkillById(id);
    if (!skill) {
      unknown.push(id);
      continue;
    }

    if (!seen.has(skill.id)) {
      seen.add(skill.id);
      skills.push(skill);
    }
  }

  return { skills, unknown };
}

export function resolveSkillTargetEnvironments(names: string[]): { environments: EnvironmentDefinition[]; unknown: string[] } {
  const environments: EnvironmentDefinition[] = [];
  const unknown: string[] = [];
  const seen = new Set<string>();

  for (const name of names) {
    const environment = findEnvironmentByName(name);
    if (!environment) {
      unknown.push(name);
      continue;
    }

    if (!seen.has(environment.id)) {
      seen.add(environment.id);
      environments.push(environment);
    }
  }

  return { environments, unknown };
}

function getSkillSourcePath(skill: SkillDefinition): string | undefined {
  const strategy = skill.installer?.strategy ?? (skill.source.startsWith('local:') ? 'local-directory' : 'github-directory');
  if (strategy !== 'local-directory' || !skill.source.startsWith('local:')) {
    return undefined;
  }

  return path.resolve(repositoryRoot, skill.source.slice('local:'.length));
}

async function installRemoteSkill(skill: SkillDefinition, destinationPath: string): Promise<{ installed: boolean; message: string }> {
  const installer = skill.installer ?? { strategy: 'github-directory' as const };

  if (installer.strategy === 'github-root-skill') {
    const includePaths = installer.includePaths ?? ['SKILL.md'];
    if (!await downloadGitHubPaths(skill.source, includePaths, destinationPath)) {
      return { installed: false, message: `Unsupported skill source: ${skill.source}` };
    }

    return { installed: true, message: `Installed to ${destinationPath}` };
  }

  if (installer.strategy === 'github-skill-bundle') {
    const bundleDirectory = installer.bundleDirectory ?? 'skills';
    const result = await downloadGitHubSkillBundle(skill.source, destinationPath, bundleDirectory);
    if (!result) {
      return { installed: false, message: `Unsupported skill source: ${skill.source}` };
    }

    const installedText = result.installed.length ? result.installed.join(', ') : 'none';
    const skippedText = result.skipped.length ? `; skipped existing: ${result.skipped.join(', ')}` : '';
    return {
      installed: result.installed.length > 0,
      message: `Installed bundle skills: ${installedText}${skippedText}`
    };
  }

  if (!await downloadGitHubSource(skill.source, destinationPath)) {
    return { installed: false, message: `Unsupported skill source: ${skill.source}` };
  }

  return { installed: true, message: `Installed to ${destinationPath}` };
}

async function installSkillToEnvironment(projectRoot: string, skill: SkillDefinition, environment: EnvironmentDefinition): Promise<SkillInstallResult> {
  const target = skill.targets.find((candidate) => candidate.environmentId === environment.id);
  if (!target) {
    return {
      skill,
      environment,
      status: 'skipped',
      message: 'Skill does not support this AI IDE environment.'
    };
  }

  const targetBase = environment.targetDirectories[target.targetType];
  if (!targetBase) {
    return {
      skill,
      environment,
      status: 'skipped',
      message: `Environment does not define a ${target.targetType} target.`
    };
  }

  await ensureDirectory(projectRoot, targetBase);
  const targetPath = skill.installer?.strategy === 'github-skill-bundle'
    ? targetBase.replace(/\\/g, '/')
    : path.posix.join(targetBase.replace(/\\/g, '/'), target.targetSubdirectory ?? skill.id);
  const resolvedTargetPath = resolveProjectPath(projectRoot, targetPath);
  if (skill.installer?.strategy !== 'github-skill-bundle' && await pathExists(resolvedTargetPath)) {
    return {
      skill,
      environment,
      status: 'skipped',
      targetPath,
      message: `Already installed at ${targetPath}`
    };
  }

  const sourcePath = getSkillSourcePath(skill);

  try {
    if (sourcePath) {
      await copyDirectory(sourcePath, projectRoot, targetPath);
    } else {
      const installResult = await installRemoteSkill(skill, resolvedTargetPath);
      if (!installResult.installed) {
        return {
          skill,
          environment,
          status: 'skipped',
          targetPath,
          message: installResult.message
        };
      }

      return {
        skill,
        environment,
        status: 'installed',
        targetPath,
        message: installResult.message
      };
    }

    return {
      skill,
      environment,
      status: 'installed',
      targetPath,
      message: `Installed to ${targetPath}`
    };
  } catch (error) {
    return {
      skill,
      environment,
      status: 'failed',
      targetPath,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function installSkills(
  projectRoot: string,
  skills: SkillDefinition[],
  environments: EnvironmentDefinition[],
  options: { quiet?: boolean } = {}
): Promise<SkillInstallResult[]> {
  await initializeEnvironments(projectRoot, environments);

  const jobs = skills.flatMap((skill) => environments.map((environment) => ({ skill, environment })));
  const results: SkillInstallResult[] = [];
  let completed = 0;
  const concurrency = 3;

  for (let index = 0; index < jobs.length; index += concurrency) {
    const batch = jobs.slice(index, index + concurrency);
    const batchResults = await Promise.all(batch.map(async (job) => {
      const result = await installSkillToEnvironment(projectRoot, job.skill, job.environment);
      completed += 1;
      renderSkillDownloadProgress(completed, jobs.length, `${job.skill.id} -> ${job.environment.displayName}`, options);
      return result;
    }));
    results.push(...batchResults);
  }

  return results;
}

export async function defaultSkillTargets(projectRoot: string): Promise<EnvironmentDefinition[]> {
  return selectDefaultIdeTargets(projectRoot);
}

export function defaultSkills(): SkillDefinition[] {
  return SKILL_CATALOG;
}

export function unknownSkillMessage(unknown: string[]): string {
  return [
    `Unknown Skill: ${unknown.join(', ')}`,
    `Supported Skills: ${supportedSkillIds()}`
  ].join('\n');
}
