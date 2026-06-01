import type {
  DirectoryEnsureResult,
  FileEnsureResult,
  IdeInitializationResult,
  Language,
  SkillDefinition,
  SkillInstallResult,
  TmlDocsStructureResult,
  ToolDefinition,
  ToolInstallProgressEvent,
  ToolInstallResult,
  WorkModeInitializationResult
} from '../core/types.js';
import { SKILL_CATALOG } from '../catalog/skills.js';
import { TOOL_CATALOG } from '../catalog/tools.js';

export interface OutputOptions {
  quiet?: boolean;
}

const color = {
  pink: '\u001B[38;2;255;143;216m',
  aqua: '\u001B[38;2;136;247;255m',
  mint: '\u001B[38;2;170;255;216m',
  gold: '\u001B[38;2;255;230;129m',
  violet: '\u001B[38;2;197;161;255m',
  gray: '\u001B[38;2;104;104;110m',
  white: '\u001B[38;2;255;248;255m',
  reset: '\u001B[0m'
} as const;

function paint(value: string, style: string, options: OutputOptions = {}): string {
  if (options.quiet || !shouldUseColor()) {
    return value;
  }

  return `${style}${value}${color.reset}`;
}

function shouldUseColor(): boolean {
  if (!process.stdout.isTTY || process.env.NO_COLOR || process.env.CI) {
    return false;
  }

  return process.env.TERM !== 'dumb';
}

export function parseLanguage(args: string[], env: NodeJS.ProcessEnv): Language {
  const langIndex = args.findIndex((arg) => arg === '--lang' || arg === '--language');
  const raw = langIndex >= 0 ? args[langIndex + 1] : env.TMLUS_LANG;
  return raw?.toLowerCase().startsWith('en') ? 'en' : 'zh';
}

export function isQuiet(args: string[]): boolean {
  return args.includes('--quiet');
}

export function printSection(title: string, options: OutputOptions = {}): void {
  if (options.quiet) {
    return;
  }

  console.log(`\n${paint('◆', color.aqua, options)} ${paint(title, color.pink, options)}`);
}

export function printInfo(message: string, options: OutputOptions = {}): void {
  if (!options.quiet) {
    console.log(message);
  }
}

function pad(value: string, width: number): string {
  return value.length >= width ? `${value.slice(0, Math.max(0, width - 1))}…` : value.padEnd(width);
}

function statusLabel(status: DirectoryEnsureResult['status'], options: OutputOptions = {}): string {
  if (status === 'created') {
    return `${paint('✦', color.pink, options)} [created]`;
  }

  if (status === 'existing') {
    return `${paint('◆', color.mint, options)} [existing]`;
  }

  return `${paint('×', color.pink, options)} [failed]`;
}

export function formatDirectoryResult(result: DirectoryEnsureResult, options: OutputOptions = {}): string {
  const suffix = result.error ? `  ${result.error}` : '';
  return `${statusLabel(result.status, options)} ${result.path}${suffix}`;
}

export function formatFileResult(result: FileEnsureResult, options: OutputOptions = {}): string {
  const suffix = result.error ? `  ${result.error}` : '';
  return `${statusLabel(result.status, options)} ${result.path}${suffix}`;
}

export function renderIdeInitializationSummary(results: IdeInitializationResult[], options: OutputOptions = {}): void {
  printSection('AI IDE 初始化结果', options);

  for (const result of results) {
    const statusIcon = result.statusBefore === 'complete'
      ? paint('◆', color.mint, options)
      : result.statusBefore === 'incomplete'
        ? paint('◐', color.gold, options)
        : paint('○', color.gray, options);
    printInfo(`\n${paint('│', color.violet, options)}  ${statusIcon} ${paint(result.environment.displayName, color.white, options)}`, options);
    for (const directory of result.directories) {
      printInfo(`${paint('│', color.violet, options)}    ${formatDirectoryResult(directory, options)}`, options);
    }
  }
}

