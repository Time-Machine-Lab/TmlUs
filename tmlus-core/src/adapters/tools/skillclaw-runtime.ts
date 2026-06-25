import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { resolveToolEnvPath } from './document-package.js';

export interface SkillClawProxyState {
  running: boolean;
  statusText: string;
  configPath: string;
  codexConfigPath: string;
  helpPath: string;
}

export interface SkillClawRuntimeResult {
  status: 'success' | 'partial' | 'failed';
  title: string;
  lines: string[];
}

interface SkillClawConfigSummary {
  upstreamBaseUrl: string;
  upstreamApiKey: string;
  upstreamModel: string;
  upstreamWireApi: string;
  proxyBaseUrl: string;
  proxyApiKey: string;
  servedModelName: string;
}

const SKILLCLAW_ID = 'skillclaw';

function homePath(...segments: string[]): string {
  return path.join(os.homedir(), ...segments);
}

function skillclawCommand(): string {
  return process.platform === 'win32'
    ? homePath('.tmlus', 'tools', 'skillclaw', '.venv', 'Scripts', 'skillclaw.exe')
    : homePath('.tmlus', 'tools', 'skillclaw', '.venv', 'bin', 'skillclaw');
}

function configPath(): string {
  return homePath('.skillclaw', 'config.yaml');
}

function codexConfigPath(): string {
  return homePath('.codex', 'config.toml');
}

function isSkillClawStatusRunning(statusText: string): boolean {
  if (/\b(not\s+running|stopped|inactive|disabled|dead)\b/i.test(statusText)) {
    return false;
  }

  return /\b(running|active|listening|started)\b/i.test(statusText);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function runCommand(command: string, args: string[], timeoutMs = 20000): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
    }, timeoutMs);

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code });
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: error.message, code: 1 });
    });
  });
}

