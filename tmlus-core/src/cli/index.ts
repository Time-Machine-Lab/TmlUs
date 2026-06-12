import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInitFlow } from '../app/init-flow.js';
import { getAllEnvironmentStatuses, initializeEnvironments, resolveEnvironmentNames, unknownIdeMessage } from '../app/ide-init.js';
import { initializeTmlDocsStructure, tmlDocsStructureHasFailure } from '../app/tml-docs.js';
import { runTmlusUpdate, tmlusUpdateHasFailure } from '../app/update-flow.js';
import { initializeWorkMode, resolveWorkMode, unknownWorkModeMessage, WORK_MODES } from '../app/work-mode.js';
import {
  defaultTools,
  defaultToolTargets,
  installTool,
  resolveToolIds,
  toolInstallHasFailure,
  unknownToolMessage
} from '../app/tool-install.js';
import {
  defaultSkillTargets,
  installSkills,
  loadDefaultSkills,
  resolveSkillIds,
  resolveSkillTargetEnvironments,
  unknownSkillMessage
} from '../app/skill-install.js';
import {
  defaultSkillSearchSources,
  isSkillSearchRequest,
  searchRemoteSkills,
  SKILL_SEARCH_SENTINEL,
  unknownSkillSearchSourceMessageFromRegistry
} from '../app/skill-search.js';
import { renderHelp } from './command-registry.js';
import { renderStartupBanner } from './banner.js';
import {
  isQuiet,
  parseLanguage,
  printInfo,
  renderIdeInitializationSummary,
  renderInitStepSummary,
  renderSkillCatalogPage,
  renderSkillInstallSummary,
  renderSkillNameList,
  renderSkillSelectionHint,
  renderTmlDocsStructureSummary,
  renderTmlusUpdateSummary,
  renderToolCatalogPage,
  renderToolInstallProgress,
  renderToolInstallSummary,
  renderToolSelectionHint,
  renderWorkModeInitializationSummary,
  withTmlusUpdateAnimation
} from '../ui/output.js';
import {
  SELECTION_CANCELLED,
  selectEnvironmentIds,
  selectRemoteSkillIds,
  selectSearchSourceIds,
  selectSkillIds,
  selectSkillTargetEnvironmentIds,
  selectToolId,
  selectToolTargetEnvironmentIds,
  selectWorkModeId
} from '../ui/selection.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(currentDir, '../../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { name: string; version: string };

const args = process.argv.slice(2);
const projectRoot = process.cwd();
const quiet = isQuiet(args);
const COMMAND_NAMES = new Set(['help', 'version', 'init', 'ide', 'tml-spec', 'work-mode', 'tools', 'skills', 'update']);
const GLOBAL_OPTIONS = new Set(['--quiet', '--no-banner']);
const GLOBAL_OPTIONS_WITH_VALUE = new Set(['--lang', '--language']);

interface CommandResolution {
  command?: string;
  index?: number;
  error?: string;
}

const commandResolution = resolveCommand();

function resolveCommand(): CommandResolution {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (GLOBAL_OPTIONS.has(arg)) {
      continue;
    }

    if (GLOBAL_OPTIONS_WITH_VALUE.has(arg)) {
      index += 1;
      continue;
    }

    if (COMMAND_NAMES.has(arg)) {
      return { command: arg, index };
    }

    if (arg.startsWith('-')) {
      return {
        error: 'Command names now use subcommands without leading dashes. Run `tmlus help` to see supported commands.'
      };
    }

    return { error: `Unknown command: ${arg}` };
  }

  return {};
}

