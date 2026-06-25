import { cp, mkdir, mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type {
  ToolDefinition,
  ToolInstallActionResult,
  ToolInstallProgressEvent,
  ToolInstallResult
} from '../../core/types.js';
import { downloadGitHubPaths } from './github-skill-source.js';

const SKILLCLAW_REQUIRED_FILES = ['install-runbook.md', 'skillclaw-help.md', 'tml-team-config-guide.md', 'manifest.json'];

export interface ToolDocumentPackageManifest {
  id: string;
  version: number;
  updatedAt: string;
  source: string;
  files: string[];
}

export interface ToolEnvState {
  rootPath: string;
  toolPath: string;
  status: 'missing' | 'incomplete' | 'complete';
  missingFiles: string[];
  manifest?: ToolDocumentPackageManifest;
}

export interface PrepareToolDocumentPackageOptions {
  homeDir?: string;
  envRoot?: string;
  force?: boolean;
  downloader?: (source: string, includePaths: string[], destinationPath: string) => Promise<boolean>;
  onProgress?: (event: ToolInstallProgressEvent) => void;
}

export function resolveToolEnvRoot(options: { homeDir?: string; envRoot?: string } = {}): string {
  return path.resolve(options.envRoot ?? path.join(options.homeDir ?? os.homedir(), '.tmlus', 'env'));
}

export function resolveToolEnvPath(toolId: string, options: { homeDir?: string; envRoot?: string } = {}): string {
  return path.join(resolveToolEnvRoot(options), toolId);
}

async function isFile(filePath: string): Promise<boolean> {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function readManifest(toolPath: string): Promise<ToolDocumentPackageManifest | undefined> {
  try {
    const raw = await readFile(path.join(toolPath, 'manifest.json'), 'utf8');
    const value = JSON.parse(raw.replace(/^\uFEFF/, '')) as ToolDocumentPackageManifest;
    if (!value || typeof value.id !== 'string' || !Array.isArray(value.files)) {
      return undefined;
    }

    return value;
  } catch {
    return undefined;
  }
}

export async function inspectToolDocumentPackage(
  toolId: string,
  options: { homeDir?: string; envRoot?: string; requiredFiles?: string[] } = {}
): Promise<ToolEnvState> {
  const rootPath = resolveToolEnvRoot(options);
  const toolPath = path.join(rootPath, toolId);
  const requiredFiles = options.requiredFiles ?? SKILLCLAW_REQUIRED_FILES;

  try {
    const toolStatus = await stat(toolPath);
    if (!toolStatus.isDirectory()) {
      return { rootPath, toolPath, status: 'incomplete', missingFiles: requiredFiles };
    }
  } catch {
    return { rootPath, toolPath, status: 'missing', missingFiles: requiredFiles };
  }

  const manifest = await readManifest(toolPath);
  const manifestFiles = manifest?.files?.length ? manifest.files : requiredFiles;
  const expectedFiles = [...new Set([...requiredFiles, ...manifestFiles])];
  const missingFiles: string[] = [];

  for (const file of expectedFiles) {
    if (!await isFile(path.join(toolPath, file))) {
      missingFiles.push(file);
    }
  }

  return {
    rootPath,
    toolPath,
    status: missingFiles.length || !manifest ? 'incomplete' : 'complete',
    missingFiles,
    ...(manifest ? { manifest } : {})
  };
}

async function missingRequiredFiles(packagePath: string): Promise<string[]> {
  const missing: string[] = [];
  for (const file of SKILLCLAW_REQUIRED_FILES) {
    if (!await isFile(path.join(packagePath, file))) {
      missing.push(file);
    }
  }

  return missing;
}

async function copyValidatedPackage(sourcePath: string, destinationPath: string): Promise<void> {
  await mkdir(destinationPath, { recursive: true });
  for (const file of SKILLCLAW_REQUIRED_FILES) {
    await cp(path.join(sourcePath, file), path.join(destinationPath, file), {
      force: true,
      recursive: false
    });
  }
}

function sourceLabel(source: 'remote' | 'existing'): string {
  if (source === 'remote') {
    return 'Remote document package.';
  }

  return 'Existing local document package.';
}

function skillclawNextStepMessage(source: 'remote' | 'existing', runbookPath: string): string {
  const prompt = `请阅读并执行这份 SkillClaw 安装 Runbook：${runbookPath}`;
  return [
    sourceLabel(source),
    '',
    '╔════════════════════ NEXT ACTION ════════════════════╗',
    '║ 复制下面提示词给 Agent：',
    `║ ${prompt}`,
    '║ 目标：完成前置检查、SkillClaw 安装、基础配置和安装后验证；不要输出完整密钥。',
    '╚═════════════════════════════════════════════════════╝'
  ].join('\n');
}

export async function prepareToolDocumentPackage(
  tool: ToolDefinition,
  options: PrepareToolDocumentPackageOptions = {}
): Promise<ToolInstallResult> {
  const emit = options.onProgress ?? (() => undefined);
  const downloader = options.downloader ?? downloadGitHubPaths;
  const envPath = resolveToolEnvPath(tool.id, options);
  const currentState = await inspectToolDocumentPackage(tool.id, options);
  const actions: ToolInstallActionResult[] = [];

  const pushAction = (action: ToolInstallActionResult): void => {
    actions.push(action);
    emit({ type: 'step-result', action });
  };

  emit({
    type: 'plan',
    title: 'SkillClaw document preparation',
    lines: [
      `Tool env: ${envPath}`,
      'Prepare Agent-readable installation and help documents.',
      'Do not install SkillClaw or modify AI IDE configuration.'
    ]
  });

  if (!options.force && currentState.status === 'complete') {
    pushAction({
      label: 'SkillClaw docs',
      status: 'existing',
      target: envPath,
      message: skillclawNextStepMessage('existing', path.join(envPath, 'install-runbook.md'))
    });
    return { tool, actions };
  }

  await mkdir(envPath, { recursive: true });
  pushAction({
    label: 'Tool env',
    status: currentState.status === 'missing' ? 'prepared' : 'existing',
    target: envPath,
    message: currentState.status === 'missing' ? 'Created SkillClaw env directory.' : 'SkillClaw env directory already exists.'
  });

  const remoteSource = tool.installer.remoteSource;
  if (!remoteSource) {
    pushAction({
      label: 'SkillClaw docs',
      status: 'failed',
      target: envPath,
      message: 'Remote document source is not configured. SkillClaw docs must be fetched from GitHub.'
    });
    return { tool, actions };
  }

  const includePaths = tool.installer.includePaths ?? SKILLCLAW_REQUIRED_FILES;
  const temporaryPath = await mkdtemp(path.join(os.tmpdir(), 'tmlus-skillclaw-docs-'));
  try {
    const downloaded = await downloader(remoteSource, includePaths, temporaryPath);
    if (!downloaded) {
      pushAction({
        label: 'SkillClaw docs',
        status: 'failed',
        target: envPath,
        message: `Failed to fetch SkillClaw document package from GitHub: ${remoteSource}`
      });
      return { tool, actions };
    }

    const manifest = await readManifest(temporaryPath);
    const missing = await missingRequiredFiles(temporaryPath);
    if (!manifest || missing.length) {
      pushAction({
        label: 'SkillClaw docs',
        status: 'failed',
        target: envPath,
        message: `Remote document package is incomplete. Missing: ${missing.join(', ') || 'manifest'}`
      });
      return { tool, actions };
    }

    await copyValidatedPackage(temporaryPath, envPath);
  } catch (error) {
    pushAction({
      label: 'SkillClaw docs',
      status: 'failed',
      target: envPath,
      message: `Failed to fetch SkillClaw document package from GitHub: ${error instanceof Error ? error.message : String(error)}`
    });
    return { tool, actions };
  } finally {
    await rm(temporaryPath, { force: true, recursive: true });
  }

  const finalState = await inspectToolDocumentPackage(tool.id, options);
  if (finalState.status !== 'complete') {
    pushAction({
      label: 'SkillClaw docs',
      status: 'failed',
      target: envPath,
      message: `Document package is incomplete. Missing: ${finalState.missingFiles.join(', ') || 'manifest'}`
    });
    return { tool, actions };
  }

  pushAction({
    label: 'SkillClaw docs',
    status: options.force || currentState.status === 'complete' ? 'refreshed' : 'prepared',
    target: envPath,
    message: skillclawNextStepMessage('remote', path.join(envPath, 'install-runbook.md'))
  });

  return { tool, actions };
}

export async function readToolDocument(
  toolId: string,
  fileName: 'install-runbook.md' | 'skillclaw-help.md' | 'tml-team-config-guide.md',
  options: { homeDir?: string; envRoot?: string } = {}
): Promise<{ path: string; content: string }> {
  const filePath = path.join(resolveToolEnvPath(toolId, options), fileName);
  return {
    path: filePath,
    content: await readFile(filePath, 'utf8')
  };
}
