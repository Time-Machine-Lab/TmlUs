import * as readline from 'node:readline';
import { stdin, stdout } from 'node:process';
import type { EnvironmentStatus, SkillDefinition, ToolDefinition, WorkModeDefinition } from '../core/types.js';
import type { SkillSearchSource } from '../catalog/skill-catalog.js';
import { canPrompt } from './prompt.js';

interface SelectItem {
  id: string;
  label: string;
  tone: 'ready' | 'partial' | 'empty' | 'skill';
  detail?: string;
}

interface SelectTableColumn {
  title: string;
  width: number;
}

interface SelectTableItem {
  id: string;
  cells: string[];
  detail?: string;
  action?: boolean;
}

interface MultiSelectOptions {
  title: string;
  items: SelectItem[];
  pageSize?: number;
  initialSelectedIds?: string[];
  emptyConfirmIds?: string[];
}

interface MultiSelectTableOptions {
  title: string;
  columns: SelectTableColumn[];
  items: SelectTableItem[];
  pageSize?: number;
  initialSelectedIds?: string[];
  emptyConfirmIds?: string[];
}

export const SELECTION_CANCELLED = Symbol('tmlus.selection.cancelled');
export type SelectionResult = string[] | typeof SELECTION_CANCELLED | undefined;

const color = {
  pink: '\u001B[38;2;255;143;216m',
  aqua: '\u001B[38;2;136;247;255m',
  mint: '\u001B[38;2;170;255;216m',
  gold: '\u001B[38;2;255;230;129m',
  violet: '\u001B[38;2;197;161;255m',
  gray: '\u001B[38;2;104;104;110m',
  white: '\u001B[38;2;255;248;255m',
  dim: '\u001B[2m',
  reset: '\u001B[0m'
} as const;

function paint(value: string, style: string): string {
  return `${style}${value}${color.reset}`;
}

