import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import type { EnvironmentDefinition, WorkModeDefinition, WorkModeId, WorkModeInitializationResult } from '../core/types.js';

const execFileAsync = promisify(execFile);
const OPENSPEC_COMMAND = process.platform === 'win32' ? 'openspec.cmd' : 'openspec';

export const WORK_MODES: WorkModeDefinition[] = [
  {
    id: 'openspec',
    name: 'OpenSpec',
    description: 'Initialize OpenSpec in the current project.'
  },
  {
    id: 'skip',
    name: 'Skip',
    description: 'Skip project work-mode initialization.'
  }
];

export function resolveWorkMode(name: string): WorkModeDefinition | undefined {
  const normalized = name.trim().toLowerCase();
  return WORK_MODES.find((mode) => mode.id === normalized || mode.name.toLowerCase() === normalized);
}

export function supportedWorkModes(): string {
  return WORK_MODES.map((mode) => mode.id).join(', ');
}

export function unknownWorkModeMessage(unknown: string): string {
  return [
    `Unknown work mode: ${unknown}`,
    `Supported work modes: ${supportedWorkModes()}`
  ].join('\n');
}

function openspecToolTargets(environments: EnvironmentDefinition[] = []): string {
  const tools = environments
    .map((environment) => environment.id)
    .filter((id) => id === 'codex' || id === 'claude' || id === 'cursor' || id === 'trae' || id === 'codebuddy');

  return tools.length ? [...new Set(tools)].join(',') : 'none';
}

export async function initializeWorkMode(
  projectRoot: string,
  mode: WorkModeDefinition,
  options: { environments?: EnvironmentDefinition[] } = {}
): Promise<WorkModeInitializationResult> {
  if (mode.id === 'skip') {
    return {
      mode,
      status: 'skipped',
      message: 'Work mode initialization skipped.'
    };
  }

  const tools = openspecToolTargets(options.environments);
  const openspecDirectory = path.join(projectRoot, 'openspec');
  if (existsSync(openspecDirectory) && tools === 'none') {
    return {
      mode,
      status: 'existing',
      message: 'OpenSpec is already initialized for this project.'
    };
  }

  try {
    await execFileAsync(OPENSPEC_COMMAND, ['init', projectRoot, '--tools', tools], {
      cwd: projectRoot,
      shell: process.platform === 'win32',
      windowsHide: true
    });
    return {
      mode,
      status: 'initialized',
      message: `OpenSpec initialized in the selected project with tools: ${tools}.`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      mode,
      status: 'failed',
      message: `OpenSpec project initialization failed. Run \`openspec init "${projectRoot}" --tools ${openspecToolTargets(options.environments)}\` after installing OpenSpec. ${message}`
    };
  }
}
