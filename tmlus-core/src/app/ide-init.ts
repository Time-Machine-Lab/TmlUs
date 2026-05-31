import { AI_IDE_ENVIRONMENTS, findEnvironmentByName, supportedEnvironmentNames } from '../catalog/environments.js';
import type { EnvironmentDefinition, EnvironmentStatus, IdeInitializationResult } from '../core/types.js';
import { ensureDirectory, pathExists, resolveProjectPath } from '../workspace/fs.js';

export async function getEnvironmentStatus(projectRoot: string, environment: EnvironmentDefinition): Promise<EnvironmentStatus> {
  const markerExists = await pathExists(resolveProjectPath(projectRoot, environment.markerDirectory));
  const existingDirectories: string[] = [];
  const missingDirectories: string[] = [];

  for (const directory of environment.requiredDirectories) {
    if (await pathExists(resolveProjectPath(projectRoot, directory))) {
      existingDirectories.push(directory);
    } else {
      missingDirectories.push(directory);
    }
  }

  const kind = !markerExists && existingDirectories.length === 0
    ? 'missing'
    : missingDirectories.length === 0
      ? 'complete'
      : 'incomplete';

  return {
    environment,
    kind,
    markerExists,
    existingDirectories,
    missingDirectories
  };
}

export async function getAllEnvironmentStatuses(projectRoot: string): Promise<EnvironmentStatus[]> {
  return Promise.all(AI_IDE_ENVIRONMENTS.map((environment) => getEnvironmentStatus(projectRoot, environment)));
}

export function resolveEnvironmentNames(names: string[]): { environments: EnvironmentDefinition[]; unknown: string[] } {
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

export async function initializeEnvironments(projectRoot: string, environments: EnvironmentDefinition[]): Promise<IdeInitializationResult[]> {
  const results: IdeInitializationResult[] = [];

  for (const environment of environments) {
    const before = await getEnvironmentStatus(projectRoot, environment);
    const directories = [];

    for (const directory of environment.requiredDirectories) {
      directories.push(await ensureDirectory(projectRoot, directory));
    }

    results.push({
      environment,
      statusBefore: before.kind,
      directories
    });
  }

  return results;
}

export async function selectDefaultIdeTargets(projectRoot: string): Promise<EnvironmentDefinition[]> {
  const statuses = await getAllEnvironmentStatuses(projectRoot);
  return statuses
    .filter((status) => status.kind !== 'missing')
    .map((status) => status.environment);
}

export function unknownIdeMessage(unknown: string[]): string {
  return [
    `Unknown AI IDE: ${unknown.join(', ')}`,
    `Supported IDEs: ${supportedEnvironmentNames()}`
  ].join('\n');
}