function stripAnsi(value: string): string {
  return value.replace(/\u001B\[[0-9;?]*[A-Za-z]/g, '');
}

function charWidth(char: string): number {
  const codePoint = char.codePointAt(0) ?? 0;

  if (codePoint === 0 || codePoint < 32 || (codePoint >= 0x7f && codePoint < 0xa0)) {
    return 0;
  }

  if (
    codePoint >= 0x1100 && (
      codePoint <= 0x115f
      || codePoint === 0x2329
      || codePoint === 0x232a
      || (codePoint >= 0x2e80 && codePoint <= 0xa4cf)
      || (codePoint >= 0xac00 && codePoint <= 0xd7a3)
      || (codePoint >= 0xf900 && codePoint <= 0xfaff)
      || (codePoint >= 0xfe10 && codePoint <= 0xfe19)
      || (codePoint >= 0xfe30 && codePoint <= 0xfe6f)
      || (codePoint >= 0xff00 && codePoint <= 0xff60)
      || (codePoint >= 0xffe0 && codePoint <= 0xffe6)
      || (codePoint >= 0x1f300 && codePoint <= 0x1faff)
    )
  ) {
    return 2;
  }

  return 1;
}

function visibleWidth(value: string): number {
  return [...stripAnsi(value)].reduce((width, char) => width + charWidth(char), 0);
}

function truncateVisible(value: string, width: number): string {
  const plain = stripAnsi(value);
  if (visibleWidth(plain) <= width) {
    return value;
  }

  const targetWidth = Math.max(0, width - 1);
  let usedWidth = 0;
  let result = '';

  for (const char of [...plain]) {
    const nextWidth = charWidth(char);
    if (usedWidth + nextWidth > targetWidth) {
      break;
    }

    result += char;
    usedWidth += nextWidth;
  }

  return `${result}…`;
}

function wrapVisible(value: string, width: number, maxLines: number): string[] {
  const plain = stripAnsi(value).replace(/\s+/g, ' ').trim();
  const lines: string[] = [];
  let current = '';
  let currentWidth = 0;

  for (const char of [...plain]) {
    const nextWidth = charWidth(char);
    if (current && currentWidth + nextWidth > width) {
      lines.push(current.trimEnd());
      if (lines.length >= maxLines) {
        const lastIndex = lines.length - 1;
        lines[lastIndex] = truncateVisible(lines[lastIndex], width);
        break;
      }

      current = '';
      currentWidth = 0;
    }

    current += char;
    currentWidth += nextWidth;
  }

  if (current && lines.length < maxLines) {
    lines.push(current.trimEnd());
  }

  return lines.length ? lines : [''];
}

function padCell(value: string, width: number): string {
  const truncated = truncateVisible(value, width);
  return `${truncated}${' '.repeat(Math.max(0, width - visibleWidth(truncated)))}`;
}

function terminalFrameWidth(): number {
  return Math.max(32, (stdout.columns ?? 80) - 1);
}

function normalizeFrameLines(lines: string[], width = terminalFrameWidth()): string[] {
  return lines.map((line) => truncateVisible(line, width));
}

function statusGlyph(tone: SelectItem['tone'], selected: boolean): string {
  if (selected) {
    return paint('✦', color.pink);
  }

  if (tone === 'ready') {
    return paint('◆', color.mint);
  }

  if (tone === 'partial') {
    return paint('◐', color.gold);
  }

  if (tone === 'skill') {
    return paint('◇', color.aqua);
  }

  return paint('○', color.gray);
}

function environmentTone(status: EnvironmentStatus): SelectItem['tone'] {
  if (status.kind === 'complete') {
    return 'ready';
  }

  if (status.kind === 'incomplete') {
    return 'partial';
  }

  return 'empty';
}

function environmentStatusRank(status: EnvironmentStatus): number {
  if (status.kind === 'complete') {
    return 0;
  }

  if (status.kind === 'incomplete') {
    return 1;
  }

  return 2;
}

function environmentToItem(status: EnvironmentStatus): SelectItem {
  return {
    id: status.environment.id,
    label: status.environment.displayName,
    tone: environmentTone(status),
    detail: status.kind === 'incomplete'
      ? status.missingDirectories.join('  ')
      : status.environment.requiredDirectories.join('  ')
  };
}

function skillToItem(skill: SkillDefinition): SelectItem {
  return {
    id: skill.id,
    label: skill.name,
    tone: 'skill',
    detail: `${skill.category}  ${skill.description}`
  };
}

function workModeToItem(mode: WorkModeDefinition): SelectItem {
  return {
    id: mode.id,
    label: mode.name,
    tone: mode.id === 'openspec' ? 'ready' : 'empty',
    detail: mode.description
  };
}

function skillToTableItem(skill: SkillDefinition): SelectTableItem {
  return {
    id: skill.id,
    cells: [
      skill.name,
      skill.category,
      skill.description
    ],
    detail: skill.description
  };
}

function recommendationLabel(value: ToolDefinition['recommendation']): string {
  return '★'.repeat(value);
}

function toolToTableItem(tool: ToolDefinition): SelectTableItem {
  return {
    id: tool.id,
    cells: [
      tool.name,
      tool.purpose,
      recommendationLabel(tool.recommendation)
    ],
    detail: `${tool.purpose} ID: ${tool.id}`
  };
}

function writeFrame(lines: string[], renderedLines: number): number {
  const frameLines = normalizeFrameLines(lines);

  if (renderedLines > 0) {
    stdout.write(`\u001B[${renderedLines}A\u001B[J`);
  } else {
    stdout.write('\n');
  }

  stdout.write(`${frameLines.join('\n')}\n`);
  return frameLines.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function renderSelectorFrame(
  options: Required<Pick<MultiSelectOptions, 'title' | 'items' | 'pageSize'>>,
  selectedIds: Set<string>,
  cursor: number
): string[] {
  const frameWidth = terminalFrameWidth();
  const totalPages = Math.max(1, Math.ceil(options.items.length / options.pageSize));
  const safePage = clamp(Math.floor(cursor / options.pageSize), 0, totalPages - 1);
  const start = safePage * options.pageSize;
  const visibleItems = options.items.slice(start, start + options.pageSize);
  const hasPages = totalPages > 1;
  const title = hasPages ? `${options.title} ${paint(`${safePage + 1}/${totalPages}`, color.gray)}` : options.title;
  const lines = [
    `${paint('◆', color.aqua)}  ${paint(title, color.pink)}`
  ];

  for (const [offset, item] of visibleItems.entries()) {
    const index = start + offset;
    const active = index === cursor;
    const selected = selectedIds.has(item.id);
    const branch = index === options.items.length - 1 ? '└' : '│';
    const prefix = active ? paint('▌', color.aqua) : paint(branch, color.violet);
    const nameStyle = active ? color.white : color.gray;
    const glyph = statusGlyph(item.tone, selected);
    const name = paint(item.label, nameStyle);

    lines.push(`${prefix}  ${glyph} ${name}`);

    if (active && item.detail) {
      lines.push(`${paint('│', color.violet)}    ${paint(truncateVisible(item.detail, Math.max(1, frameWidth - 5)), color.gray)}`);
    }
  }

  if (!visibleItems.length) {
    lines.push(`${paint('└', color.violet)}  ${paint('暂无可选项', color.gray)}`);
  }

  return lines;
}

function fitTableColumns(columns: SelectTableColumn[], availableWidth: number): SelectTableColumn[] {
  const gaps = Math.max(0, columns.length - 1) * 2;
  const minimumWidths = [12, 6, 14, 12];
  const fitted = columns.map((column, index) => ({
    ...column,
    width: Math.max(minimumWidths[index] ?? 8, column.width)
  }));

  while (fitted.reduce((sum, column) => sum + column.width, gaps) > availableWidth) {
    const shrinkable = fitted
      .map((column, index) => ({ column, index, minimumWidth: minimumWidths[index] ?? 8 }))
      .filter((item) => item.column.width > item.minimumWidth)
      .sort((left, right) => right.column.width - left.column.width)[0];

    if (!shrinkable) {
      break;
    }

    fitted[shrinkable.index].width -= 1;
  }

  return fitted;
}

function renderTableSelectorFrame(
  options: Required<Pick<MultiSelectTableOptions, 'title' | 'columns' | 'items' | 'pageSize'>>,
  selectedIds: Set<string>,
  cursor: number
): string[] {
  const frameWidth = terminalFrameWidth();
  const fittedColumns = fitTableColumns(options.columns, Math.max(12, frameWidth - 5));
  const totalPages = Math.max(1, Math.ceil(options.items.length / options.pageSize));
  const safePage = clamp(Math.floor(cursor / options.pageSize), 0, totalPages - 1);
  const start = safePage * options.pageSize;
  const visibleItems = options.items.slice(start, start + options.pageSize);
  const hasPages = totalPages > 1;
  const title = hasPages ? `${options.title} ${paint(`${safePage + 1}/${totalPages}`, color.gray)}` : options.title;
  const header = fittedColumns
    .map((column) => padCell(column.title, column.width))
    .join('  ');
  const divider = fittedColumns
    .map((column) => '─'.repeat(column.width))
    .join('  ');
  const lines = [
    `${paint('◆', color.aqua)}  ${paint(title, color.pink)}`,
    `${paint('│', color.violet)}    ${paint(header, color.mint)}`,
    `${paint('│', color.violet)}    ${paint(divider, color.gray)}`
  ];

  for (const [offset, item] of visibleItems.entries()) {
    const index = start + offset;
    const active = index === cursor;
    const selected = selectedIds.has(item.id);
    const branch = index === options.items.length - 1 ? '└' : '│';
    const prefix = active ? paint('▌', color.aqua) : paint(branch, color.violet);
    const glyph = item.action
      ? paint('⌕', color.gold)
      : selected
        ? paint('✦', color.pink)
        : paint('◇', color.aqua);
    const rowStyle = active ? color.white : color.gray;
    const row = item.cells
      .map((cell, cellIndex) => padCell(cell, fittedColumns[cellIndex]?.width ?? 16))
      .join('  ');

    lines.push(`${prefix}  ${glyph} ${paint(row, item.action && active ? color.gold : rowStyle)}`);

    if (active && item.detail) {
      const detailWidth = Math.max(1, frameWidth - 5);
      const detailLines = Math.max(1, Math.ceil(visibleWidth(item.detail) / detailWidth));
      for (const line of wrapVisible(item.detail, detailWidth, detailLines)) {
        lines.push(`${paint('│', color.violet)}    ${paint(line, color.gray)}`);
      }
    }
  }

  if (!visibleItems.length) {
    lines.push(`${paint('└', color.violet)}  ${paint('暂无可选项', color.gray)}`);
  }

  return lines;
}

async function multiSelect(options: MultiSelectOptions): Promise<SelectionResult> {
  if (!canPrompt()) {
    return undefined;
  }

  if (!options.items.length) {
    return [];
  }

  const pageSize = options.pageSize ?? 12;
  const itemIds = options.items.map((item) => item.id);
  const selectedIds = new Set(options.initialSelectedIds?.filter((id) => itemIds.includes(id)) ?? []);
  let cursor = 0;
  let renderedLines = 0;
  let rawModeWasEnabled = false;

  readline.emitKeypressEvents(stdin);
  stdin.resume();

  if (stdin.isTTY) {
    rawModeWasEnabled = stdin.isRaw ?? false;
    stdin.setRawMode(true);
  }

  stdout.write('\u001B[?25l');

  return new Promise((resolve: (value: SelectionResult) => void) => {
    const cleanup = (): void => {
      stdin.off('keypress', onKeypress);
      if (stdin.isTTY) {
        stdin.setRawMode(rawModeWasEnabled);
      }
      stdin.pause();
      stdout.write('\u001B[?25h');
    };

    const finish = (value: SelectionResult): void => {
      cleanup();
      resolve(value);
    };

    const render = (): void => {
      renderedLines = writeFrame(
        renderSelectorFrame({ title: options.title, items: options.items, pageSize }, selectedIds, cursor),
        renderedLines
      );
    };

    const toggleCurrent = (): void => {
      const id = options.items[cursor]?.id;
      if (!id) {
        return;
      }

      if (selectedIds.has(id)) {
        selectedIds.delete(id);
      } else {
        selectedIds.add(id);
      }
    };

    const toggleAll = (): void => {
      if (selectedIds.size === options.items.length) {
        selectedIds.clear();
        return;
      }

      for (const id of itemIds) {
        selectedIds.add(id);
      }
    };

    const onKeypress = (_value: string, key: readline.Key): void => {
      if (key.ctrl && key.name === 'c') {
        finish(SELECTION_CANCELLED);
        return;
      }

      switch (key.name) {
        case 'up':
          cursor = clamp(cursor - 1, 0, options.items.length - 1);
          break;
        case 'down':
          cursor = clamp(cursor + 1, 0, options.items.length - 1);
          break;
        case 'pageup':
        case 'left':
          cursor = clamp(cursor - pageSize, 0, options.items.length - 1);
          break;
        case 'pagedown':
        case 'right':
          cursor = clamp(cursor + pageSize, 0, options.items.length - 1);
          break;
        case 'space':
          toggleCurrent();
          break;
        case 'a':
          toggleAll();
          break;
        case 'return':
          finish(selectedIds.size ? [...selectedIds] : (options.emptyConfirmIds ?? []));
          return;
        case 'escape':
          finish(SELECTION_CANCELLED);
          return;
        case 'q':
          finish(SELECTION_CANCELLED);
          return;
        default:
          break;
      }

      render();
    };

    stdin.on('keypress', onKeypress);
    render();
  });
}

async function singleSelect(options: MultiSelectOptions): Promise<SelectionResult> {
  if (!canPrompt()) {
    return undefined;
  }

  if (!options.items.length) {
    return [];
  }

  const pageSize = options.pageSize ?? 12;
  const selectedIds = new Set<string>();
  let cursor = 0;
  let renderedLines = 0;
  let rawModeWasEnabled = false;

  readline.emitKeypressEvents(stdin);
  stdin.resume();

  if (stdin.isTTY) {
    rawModeWasEnabled = stdin.isRaw ?? false;
    stdin.setRawMode(true);
  }

  stdout.write('\u001B[?25l');

  return new Promise((resolve: (value: SelectionResult) => void) => {
    const cleanup = (): void => {
      stdin.off('keypress', onKeypress);
      if (stdin.isTTY) {
        stdin.setRawMode(rawModeWasEnabled);
      }
      stdin.pause();
      stdout.write('\u001B[?25h');
    };

    const finish = (value: SelectionResult): void => {
      cleanup();
      resolve(value);
    };

    const render = (): void => {
      renderedLines = writeFrame(
        renderSelectorFrame({ title: options.title, items: options.items, pageSize }, selectedIds, cursor),
        renderedLines
      );
    };

    const onKeypress = (_value: string, key: readline.Key): void => {
      if (key.ctrl && key.name === 'c') {
        finish(SELECTION_CANCELLED);
        return;
      }

      switch (key.name) {
        case 'up':
          cursor = clamp(cursor - 1, 0, options.items.length - 1);
          break;
        case 'down':
          cursor = clamp(cursor + 1, 0, options.items.length - 1);
          break;
        case 'pageup':
        case 'left':
          cursor = clamp(cursor - pageSize, 0, options.items.length - 1);
          break;
        case 'pagedown':
        case 'right':
          cursor = clamp(cursor + pageSize, 0, options.items.length - 1);
          break;
        case 'space':
        case 'return':
          finish([options.items[cursor].id]);
          return;
        case 'escape':
        case 'q':
          finish(SELECTION_CANCELLED);
          return;
        default:
          break;
      }

      render();
    };

    stdin.on('keypress', onKeypress);
    render();
  });
}

async function singleSelectTable(options: MultiSelectTableOptions): Promise<SelectionResult> {
  if (!canPrompt()) {
    return undefined;
  }

  if (!options.items.length) {
    return [];
  }

  const pageSize = options.pageSize ?? 10;
  const selectedIds = new Set<string>();
  let cursor = 0;
  let renderedLines = 0;
  let rawModeWasEnabled = false;

  readline.emitKeypressEvents(stdin);
  stdin.resume();

  if (stdin.isTTY) {
    rawModeWasEnabled = stdin.isRaw ?? false;
    stdin.setRawMode(true);
  }

  stdout.write('\u001B[?25l');

  return new Promise((resolve: (value: SelectionResult) => void) => {
    const cleanup = (): void => {
      stdin.off('keypress', onKeypress);
      if (stdin.isTTY) {
        stdin.setRawMode(rawModeWasEnabled);
      }
      stdin.pause();
      stdout.write('\u001B[?25h');
    };

    const finish = (value: SelectionResult): void => {
      cleanup();
      resolve(value);
    };

    const render = (): void => {
      renderedLines = writeFrame(
        renderTableSelectorFrame(
          { title: options.title, columns: options.columns, items: options.items, pageSize },
          selectedIds,
          cursor
        ),
        renderedLines
      );
    };

    const onKeypress = (_value: string, key: readline.Key): void => {
      if (key.ctrl && key.name === 'c') {
        finish(SELECTION_CANCELLED);
        return;
      }

      switch (key.name) {
        case 'up':
          cursor = clamp(cursor - 1, 0, options.items.length - 1);
          break;
        case 'down':
          cursor = clamp(cursor + 1, 0, options.items.length - 1);
          break;
        case 'pageup':
        case 'left':
          cursor = clamp(cursor - pageSize, 0, options.items.length - 1);
          break;
        case 'pagedown':
        case 'right':
          cursor = clamp(cursor + pageSize, 0, options.items.length - 1);
          break;
        case 'space':
        case 'return':
          finish([options.items[cursor].id]);
          return;
        case 'escape':
        case 'q':
          finish(SELECTION_CANCELLED);
          return;
        default:
          break;
      }

      render();
    };

    stdin.on('keypress', onKeypress);
    render();
  });
}

async function multiSelectTable(options: MultiSelectTableOptions): Promise<SelectionResult> {
  if (!canPrompt()) {
    return undefined;
  }

  if (!options.items.length) {
    return [];
  }

  const pageSize = options.pageSize ?? 10;
  const itemIds = options.items.filter((item) => !item.action).map((item) => item.id);
  const selectedIds = new Set(options.initialSelectedIds?.filter((id) => itemIds.includes(id)) ?? []);
  let cursor = 0;
  let renderedLines = 0;
  let rawModeWasEnabled = false;

  readline.emitKeypressEvents(stdin);
  stdin.resume();

  if (stdin.isTTY) {
    rawModeWasEnabled = stdin.isRaw ?? false;
    stdin.setRawMode(true);
  }

  stdout.write('\u001B[?25l');

  return new Promise((resolve: (value: SelectionResult) => void) => {
    const cleanup = (): void => {
      stdin.off('keypress', onKeypress);
      if (stdin.isTTY) {
        stdin.setRawMode(rawModeWasEnabled);
      }
      stdin.pause();
      stdout.write('\u001B[?25h');
    };

    const finish = (value: SelectionResult): void => {
      cleanup();
      resolve(value);
    };

    const render = (): void => {
      renderedLines = writeFrame(
        renderTableSelectorFrame(
          { title: options.title, columns: options.columns, items: options.items, pageSize },
          selectedIds,
          cursor
        ),
        renderedLines
      );
    };

    const toggleCurrent = (): void => {
      const item = options.items[cursor];
      const id = item?.id;
      if (!id) {
        return;
      }

      if (item.action) {
        selectedIds.clear();
        return;
      }

      if (selectedIds.has(id)) {
        selectedIds.delete(id);
      } else {
        selectedIds.add(id);
      }
    };

    const toggleAll = (): void => {
      if (selectedIds.size === options.items.length) {
        selectedIds.clear();
        return;
      }

      for (const id of itemIds) {
        selectedIds.add(id);
      }
    };

    const onKeypress = (_value: string, key: readline.Key): void => {
      if (key.ctrl && key.name === 'c') {
        finish(SELECTION_CANCELLED);
        return;
      }

      switch (key.name) {
        case 'up':
          cursor = clamp(cursor - 1, 0, options.items.length - 1);
          break;
        case 'down':
          cursor = clamp(cursor + 1, 0, options.items.length - 1);
          break;
        case 'pageup':
        case 'left':
          cursor = clamp(cursor - pageSize, 0, options.items.length - 1);
          break;
        case 'pagedown':
        case 'right':
          cursor = clamp(cursor + pageSize, 0, options.items.length - 1);
          break;
        case 'space':
          toggleCurrent();
          break;
        case 'a':
          toggleAll();
          break;
        case 'return':
          if (options.items[cursor]?.action) {
            finish([options.items[cursor].id]);
            return;
          }

          finish(selectedIds.size ? [...selectedIds] : (options.emptyConfirmIds ?? []));
          return;
        case 'escape':
        case 'q':
          finish(SELECTION_CANCELLED);
          return;
        default:
          break;
      }

      render();
    };

    stdin.on('keypress', onKeypress);
    render();
  });
}

export async function selectEnvironmentIds(statuses: EnvironmentStatus[]): Promise<SelectionResult> {
  return multiSelect({
    title: 'AI IDE',
    items: statuses.map(environmentToItem),
    emptyConfirmIds: []
  });
}

export async function selectSkillIds(skills: SkillDefinition[], pageSize = 12): Promise<SelectionResult> {
  return multiSelectTable({
    title: 'Skills',
    columns: [
      { title: 'Name', width: 22 },
      { title: 'Category', width: 10 },
      { title: 'Description', width: 56 }
    ],
    items: [
      ...skills.map(skillToTableItem),
      {
        id: '__search__',
        cells: ['Search', 'Remote', '搜索远程 Skill 来源'],
        detail: '从已配置的远程 Skill 来源发现更多技能，选中后复用当前安装流程。',
        action: true
      }
    ],
    pageSize
  });
}

export async function selectInitSkillIds(skills: SkillDefinition[], pageSize = 12): Promise<SelectionResult> {
  return multiSelectTable({
    title: 'Init Skills',
    columns: [
      { title: 'Name', width: 22 },
      { title: 'Category', width: 10 },
      { title: 'Description', width: 56 }
    ],
    items: [
      {
        id: '__starter_defaults__',
        cells: ['Use defaults', 'Starter', 'Install skill-creator and tml-docs-spec-generate'],
        detail: 'Skip custom Skill selection and install the TmlUs starter Skill set.',
        action: true
      },
      ...skills.map(skillToTableItem)
    ],
    pageSize
  });
}

export async function selectSearchSourceIds(sources: SkillSearchSource[]): Promise<SelectionResult> {
  return multiSelect({
    title: 'Search Source',
    items: sources.map((source) => ({
      id: source.id,
      label: source.displayName,
      tone: 'skill',
      detail: source.description ?? source.source ?? source.category
    })),
    pageSize: 6
  });
}

export async function selectRemoteSkillIds(skills: SkillDefinition[], title = 'Remote Skills', pageSize = 12): Promise<SelectionResult> {
  return multiSelectTable({
    title,
    columns: [
      { title: 'Name', width: 24 },
      { title: 'Category', width: 14 },
      { title: 'Description', width: 50 }
    ],
    items: skills.map((skill) => ({
      id: skill.id,
      cells: [skill.name, skill.category, skill.description],
      detail: skill.description
    })),
    pageSize
  });
}

export async function selectToolId(tools: ToolDefinition[], pageSize = 12): Promise<SelectionResult> {
  return singleSelectTable({
    title: 'Tools',
    columns: [
      { title: 'Name', width: 18 },
      { title: 'Purpose', width: 58 },
      { title: 'Recommend', width: 10 }
    ],
    items: tools.map(toolToTableItem),
    pageSize
  });
}

export async function selectSkillTargetEnvironmentIds(statuses: EnvironmentStatus[]): Promise<SelectionResult> {
  const sorted = [...statuses].sort((left, right) => environmentStatusRank(left) - environmentStatusRank(right));
  const existingIds = sorted
    .filter((status) => status.kind !== 'missing')
    .map((status) => status.environment.id);

  return multiSelect({
    title: 'Install To',
    items: sorted.map(environmentToItem),
    initialSelectedIds: [],
    emptyConfirmIds: existingIds
  });
}

export async function selectToolTargetEnvironmentIds(statuses: EnvironmentStatus[]): Promise<SelectionResult> {
  const supportedIds = new Set(['codex', 'claude', 'cursor']);
  const sorted = [...statuses]
    .filter((status) => supportedIds.has(status.environment.id))
    .sort((left, right) => environmentStatusRank(left) - environmentStatusRank(right));
  const existingIds = sorted
    .filter((status) => status.kind !== 'missing')
    .map((status) => status.environment.id);

  return multiSelect({
    title: 'CodeGraph MCP',
    items: sorted.map(environmentToItem),
    initialSelectedIds: existingIds,
    emptyConfirmIds: existingIds
  });
}

export async function selectWorkModeId(modes: WorkModeDefinition[]): Promise<SelectionResult> {
  return singleSelect({
    title: 'Work Mode',
    items: modes.map(workModeToItem),
    pageSize: 6
  });
}

export const selectionRenderTestApi = {
  normalizeFrameLines,
  stripAnsi,
  visibleWidth
};
