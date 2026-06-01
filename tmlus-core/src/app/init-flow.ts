import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { EnvironmentDefinition } from '../core/types.js';
import { getAllEnvironmentStatuses, initializeEnvironments, resolveEnvironmentNames, selectDefaultIdeTargets, unknownIdeMessage } from './ide-init.js';
import { initializeTmlDocsStructure, tmlDocsStructureHasFailure } from './tml-docs.js';
import { installSkillsToEnvironments, selectSkillsForInit } from './skill-flow.js';
import { initializeWorkMode, resolveWorkMode, unknownWorkModeMessage, WORK_MODES } from './work-mode.js';
import { promptLineWithDefault } from '../ui/prompt.js';
import { SELECTION_CANCELLED, selectEnvironmentIds, selectWorkModeId } from '../ui/selection.js';

export const INIT_STEPS = ['workdir', 'ide', 'tml-spec', 'skills', 'work-mode'] as const;
export type InitStepId = typeof INIT_STEPS[number];

export interface InitFlowOptions {
  args: string[];
  defaultProjectRoot: string;
  quiet?: boolean;
  explicitIdeNames?: string[];
  explicitWorkModeName?: string;
}

export interface InitStepResult {
  step: InitStepId;
  status: 'completed' | 'skipped' | 'failed';
  message: string;
}

export interface InitFlowResult {
  projectRoot: string;
  steps: InitStepResult[];
  failed: boolean;
}

