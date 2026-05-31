import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInitFlow } from '../app/init-flow.js';
import { getAllEnvironmentStatuses, initializeEnvironments, resolveEnvironmentNames, unknownIdeMessage } from '../app/ide-init.js';
import { initializeTmlDocsStructure, tmlDocsStructureHasFailure } from '../app/tml-docs.js';
import { initializeWorkMode, resolveWorkMode, unknownWorkModeMessage, WORK_MODES } from '../app/work-mode.js';
import {
  defaultSkillTargets,
  defaultSkills,
  installSkills,
  resolveSkillIds,
  resolveSkillTargetEnvironments,
  unknownSkillMessage
} from '../app/skill-install.js';
import {
  isSkillSearchRequest,
  searchRemoteSkills,
  SKILL_SEARCH_SENTINEL,
  unknownSkillSearchSourceMessage
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
  renderWorkModeInitializationSummary
} from '../ui/output.js';
import {
  SELECTION_CANCELLED,
  selectEnvironmentIds,
  selectRemoteSkillIds,
  selectSearchSourceIds,
  selectSkillIds,
  selectSkillTargetEnvironmentIds,
  selectWorkModeId
} from '../ui/selection.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(currentDir, '../../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version: string };

const args = process.argv.slice(2);
const projectRoot = process.cwd();
const quiet = isQuiet(args);

function hasArg(...names: string[]): boolean {
  return args.some((arg) => names.includes(arg));
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

function positionalValuesAfter(flag: string): string[] {
  const index = args.indexOf(flag);
  if (index < 0) {
    return [];
  }

  const values: string[] = [];
  for (const arg of args.slice(index + 1)) {
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
  let requestedNames = positionalValuesAfter('--ide');
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
  let requestedModes = positionalValuesAfter('--work-mode');
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

  const result = await initializeWorkMode(projectRoot, mode, { environments: targetResolution.environments });
  renderWorkModeInitializationSummary(result, { quiet });

  if (result.status === 'failed') {
    process.exitCode = 1;
  }
}

async function runSkills(): Promise<void> {
  let skillIds = positionalValuesAfter('--skills');
  const explicitIdeNames = splitValues(valueAfter('--ide'));
  const explicitSearchSourceNames = splitValues(valueAfter('--search'));
  let activeSkillPool = defaultSkills();

  async function selectSearchedSkills(sourceNames: string[]): Promise<boolean> {
    let requestedSourceNames = sourceNames;
    if (!requestedSourceNames.length && process.stdout.isTTY && process.stdin.isTTY) {
      const selectedSources = await selectSearchSourceIds();
      if (selectedSources === SELECTION_CANCELLED) {
        return false;
      }

      requestedSourceNames = selectedSources ?? [];
    }

    const remote = await searchRemoteSkills(requestedSourceNames);
    if (remote.unknown.length) {
      console.error(unknownSkillSearchSourceMessage(remote.unknown));
      process.exitCode = 1;
      return false;
    }

    if (!remote.skills.length) {
      printInfo('No remote skills found.', { quiet });
      return false;
    }

    activeSkillPool = remote.skills;
    if (skillIds.length) {
      return true;
    }

    const selectedRemote = await selectRemoteSkillIds(remote.skills);
    if (selectedRemote === SELECTION_CANCELLED) {
      return false;
    }

    if (selectedRemote === undefined) {
      renderSkillNameList('TML Team Skills', remote.skills, { quiet });
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
    skillIds = skillIds.filter((id) => {
      const normalized = id.trim().toLowerCase();
      return normalized !== 'search' && normalized !== SKILL_SEARCH_SENTINEL;
    });

    if (!await selectSearchedSkills(requestedSourceNames)) {
      return;
    }
  }

  if (!skillIds.length) {
    const selected = await selectSkillIds(defaultSkills());
    if (selected === SELECTION_CANCELLED) {
      return;
    }

    if (selected === undefined) {
      renderSkillCatalogPage();
      renderSkillSelectionHint(defaultSkills());
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

  const usingDefaultCatalog = activeSkillPool === defaultSkills();
  const resolvedSkills = usingDefaultCatalog
    ? resolveSkillIds(skillIds)
    : {
      skills: activeSkillPool.filter((skill) => skillIds.includes(skill.id)),
      unknown: skillIds.filter((id) => !activeSkillPool.some((skill) => skill.id === id))
    };
  if (resolvedSkills.unknown.length) {
    console.error(unknownSkillMessage(resolvedSkills.unknown));
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
    console.error('No existing supported AI IDE environments found. Run `tmlus --ide <ide>` first or pass `--ide <ide>`.');
    process.exitCode = 1;
    return;
  }

  const results = await installSkills(projectRoot, resolvedSkills.skills, targetResolution.environments, { quiet });
  renderSkillInstallSummary(results, { quiet });

  if (results.some((result) => result.status === 'failed')) {
    process.exitCode = 1;
  }
}

async function runInit(): Promise<void> {
  await renderStartupBanner({ args });
  const result = await runInitFlow({
    args,
    defaultProjectRoot: projectRoot,
    quiet,
    explicitIdeNames: positionalValuesAfter('--ide'),
    explicitWorkModeName: positionalValuesAfter('--work-mode')[0]
  });
  renderInitStepSummary(result.steps, { quiet });

  if (result.failed) {
    process.exitCode = 1;
  }
}

async function main(): Promise<void> {
  if (hasArg('--version', '-v')) {
    printVersion();
    return;
  }

  if (hasArg('--help', '-h')) {
    await renderStartupBanner({ args });
    await runHelp();
    return;
  }

  if (args[0] === 'init') {
    await runInit();
    return;
  }

  if (hasArg('--tml-spec')) {
    await runTmlSpec();
    return;
  }

  if (hasArg('--work-mode')) {
    await runWorkMode();
    return;
  }

  if (hasArg('--skills')) {
    await runSkills();
    return;
  }

  if (hasArg('--ide')) {
    await runIde();
    return;
  }

  await renderStartupBanner({ args });
  await runHelp();
}

await main();
