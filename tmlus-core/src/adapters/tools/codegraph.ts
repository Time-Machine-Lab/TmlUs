import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import type {
  EnvironmentDefinition,
  ToolDefinition,
  ToolInstallActionResult,
  ToolInstallProgressEvent,
  ToolInstallResult
} from '../../core/types.js';
import { ensureGitignoreEntry, resolveProjectPath } from '../../workspace/fs.js';

const execFileAsync = promisify(execFile);
const CODEGRAPH_COMMAND = process.platform === 'win32' ? 'codegraph.cmd' : 'codegraph';
const NPM_COMMAND = process.platform === 'win32' ? 'npm.cmd' : 'npm';

export type CommandRunner = (
  command: string,
  args: string[],
  options: { cwd?: string; shell?: boolean; windowsHide?: boolean }
) => Promise<{ stdout: string; stderr: string }>;

const defaultRunner: CommandRunner = async (command, args, options) => execFileAsync(command, args, options);

interface CodeGraphOptions {
  environments?: EnvironmentDefinition[];
  runner?: CommandRunner;
  homeDir?: string;
  onProgress?: (event: ToolInstallProgressEvent) => void;
}

async function runCodeGraph(
  args: string[],
  projectRoot: string,
  runner: CommandRunner
): Promise<{ ok: true; stdout: string; stderr: string } | { ok: false; message: string }> {
  try {
    const result = await runner(CODEGRAPH_COMMAND, args, {
      cwd: projectRoot,
      shell: process.platform === 'win32',
      windowsHide: true
    });
    return { ok: true, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

async function installCodeGraphCli(
  packageName: string,
  projectRoot: string,
  runner: CommandRunner
): Promise<{ ok: true; stdout: string; stderr: string } | { ok: false; message: string }> {
  try {
    const result = await runner(NPM_COMMAND, ['install', '-g', packageName], {
      cwd: projectRoot,
      shell: process.platform === 'win32',
      windowsHide: true
    });
    return { ok: true, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

function supportedTargets(environments: EnvironmentDefinition[] = []): EnvironmentDefinition[] {
  return environments.filter((environment) => ['codex', 'claude', 'cursor'].includes(environment.id));
}

function unsupportedTargets(environments: EnvironmentDefinition[] = []): EnvironmentDefinition[] {
  return environments.filter((environment) => !['codex', 'claude', 'cursor'].includes(environment.id));
}

async function readJsonFile(filePath: string): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function configureCodex(homeDir: string): Promise<ToolInstallActionResult> {
  const configPath = path.join(homeDir, '.codex', 'config.toml');
  const block = [
    '[mcp_servers.codegraph]',
    'command = "codegraph"',
    'args = ["serve", "--mcp"]'
  ].join('\n');

  try {
    let content = '';
    try {
      content = await readFile(configPath, 'utf8');
    } catch {
      // Missing config files are created below.
    }

    if (content.includes('[mcp_servers.codegraph]')) {
      return {
        label: 'Codex MCP',
        status: 'existing',
        target: configPath,
        message: 'CodeGraph MCP server is already configured.'
      };
    }

    await mkdir(path.dirname(configPath), { recursive: true });
    const prefix = content.length && !content.endsWith('\n') ? '\n\n' : content.length ? '\n' : '';
    await writeFile(configPath, `${content}${prefix}${block}\n`, 'utf8');
    return {
      label: 'Codex MCP',
      status: 'configured',
      target: configPath,
      message: 'Configured codegraph serve --mcp.'
    };
  } catch (error) {
    return {
      label: 'Codex MCP',
      status: 'failed',
      target: configPath,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

async function configureClaude(homeDir: string): Promise<ToolInstallActionResult> {
  const configPath = path.join(homeDir, '.claude.json');

  try {
    const config = await readJsonFile(configPath);
    const mcpServers = typeof config.mcpServers === 'object' && config.mcpServers !== null
      ? config.mcpServers as Record<string, unknown>
      : {};

    if (mcpServers.codegraph) {
      return {
        label: 'Claude MCP',
        status: 'existing',
        target: configPath,
        message: 'CodeGraph MCP server is already configured.'
      };
    }

    mcpServers.codegraph = {
      type: 'stdio',
      command: 'codegraph',
      args: ['serve', '--mcp']
    };
    config.mcpServers = mcpServers;
    await writeJsonFile(configPath, config);
    return {
      label: 'Claude MCP',
      status: 'configured',
      target: configPath,
      message: 'Configured codegraph serve --mcp.'
    };
  } catch (error) {
    return {
      label: 'Claude MCP',
      status: 'failed',
      target: configPath,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

async function configureCursor(homeDir: string): Promise<ToolInstallActionResult> {
  const configPath = path.join(homeDir, '.cursor', 'mcp.json');

  try {
    const config = await readJsonFile(configPath);
    const mcpServers = typeof config.mcpServers === 'object' && config.mcpServers !== null
      ? config.mcpServers as Record<string, unknown>
      : {};

    if (mcpServers.codegraph) {
      return {
        label: 'Cursor MCP',
        status: 'existing',
        target: configPath,
        message: 'CodeGraph MCP server is already configured.'
      };
    }

    mcpServers.codegraph = {
      type: 'stdio',
      command: 'codegraph',
      args: ['serve', '--mcp', '--path', '${workspaceFolder}']
    };
    config.mcpServers = mcpServers;
    await writeJsonFile(configPath, config);
    return {
      label: 'Cursor MCP',
      status: 'configured',
      target: configPath,
      message: 'Configured codegraph serve --mcp.'
    };
  } catch (error) {
    return {
      label: 'Cursor MCP',
      status: 'failed',
      target: configPath,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

async function configureEnvironment(environment: EnvironmentDefinition, homeDir: string): Promise<ToolInstallActionResult> {
  if (environment.id === 'codex') {
    return configureCodex(homeDir);
  }

  if (environment.id === 'claude') {
    return configureClaude(homeDir);
  }

  if (environment.id === 'cursor') {
    return configureCursor(homeDir);
  }

  return {
    label: `${environment.displayName} MCP`,
    status: 'skipped',
    message: 'CodeGraph MCP adaptation is not supported for this AI IDE yet.'
  };
}

export async function installCodeGraphTool(
  projectRoot: string,
  tool: ToolDefinition,
  options: CodeGraphOptions = {}
): Promise<ToolInstallResult> {
  const runner = options.runner ?? defaultRunner;
  const homeDir = options.homeDir ?? os.homedir();
  const emit = options.onProgress ?? (() => undefined);
  const actions: ToolInstallActionResult[] = [];

  const pushAction = (action: ToolInstallActionResult): void => {
    actions.push(action);
    emit({ type: 'step-result', action });
  };

  emit({
    type: 'plan',
    title: 'CodeGraph setup plan',
    lines: [
      `Project root: ${projectRoot}`,
      'Check CodeGraph CLI availability.',
      'Install @colbymchenry/codegraph globally when the CLI is missing.',
      'Configure selected AI IDE MCP targets.',
      'Initialize the project CodeGraph index.',
      'Ensure .codegraph/ is ignored by git.',
      'Verify CodeGraph status.'
    ]
  });

  emit({ type: 'step-start', step: 1, total: 6, title: 'Checking CodeGraph CLI', detail: `${CODEGRAPH_COMMAND} --version` });
  let version = await runCodeGraph(['--version'], projectRoot, runner);

  if (!version.ok) {
    const packageName = tool.installer.packageName ?? '@colbymchenry/codegraph';
    emit({ type: 'step-start', step: 2, total: 6, title: 'Installing CodeGraph CLI', detail: `npm install -g ${packageName}` });
    const install = await installCodeGraphCli(packageName, projectRoot, runner);
    if (!install.ok) {
      pushAction({
        label: 'CodeGraph CLI',
        status: 'failed',
        message: `Failed to install CodeGraph with \`npm install -g ${packageName}\`. ${install.message}`
      });
      return { tool, actions };
    }

    pushAction({
      label: 'CodeGraph CLI',
      status: 'installed',
      message: `Installed ${packageName}.`
    });

    emit({ type: 'step-start', step: 3, total: 6, title: 'Verifying CodeGraph CLI', detail: `${CODEGRAPH_COMMAND} --version` });
    version = await runCodeGraph(['--version'], projectRoot, runner);
    if (!version.ok) {
      pushAction({
        label: 'CodeGraph CLI',
        status: 'failed',
        message: `CodeGraph installed, but \`${CODEGRAPH_COMMAND} --version\` still failed. Restart the terminal or check npm global bin on PATH. ${version.message}`
      });
      return { tool, actions };
    }
  } else {
    pushAction({
      label: 'CodeGraph CLI',
      status: 'existing',
      message: `Found version ${version.stdout.trim() || 'unknown'}.`
    });
  }

  emit({
    type: 'step-start',
    step: 4,
    total: 6,
    title: 'Configuring AI IDE MCP targets',
    detail: options.environments?.length
      ? options.environments.map((environment) => environment.displayName).join(', ')
      : 'No AI IDE targets selected.'
  });
  for (const environment of supportedTargets(options.environments)) {
    pushAction(await configureEnvironment(environment, homeDir));
  }

  for (const environment of unsupportedTargets(options.environments)) {
    pushAction({
      label: `${environment.displayName} MCP`,
      status: 'skipped',
      message: 'CodeGraph does not have a TmlUs adapter for this AI IDE yet.'
    });
  }

  emit({ type: 'step-start', step: 5, total: 6, title: 'Initializing CodeGraph project index', detail: `codegraph init ${projectRoot}` });
  const init = await runCodeGraph(['init', projectRoot], projectRoot, runner);
  pushAction(init.ok
    ? {
      label: 'Project index',
      status: 'initialized',
      target: '.codegraph/',
      message: 'CodeGraph project index initialized.'
    }
    : {
      label: 'Project index',
      status: 'failed',
      target: projectRoot,
      message: `Run \`codegraph init "${projectRoot}"\` manually. ${init.message}`
    });

  emit({ type: 'step-start', step: 6, total: 6, title: 'Finalizing project files and status check', detail: '.gitignore + codegraph status' });
  const ignore = await ensureGitignoreEntry(projectRoot, '.codegraph/');
  pushAction({
    label: 'Git ignore',
    status: ignore.status === 'failed' ? 'failed' : ignore.status === 'existing' ? 'existing' : 'configured',
    target: ignore.path,
    message: ignore.error ?? 'Ensured .codegraph/ is ignored.'
  });

  const status = await runCodeGraph(['status', projectRoot], projectRoot, runner);
  pushAction(status.ok
    ? {
      label: 'CodeGraph status',
      status: 'existing',
      message: 'Status check completed.'
    }
    : {
      label: 'CodeGraph status',
      status: 'failed',
      message: `Run \`codegraph status "${projectRoot}"\` manually. ${status.message}`
    });

  resolveProjectPath(projectRoot, '.codegraph');
  emit({
    type: 'note',
    message: 'Restart your AI IDE if the CodeGraph MCP tools are not visible immediately.'
  });

  return { tool, actions };
}