function valueAfter(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

export function resolveInitStartStep(args: string[]): { step?: InitStepId; error?: string } {
  const raw = valueAfter(args, '--from');
  if (!raw || raw.startsWith('--')) {
    return { step: 'workdir' };
  }

  if (INIT_STEPS.includes(raw as InitStepId)) {
    return { step: raw as InitStepId };
  }

  return {
    error: [
      `Unknown init step: ${raw}`,
      `Supported init steps: ${INIT_STEPS.join(', ')}`
    ].join('\n')
  };
}

async function selectProjectRoot(defaultProjectRoot: string): Promise<string> {
  const selected = await promptLineWithDefault('Project directory', defaultProjectRoot);
  const resolved = path.resolve(defaultProjectRoot, selected ?? defaultProjectRoot);
  await mkdir(resolved, { recursive: true });
  return resolved;
}

async function selectIdeTargets(projectRoot: string, explicitIdeNames: string[]): Promise<
  | { status: 'selected'; environments: EnvironmentDefinition[]; message: string }
  | { status: 'cancelled' }
  | { status: 'failed'; message: string }
> {
  let requestedNames = explicitIdeNames;
  if (!requestedNames.length) {
    const selected = await selectEnvironmentIds(await getAllEnvironmentStatuses(projectRoot));
    if (selected === SELECTION_CANCELLED) {
      return { status: 'cancelled' };
    }

    requestedNames = selected ?? [];
  }

  if (!requestedNames.length) {
    return { status: 'failed', message: 'No AI IDE environments selected.' };
  }

  const resolved = resolveEnvironmentNames(requestedNames);
  if (resolved.unknown.length) {
    return { status: 'failed', message: unknownIdeMessage(resolved.unknown) };
  }

  await initializeEnvironments(projectRoot, resolved.environments);
  return {
    status: 'selected',
    environments: resolved.environments,
    message: `Initialized AI IDE targets: ${resolved.environments.map((environment) => environment.displayName).join(', ')}`
  };
}

async function resolveSkillTargets(
  projectRoot: string,
  selectedIdeTargets: EnvironmentDefinition[],
  explicitIdeNames: string[]
): Promise<{ environments: EnvironmentDefinition[]; error?: string }> {
  if (selectedIdeTargets.length) {
    return { environments: selectedIdeTargets };
  }

  if (explicitIdeNames.length) {
    const resolved = resolveEnvironmentNames(explicitIdeNames);
    if (resolved.unknown.length) {
      return { environments: [], error: unknownIdeMessage(resolved.unknown) };
    }

    return { environments: resolved.environments };
  }

  return { environments: await selectDefaultIdeTargets(projectRoot) };
}

async function selectWorkMode(explicitWorkModeName: string | undefined) {
  if (explicitWorkModeName) {
    const mode = resolveWorkMode(explicitWorkModeName);
    if (!mode) {
      return { status: 'failed' as const, message: unknownWorkModeMessage(explicitWorkModeName) };
    }

    return { status: 'selected' as const, mode };
  }

  const selected = await selectWorkModeId(WORK_MODES);
  if (selected === SELECTION_CANCELLED) {
    return { status: 'cancelled' as const };
  }

  const modeId = selected?.[0] ?? 'skip';
  const mode = resolveWorkMode(modeId);
  if (!mode) {
    return { status: 'failed' as const, message: unknownWorkModeMessage(modeId) };
  }

  return { status: 'selected' as const, mode };
}

export async function runInitFlow(options: InitFlowOptions): Promise<InitFlowResult> {
  const start = resolveInitStartStep(options.args);
  let projectRoot = path.resolve(options.defaultProjectRoot);
  const steps: InitStepResult[] = [];
  const selectedIdeTargets: EnvironmentDefinition[] = [];
  let resolvedSkillTargets: EnvironmentDefinition[] = [];

  if (start.error || !start.step) {
    steps.push({ step: 'workdir', status: 'failed', message: start.error ?? 'Unable to resolve init start step.' });
    return { projectRoot, steps, failed: true };
  }

  const startIndex = INIT_STEPS.indexOf(start.step);
  const shouldRun = (step: InitStepId): boolean => INIT_STEPS.indexOf(step) >= startIndex;

  if (shouldRun('workdir')) {
    try {
      projectRoot = await selectProjectRoot(projectRoot);
      steps.push({ step: 'workdir', status: 'completed', message: projectRoot });
    } catch (error) {
      steps.push({
        step: 'workdir',
        status: 'failed',
        message: error instanceof Error ? error.message : String(error)
      });
      return { projectRoot, steps, failed: true };
    }
  }

  if (shouldRun('ide')) {
    const ideResult = await selectIdeTargets(projectRoot, options.explicitIdeNames ?? []);
    if (ideResult.status === 'cancelled') {
      steps.push({ step: 'ide', status: 'skipped', message: 'Cancelled by user.' });
      return { projectRoot, steps, failed: false };
    }

    if (ideResult.status === 'failed') {
      steps.push({ step: 'ide', status: 'failed', message: ideResult.message });
      return { projectRoot, steps, failed: true };
    }

    selectedIdeTargets.push(...ideResult.environments);
    steps.push({ step: 'ide', status: 'completed', message: ideResult.message });
  }

  if (shouldRun('tml-spec')) {
    const tmlDocsResult = await initializeTmlDocsStructure(projectRoot);
    const failed = tmlDocsStructureHasFailure(tmlDocsResult);
    steps.push({
      step: 'tml-spec',
      status: failed ? 'failed' : 'completed',
      message: failed ? 'TML Docs structure initialization failed.' : 'TML Docs structure initialized.'
    });
    if (failed) {
      return { projectRoot, steps, failed: true };
    }
  }

  if (shouldRun('skills')) {
    const targetResolution = await resolveSkillTargets(projectRoot, selectedIdeTargets, options.explicitIdeNames ?? []);
    if (targetResolution.error) {
      steps.push({
        step: 'skills',
        status: 'failed',
        message: targetResolution.error
      });
      return { projectRoot, steps, failed: true };
    }

    const targetEnvironments = targetResolution.environments;
    resolvedSkillTargets = targetEnvironments;
    if (!targetEnvironments.length) {
      steps.push({
        step: 'skills',
        status: 'failed',
        message: 'No existing supported AI IDE environments found. Run `tmlus ide <ide>` first or pass `--ide <ide>`.'
      });
      return { projectRoot, steps, failed: true };
    }

    const selectedSkills = await selectSkillsForInit();
    if (selectedSkills.status === 'cancelled') {
      steps.push({ step: 'skills', status: 'skipped', message: 'Cancelled by user.' });
      return { projectRoot, steps, failed: false };
    }

    if (selectedSkills.status === 'failed') {
      steps.push({ step: 'skills', status: 'failed', message: selectedSkills.message });
      return { projectRoot, steps, failed: true };
    }

    const installResults = await installSkillsToEnvironments(projectRoot, selectedSkills.skills, targetEnvironments, {
      quiet: options.quiet
    });
    const failed = installResults.some((result) => result.status === 'failed');
    steps.push({
      step: 'skills',
      status: failed ? 'failed' : 'completed',
      message: `${selectedSkills.usedDefault ? 'Default starter Skills' : 'Selected Skills'} processed for ${targetEnvironments.map((environment) => environment.displayName).join(', ')}.`
    });
    if (failed) {
      return { projectRoot, steps, failed: true };
    }
  }

  if (shouldRun('work-mode')) {
    const selected = await selectWorkMode(options.explicitWorkModeName);
    if (selected.status === 'cancelled') {
      steps.push({ step: 'work-mode', status: 'skipped', message: 'Cancelled by user.' });
      return { projectRoot, steps, failed: false };
    }

    if (selected.status === 'failed') {
      steps.push({ step: 'work-mode', status: 'failed', message: selected.message });
      return { projectRoot, steps, failed: true };
    }

    const workModeTargets = selectedIdeTargets.length
      ? selectedIdeTargets
      : resolvedSkillTargets.length
        ? resolvedSkillTargets
        : (options.explicitIdeNames?.length
          ? (await resolveSkillTargets(projectRoot, [], options.explicitIdeNames)).environments
          : []);
    const result = await initializeWorkMode(projectRoot, selected.mode, {
      environments: workModeTargets,
      quiet: options.quiet
    });
    steps.push({
      step: 'work-mode',
      status: result.status === 'failed' ? 'failed' : result.status === 'skipped' ? 'skipped' : 'completed',
      message: result.message
    });

    if (result.status === 'failed') {
      return { projectRoot, steps, failed: true };
    }
  }

  return { projectRoot, steps, failed: steps.some((step) => step.status === 'failed') };
}