export function renderSkillCatalogPage(page = 1, pageSize = 8): void {
  const totalPages = Math.max(1, Math.ceil(SKILL_CATALOG.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  const skills = SKILL_CATALOG.slice(start, start + pageSize);

  printSection(`Skill 列表 ${safePage}/${totalPages}`);
  console.log(`${paint('│', color.violet)}  ${paint(`${pad('Name', 24)} ${pad('Category', 10)} Description`, color.mint)}`);
  console.log(`${paint('│', color.violet)}  ${paint(`${'─'.repeat(24)} ${'─'.repeat(10)} ${'─'.repeat(52)}`, color.gray)}`);

  for (const skill of skills) {
    console.log(`${paint('│', color.violet)}  ${paint('◇', color.aqua)} ${pad(skill.name, 22)} ${pad(skill.category, 10)} ${skill.description}`);
    console.log(`${paint('│', color.violet)}    ID: ${skill.id}`);
    console.log(`${paint('│', color.violet)}    分类: ${skill.category}`);
    console.log(`${paint('│', color.violet)}    功能: ${skill.description}`);
  }
}

export function renderSkillNameList(title: string, skills: SkillDefinition[], options: OutputOptions = {}): void {
  printSection(title, options);

  for (const skill of skills) {
    printInfo(`${paint('│', color.violet, options)}  ${paint('◇', color.aqua, options)} ${skill.name}`, options);
  }
}

function toolRecommendationLabel(tool: ToolDefinition): string {
  return '★'.repeat(tool.recommendation);
}

export function renderToolCatalogPage(page = 1, pageSize = 8): void {
  const totalPages = Math.max(1, Math.ceil(TOOL_CATALOG.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  const tools = TOOL_CATALOG.slice(start, start + pageSize);

  printSection(`Tool list ${safePage}/${totalPages}`);
  console.log(`${paint('|', color.violet)}  ${paint(`${pad('Name', 18)} ${pad('Recommend', 10)} Purpose`, color.mint)}`);
  console.log(`${paint('|', color.violet)}  ${paint(`${'-'.repeat(18)} ${'-'.repeat(10)} ${'-'.repeat(58)}`, color.gray)}`);

  for (const tool of tools) {
    console.log(`${paint('|', color.violet)}  ${paint('*', color.aqua)} ${pad(tool.name, 16)} ${pad(toolRecommendationLabel(tool), 10)} ${tool.purpose}`);
    console.log(`${paint('|', color.violet)}    ID: ${tool.id}`);
  }
}

export function renderToolInstallSummary(result: ToolInstallResult, options: OutputOptions = {}): void {
  printSection('Tool install result', options);

  for (const action of result.actions) {
    const icon = action.status === 'failed'
      ? paint('x', color.pink, options)
      : action.status === 'skipped'
        ? paint('-', color.gold, options)
        : paint('ok', color.pink, options);
    const target = action.target ? `  ${action.target}` : '';
    printInfo(`${paint('|', color.violet, options)}  ${icon} [${action.status}] ${action.label}${target}  ${action.message}`, options);
  }
}

export function renderToolInstallProgress(event: ToolInstallProgressEvent, options: OutputOptions = {}): void {
  if (options.quiet) {
    return;
  }

  if (event.type === 'plan') {
    printSection(event.title, options);
    for (const line of event.lines) {
      printInfo(`${paint('|', color.violet, options)}  ${line}`, options);
    }
    return;
  }

  if (event.type === 'step-start') {
    printInfo(`\n${paint('|', color.violet, options)}  [${event.step}/${event.total}] ${event.title}`, options);
    if (event.detail) {
      printInfo(`${paint('|', color.violet, options)}      ${event.detail}`, options);
    }
    return;
  }

  if (event.type === 'step-result') {
    const action = event.action;
    const icon = action.status === 'failed'
      ? paint('x', color.pink, options)
      : action.status === 'skipped'
        ? paint('-', color.gold, options)
        : paint('ok', color.pink, options);
    const target = action.target ? `  ${action.target}` : '';
    printInfo(`${paint('|', color.violet, options)}      ${icon} [${action.status}] ${action.label}${target}  ${action.message}`, options);
    return;
  }

  printInfo(`\n${paint('|', color.violet, options)}  ${event.message}`, options);
}

export function renderToolSelectionHint(tools: ToolDefinition[]): void {
  if (tools.length === 0) {
    return;
  }

  console.log(`\n${paint('*', color.aqua)} ${paint('Direct', color.pink)}`);
  console.log(`${paint('|', color.violet)}  tmlus tools ${tools[0]?.id ?? '<tool-id>'}`);
}

export function renderSkillInstallSummary(results: SkillInstallResult[], options: OutputOptions = {}): void {
  printSection('Skill 安装结果', options);

  for (const result of results) {
    const target = `${result.skill.id} -> ${result.environment.displayName}`;
    const icon = result.status === 'installed'
      ? paint('✦', color.pink, options)
      : result.status === 'skipped'
        ? paint('◇', color.aqua, options)
        : paint('×', color.pink, options);
    const location = result.targetPath ? `  ${result.targetPath}` : '';
    const suffix = result.status === 'skipped' && !result.targetPath
      ? '  跳过'
      : result.status === 'failed'
        ? '  失败'
        : '';
    printInfo(`${paint('│', color.violet, options)}  ${icon} ${target}${location}${suffix}`, options);
  }
}

export function renderSkillInstallStart(skillCount: number, environmentCount: number, options: OutputOptions = {}): void {
  printInfo(`Installing ${skillCount} skill(s) to ${environmentCount} AI IDE environment(s)...`, options);
}

export function renderSkillInstallBatchStart(batchNumber: number, totalBatches: number, labels: string[], options: OutputOptions = {}): void {
  printInfo(`Starting skill install batch ${batchNumber}/${totalBatches}: ${labels.join(', ')}`, options);
}

export function renderSkillDownloadProgress(done: number, total: number, label: string, options: OutputOptions = {}): void {
  if (options.quiet) {
    return;
  }

  const percent = total > 0 ? Math.round((done / total) * 100) : 100;
  console.log(`${paint('✦', color.pink, options)} ${pad(`[${done}/${total}]`, 8)} ${pad(`${percent}%`, 5)} ${label}`);
}

export function renderTmlDocsStructureSummary(result: TmlDocsStructureResult, options: OutputOptions = {}): void {
  printSection('TML Docs structure result', options);

  for (const directory of result.directories) {
    printInfo(`  ${formatDirectoryResult(directory, options)}`, options);
  }

  for (const file of result.files) {
    printInfo(`  ${formatFileResult(file, options)}`, options);
  }
}

export function renderWorkModeInitializationSummary(result: WorkModeInitializationResult, options: OutputOptions = {}): void {
  printSection('Work mode result', options);
  printInfo(`  [${result.status}] ${result.mode.name}  ${result.message}`, options);
}

export function renderWorkModeInitializationStart(modeName: string, targetTools: string, options: OutputOptions = {}): void {
  printInfo(`Initializing work mode ${modeName} with tools: ${targetTools}...`, options);
}

export function renderWorkModeCommandStart(command: string, options: OutputOptions = {}): void {
  printInfo(`Running ${command}`, options);
}

export function renderInitStepSummary(
  results: Array<{ step: string; status: 'completed' | 'skipped' | 'failed'; message: string }>,
  options: OutputOptions = {}
): void {
  printSection('Init result', options);

  for (const result of results) {
    printInfo(`  [${result.status}] ${result.step}  ${result.message}`, options);
  }
}

export function renderSkillSelectionHint(skills: SkillDefinition[]): void {
  if (skills.length === 0) {
    return;
  }

  console.log(`\n${paint('◆', color.aqua)} ${paint('Direct', color.pink)}`);
  console.log(`${paint('│', color.violet)}  tmlus skills ${skills[0]?.id ?? '<skill-id>'}`);
  console.log(`${paint('│', color.violet)}  tmlus skills <skill-id> --ide codex`);
}