function parseYamlScalar(config: string, section: string, key: string): string {
  const lines = config.split(/\r?\n/);
  let inSection = false;
  const sectionPattern = new RegExp(`^${section}:\\s*$`);
  const keyPattern = new RegExp(`^\\s{2}${key}:\\s*(.*)$`);

  for (const line of lines) {
    if (/^\S/.test(line)) {
      inSection = sectionPattern.test(line);
      continue;
    }

    if (!inSection) {
      continue;
    }

    const match = keyPattern.exec(line);
    if (match) {
      return match[1].trim().replace(/^["']|["']$/g, '');
    }
  }

  return '';
}

async function readSkillClawConfigSummary(): Promise<SkillClawConfigSummary> {
  const text = await readFile(configPath(), 'utf8');
  const host = parseYamlScalar(text, 'proxy', 'host') || '127.0.0.1';
  const port = parseYamlScalar(text, 'proxy', 'port') || '30000';
  return {
    upstreamBaseUrl: parseYamlScalar(text, 'llm', 'api_base'),
    upstreamApiKey: parseYamlScalar(text, 'llm', 'api_key'),
    upstreamModel: parseYamlScalar(text, 'llm', 'model_id') || 'gpt-5.5',
    upstreamWireApi: parseYamlScalar(text, 'llm', 'api_mode') || 'responses',
    proxyBaseUrl: `http://${host}:${port}/v1`,
    proxyApiKey: parseYamlScalar(text, 'proxy', 'api_key') || 'skillclaw',
    servedModelName: parseYamlScalar(text, 'proxy', 'served_model_name') || 'skillclaw-model'
  };
}

function topLevelTomlValue(text: string, key: string): string {
  const match = new RegExp(`^${key}\\s*=\\s*"([^"]*)"\\s*$`, 'm').exec(text);
  return match?.[1] ?? '';
}

function replaceTopLevelTomlValue(text: string, key: string, value: string): string {
  const pattern = new RegExp(`^${key}\\s*=\\s*"[^"]*"\\s*$`, 'm');
  if (pattern.test(text)) {
    return text.replace(pattern, `${key} = "${value}"`);
  }

  return `${key} = "${value}"\n${text}`;
}

function replaceProviderField(block: string, key: string, value: string): string {
  const pattern = new RegExp(`^${key}\\s*=\\s*"[^"]*"\\s*$`, 'm');
  if (pattern.test(block)) {
    return block.replace(pattern, `${key} = "${value}"`);
  }

  return `${block.trimEnd()}\n${key} = "${value}"\n`;
}

function replaceProviderBlock(text: string, provider: string, update: (block: string) => string): string {
  const pattern = new RegExp(`(^\\[model_providers\\.${provider.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\s*$.*?)(?=^\\[|\\z)`, 'ms');
  if (!pattern.test(text)) {
    throw new Error(`Codex provider table not found: ${provider}`);
  }

  return text.replace(pattern, (_match, block: string) => update(block));
}

async function backupFile(filePath: string, label: string): Promise<string> {
  const backupPath = `${filePath}.bak.${label}.${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}`;
  await copyFile(filePath, backupPath);
  return backupPath;
}

async function switchCodexToProxy(summary: SkillClawConfigSummary): Promise<string> {
  const filePath = codexConfigPath();
  const text = await readFile(filePath, 'utf8');
  const provider = topLevelTomlValue(text, 'model_provider');
  if (!provider) {
    throw new Error('Codex top-level model_provider not found.');
  }

  const backupPath = await backupFile(filePath, 'skillclaw-proxy');
  let next = replaceTopLevelTomlValue(text, 'model', summary.servedModelName);
  next = replaceProviderBlock(next, provider, (block) => {
    let updated = replaceProviderField(block, 'base_url', summary.proxyBaseUrl);
    updated = replaceProviderField(updated, 'experimental_bearer_token', summary.proxyApiKey);
    updated = replaceProviderField(updated, 'wire_api', 'responses');
    return updated;
  });
  await writeFile(filePath, next, 'utf8');
  return backupPath;
}

async function switchCodexToUpstream(summary: SkillClawConfigSummary): Promise<string> {
  const filePath = codexConfigPath();
  const text = await readFile(filePath, 'utf8');
  const provider = topLevelTomlValue(text, 'model_provider');
  if (!provider) {
    throw new Error('Codex top-level model_provider not found.');
  }

  const backupPath = await backupFile(filePath, 'skillclaw-upstream');
  let next = replaceTopLevelTomlValue(text, 'model', summary.upstreamModel);
  next = replaceProviderBlock(next, provider, (block) => {
    let updated = replaceProviderField(block, 'base_url', summary.upstreamBaseUrl);
    updated = replaceProviderField(updated, 'experimental_bearer_token', summary.upstreamApiKey);
    updated = replaceProviderField(updated, 'wire_api', summary.upstreamWireApi);
    return updated;
  });
  await writeFile(filePath, next, 'utf8');
  return backupPath;
}

export async function inspectSkillClawProxy(): Promise<SkillClawProxyState> {
  const command = skillclawCommand();
  const helpPath = path.join(resolveToolEnvPath(SKILLCLAW_ID), 'skillclaw-help.md');
  if (!await fileExists(command)) {
    return {
      running: false,
      statusText: `SkillClaw CLI not found: ${command}`,
      configPath: configPath(),
      codexConfigPath: codexConfigPath(),
      helpPath
    };
  }

  const result = await runCommand(command, ['status'], 10000);
  const statusText = (result.stdout || result.stderr || '').trim();
  return {
    running: result.code === 0 && isSkillClawStatusRunning(statusText),
    statusText,
    configPath: configPath(),
    codexConfigPath: codexConfigPath(),
    helpPath
  };
}

export async function startSkillClawProxy(): Promise<SkillClawRuntimeResult> {
  const command = skillclawCommand();
  if (!await fileExists(command)) {
    return {
      status: 'failed',
      title: 'SkillClaw proxy start',
      lines: [`SkillClaw CLI not found: ${command}`, '请先把 install-runbook.md 交给 Agent 完成安装。']
    };
  }

  try {
    const summary = await readSkillClawConfigSummary();
    const started = await runCommand(command, ['start', '--daemon'], 30000);
    if (started.code !== 0 && !/already running/i.test(`${started.stdout}\n${started.stderr}`)) {
      return {
        status: 'failed',
        title: 'SkillClaw proxy start',
        lines: ['启动 SkillClaw daemon 失败。', (started.stderr || started.stdout).trim()]
      };
    }

    const backupPath = await switchCodexToProxy(summary);
    const state = await inspectSkillClawProxy();
    return {
      status: state.running ? 'success' : 'partial',
      title: 'SkillClaw proxy started',
      lines: [
        `Status: ${state.statusText || 'unknown'}`,
        `Codex config switched to SkillClaw proxy: ${summary.proxyBaseUrl}`,
        `Backup: ${backupPath}`,
        '如果 Codex 已经打开，请重启或开启新会话确认配置生效。'
      ]
    };
  } catch (error) {
    return {
      status: 'failed',
      title: 'SkillClaw proxy start',
      lines: [error instanceof Error ? error.message : String(error)]
    };
  }
}

export async function stopSkillClawProxy(): Promise<SkillClawRuntimeResult> {
  const command = skillclawCommand();
  try {
    const summary = await readSkillClawConfigSummary();
    const backupPath = await switchCodexToUpstream(summary);
    const commandExists = await fileExists(command);
    const stopped = commandExists
      ? await runCommand(command, ['stop'], 20000)
      : { stdout: '', stderr: `SkillClaw CLI not found: ${command}`, code: 1 };
    const state = await inspectSkillClawProxy();
    return {
      status: !state.running ? 'success' : 'partial',
      title: 'SkillClaw proxy stopped',
      lines: [
        `Codex config restored to upstream: ${summary.upstreamBaseUrl}`,
        `Backup: ${backupPath}`,
        `Stop command: ${(stopped.stdout || stopped.stderr || '').trim() || 'completed'}`,
        `Status: ${state.statusText || 'unknown'}`
      ]
    };
  } catch (error) {
    return {
      status: 'failed',
      title: 'SkillClaw proxy stop',
      lines: [error instanceof Error ? error.message : String(error)]
    };
  }
}

export async function ensureSkillClawEnvDirectory(): Promise<void> {
  await mkdir(resolveToolEnvPath(SKILLCLAW_ID), { recursive: true });
}