function valueAfter(name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function splitValues(value: string | undefined): string[] {
  if (!value || value.startsWith('--')) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function positionalValuesForCommand(command: string): string[] {
  if (commandResolution.command !== command || commandResolution.index === undefined) {
    return [];
  }

  const values: string[] = [];
  for (const arg of args.slice(commandResolution.index + 1)) {
    if (arg.startsWith('--')) {
      break;
    }

    values.push(...splitValues(arg));
  }

  return values;
}

function printVersion(): void {
  console.log(packageJson.version);
}

async function runHelp(): Promise<void> {
  const language = parseLanguage(args, process.env);
  console.log(renderHelp(language));
}

async function runIde(): Promise<void> {
  let requestedNames = positionalValuesForCommand('ide');
  if (!requestedNames.length) {
    const selected = await selectEnvironmentIds(await getAllEnvironmentStatuses(projectRoot));
    if (selected === SELECTION_CANCELLED) {
      return;
    }

    requestedNames = selected ?? [];
    if (!requestedNames.length) {
      return;
    }
  }

  const targets = requestedNames.length
    ? resolveEnvironmentNames(requestedNames)
    : { environments: [], unknown: [] };

  if (targets.unknown.length) {
    console.error(unknownIdeMessage(targets.unknown));
    process.exitCode = 1;
    return;
  }

  const results = await initializeEnvironments(projectRoot, targets.environments);
  renderIdeInitializationSummary(results, { quiet });
}

async function runTmlSpec(): Promise<void> {
  const result = await initializeTmlDocsStructure(projectRoot);
  renderTmlDocsStructureSummary(result, { quiet });

  if (tmlDocsStructureHasFailure(result)) {
    process.exitCode = 1;
  }
}

async function runWorkMode(): Promise<void> {
  let requestedModes = positionalValuesForCommand('work-mode');
  if (!requestedModes.length && process.stdout.isTTY && process.stdin.isTTY) {
    const selected = await selectWorkModeId(WORK_MODES);
    if (selected === SELECTION_CANCELLED) {
      return;
    }

    requestedModes = selected ?? ['skip'];
  }

  const requestedMode = requestedModes[0] ?? 'skip';
  const mode = resolveWorkMode(requestedMode);
  if (!mode) {
    console.error(unknownWorkModeMessage(requestedMode));
    process.exitCode = 1;
    return;
  }

  const explicitIdeNames = splitValues(valueAfter('--ide'));
  const targetResolution = explicitIdeNames.length
    ? resolveEnvironmentNames(explicitIdeNames)
    : { environments: [], unknown: [] };
  if (targetResolution.unknown.length) {
    console.error(unknownIdeMessage(targetResolution.unknown));
    process.exitCode = 1;
    return;
  }

  const result = await initializeWorkMode(projectRoot, mode, {
    environments: targetResolution.environments,
    quiet
  });
  renderWorkModeInitializationSummary(result, { quiet });

  if (result.status === 'failed') {
    process.exitCode = 1;
  }
}

async function withSkillCatalogLoading<T>(task: () => Promise<T>): Promise<T> {
  if (quiet || !process.stdout.isTTY || process.env.CI || process.env.TERM === 'dumb') {
    return task();
  }

  const bars = ['[    ]', '[=   ]', '[==  ]', '[=== ]', '[====]'];
  let frame = 0;
  const message = 'Loading Skill catalog';
  process.stdout.write(`${message} ${bars[frame]}`);
  const timer = setInterval(() => {
    frame = (frame + 1) % bars.length;
    process.stdout.write(`\r${message} ${bars[frame]}`);
  }, 120);

  try {
    const result = await task();
    clearInterval(timer);
    process.stdout.write(`\rLoaded Skill catalog      \n`);
    return result;
  } catch (error) {
    clearInterval(timer);
    process.stdout.write(`\rSkill catalog load failed\n`);
    throw error;
  }
}

async function runSkills(): Promise<void> {
  let skillIds = positionalValuesForCommand('skills');
  const explicitIdeNames = splitValues(valueAfter('--ide'));
  const explicitSearchSourceNames = splitValues(valueAfter('--search'));
  const catalog = await withSkillCatalogLoading(() => loadDefaultSkills());
  let activeSkillPool = catalog;
  let remoteSkillTitle = 'Remote Skills';

  async function selectSearchedSkills(sourceNames: string[]): Promise<boolean> {
    let requestedSourceNames = sourceNames;
    if (!requestedSourceNames.length && process.stdout.isTTY && process.stdin.isTTY) {
      const selectedSources = await selectSearchSourceIds(await defaultSkillSearchSources());
      if (selectedSources === SELECTION_CANCELLED) {
        return false;
      }

      requestedSourceNames = selectedSources ?? [];
    }

    const remote = await searchRemoteSkills(requestedSourceNames);
    if (remote.unknown.length) {
      console.error(await unknownSkillSearchSourceMessageFromRegistry(remote.unknown));
      process.exitCode = 1;
      return false;
    }

    if (remote.failed.length) {
      printInfo(`Some remote Skill sources used fallback discovery or failed: ${remote.failed.join(', ')}`, { quiet });
    }

    if (!remote.skills.length) {
      printInfo('No remote skills found.', { quiet });
      return false;
    }

    activeSkillPool = remote.skills;
    remoteSkillTitle = requestedSourceNames.length
      ? `Remote Skills (${requestedSourceNames.join(', ')})`
      : 'Remote Skills';
    if (skillIds.length) {
      return true;
    }

    const selectedRemote = await selectRemoteSkillIds(remote.skills, remoteSkillTitle);
    if (selectedRemote === SELECTION_CANCELLED) {
      return false;
    }

    if (selectedRemote === undefined) {
      renderSkillNameList(remoteSkillTitle, remote.skills, { quiet });
      return false;
    }

    skillIds = selectedRemote;
    return skillIds.length > 0;
  }

  if (explicitSearchSourceNames.length || isSkillSearchRequest(skillIds)) {
    const requestedSourceNames = explicitSearchSourceNames.length
      ? explicitSearchSourceNames
      : skillIds.filter((id) => {
        const normalized = id.trim().toLowerCase();
        return normalized !== 'search' && normalized !== SKILL_SEARCH_SENTINEL;
      });
    skillIds = explicitSearchSourceNames.length
      ? skillIds.filter((id) => {
        const normalized = id.trim().toLowerCase();
        return normalized !== 'search' && normalized !== SKILL_SEARCH_SENTINEL;
      })
      : [];

    if (!await selectSearchedSkills(requestedSourceNames)) {
      return;
    }
  }

  if (!skillIds.length) {
    const selected = await selectSkillIds(catalog);
    if (selected === SELECTION_CANCELLED) {
      return;
    }

    if (selected === undefined) {
      renderSkillCatalogPage(catalog);
      renderSkillSelectionHint(catalog);
      return;
    }

    skillIds = selected;
    if (skillIds.includes(SKILL_SEARCH_SENTINEL)) {
      skillIds = [];
      if (!await selectSearchedSkills([])) {
        return;
      }
    }

    if (!skillIds.length) {
      printInfo('No skills selected.', { quiet });
      return;
    }
  }

  const resolvedSkills = resolveSkillIds(skillIds, activeSkillPool);
  if (resolvedSkills.unknown.length) {
    console.error(unknownSkillMessage(resolvedSkills.unknown, activeSkillPool));
    process.exitCode = 1;
    return;
  }

  let targetNames = explicitIdeNames;
  if (!targetNames.length && process.stdout.isTTY && process.stdin.isTTY) {
    const selected = await selectSkillTargetEnvironmentIds(await getAllEnvironmentStatuses(projectRoot));
    if (selected === SELECTION_CANCELLED) {
      return;
    }

    if (selected) {
      targetNames = selected;
    }
  }

  const targetResolution = targetNames.length
    ? resolveSkillTargetEnvironments(targetNames)
    : { environments: await defaultSkillTargets(projectRoot), unknown: [] };

  if (targetResolution.unknown.length) {
    console.error(unknownIdeMessage(targetResolution.unknown));
    process.exitCode = 1;
    return;
  }

  if (!targetResolution.environments.length) {
    console.error('No existing supported AI IDE environments found. Run `tmlus ide <ide>` first or pass `--ide <ide>`.');
    process.exitCode = 1;
    return;
  }

  const results = await installSkills(projectRoot, resolvedSkills.skills, targetResolution.environments, { quiet });
  renderSkillInstallSummary(results, { quiet });

  if (results.some((result) => result.status === 'failed')) {
    process.exitCode = 1;
  }
}

async function runTools(): Promise<void> {
  let toolIds = positionalValuesForCommand('tools');
  const explicitIdeNames = splitValues(valueAfter('--ide'));

  if (!toolIds.length) {
    const selected = await selectToolId(defaultTools());
    if (selected === SELECTION_CANCELLED) {
      return;
    }

    if (selected === undefined) {
      renderToolCatalogPage();
      renderToolSelectionHint(defaultTools());
      return;
    }

    toolIds = selected;
    if (!toolIds.length) {
      printInfo('No tool selected.', { quiet });
      return;
    }
  }

  const resolvedTools = resolveToolIds(toolIds.slice(0, 1));
  if (resolvedTools.unknown.length) {
    console.error(unknownToolMessage(resolvedTools.unknown));
    process.exitCode = 1;
    return;
  }

  const targetResolution = explicitIdeNames.length
    ? resolveEnvironmentNames(explicitIdeNames)
    : { environments: [], unknown: [] };

  if (targetResolution.unknown.length) {
    console.error(unknownIdeMessage(targetResolution.unknown));
    process.exitCode = 1;
    return;
  }

  let targetEnvironments = targetResolution.environments;
  if (!explicitIdeNames.length && process.stdout.isTTY && process.stdin.isTTY) {
    const selected = await selectToolTargetEnvironmentIds(await getAllEnvironmentStatuses(projectRoot));
    if (selected === SELECTION_CANCELLED) {
      return;
    }

    const selectedNames = selected ?? [];
    const selectedResolution = selectedNames.length
      ? resolveEnvironmentNames(selectedNames)
      : { environments: [], unknown: [] };
    if (selectedResolution.unknown.length) {
      console.error(unknownIdeMessage(selectedResolution.unknown));
      process.exitCode = 1;
      return;
    }

    targetEnvironments = selectedResolution.environments;
  } else if (!explicitIdeNames.length) {
    targetEnvironments = await defaultToolTargets(projectRoot);
  }

  const result = await installTool(projectRoot, resolvedTools.tools[0], targetEnvironments, {
    onProgress: (event) => renderToolInstallProgress(event, { quiet })
  });
  if (quiet) {
    renderToolInstallSummary(result, { quiet });
  }

  if (toolInstallHasFailure(result)) {
    process.exitCode = 1;
  }
}

async function runUpdate(): Promise<void> {
  await renderStartupBanner({ args });
  const result = await withTmlusUpdateAnimation(
    () => runTmlusUpdate({
      currentVersion: packageJson.version,
      packageName: packageJson.name,
      env: process.env
    }),
    { quiet }
  );
  renderTmlusUpdateSummary(result, { quiet });

  if (tmlusUpdateHasFailure(result)) {
    process.exitCode = 1;
  }
}

async function runInit(): Promise<void> {
  await renderStartupBanner({ args });
  const result = await runInitFlow({
    args,
    defaultProjectRoot: projectRoot,
    quiet,
    explicitIdeNames: splitValues(valueAfter('--ide')),
    explicitWorkModeName: splitValues(valueAfter('--work-mode'))[0]
  });
  renderInitStepSummary(result.steps, { quiet });

  if (result.failed) {
    process.exitCode = 1;
  }
}

async function main(): Promise<void> {
  if (commandResolution.error) {
    console.error(commandResolution.error);
    process.exitCode = 1;
    return;
  }

  if (commandResolution.command === 'version') {
    printVersion();
    return;
  }

  if (commandResolution.command === 'help') {
    await renderStartupBanner({ args });
    await runHelp();
    return;
  }

  if (commandResolution.command === 'init') {
    await runInit();
    return;
  }

  if (commandResolution.command === 'tml-spec') {
    await runTmlSpec();
    return;
  }

  if (commandResolution.command === 'work-mode') {
    await runWorkMode();
    return;
  }

  if (commandResolution.command === 'tools') {
    await runTools();
    return;
  }

  if (commandResolution.command === 'skills') {
    await runSkills();
    return;
  }

  if (commandResolution.command === 'update') {
    await runUpdate();
    return;
  }

  if (commandResolution.command === 'ide') {
    await runIde();
    return;
  }

  await renderStartupBanner({ args });
  await runHelp();
}

await main();
