import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { AI_IDE_ENVIRONMENTS } from '../dist/catalog/environments.js';
import { findToolById, TOOL_CATALOG } from '../dist/catalog/tools.js';
import { installCodeGraphTool } from '../dist/adapters/tools/codegraph.js';
import {
  inspectToolDocumentPackage,
  prepareToolDocumentPackage,
  resolveToolEnvRoot
} from '../dist/adapters/tools/document-package.js';
import { selectionRenderTestApi } from '../dist/ui/selection.js';

const execFileAsync = promisify(execFile);
const cli = path.resolve('bin/tmlus.js');

async function run(args, cwd = process.cwd()) {
  return execFileAsync(process.execPath, [cli, ...args], {
    cwd,
    env: {
      ...process.env,
      CI: '1',
      TMLUS_NO_BANNER: '1'
    }
  });
}

async function runExpectFail(args, cwd = process.cwd()) {
  try {
    await run(args, cwd);
  } catch (error) {
    return error;
  }

  throw new Error(`Expected command to fail: ${args.join(' ')}`);
}

function commandRunner(commands) {
  return async (_command, args) => {
    const key = args.join(' ');
    const result = commands[key];
    if (!result) {
      throw new Error(`Unexpected command: ${key}`);
    }

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? ''
    };
  };
}

assert.equal(findToolById('codegraph').id, 'codegraph');
assert.equal(findToolById('cg').id, 'codegraph');
assert.equal(findToolById('skillclaw').id, 'skillclaw');
assert.equal(findToolById('sc').id, 'skillclaw');
assert.equal(TOOL_CATALOG.some((tool) => tool.id === 'codegraph'), true);
assert.equal(TOOL_CATALOG.some((tool) => tool.id === 'skillclaw'), true);
assert.equal(findToolById('skillclaw').installer.strategy, 'document-package');

const renderedToolLines = selectionRenderTestApi.normalizeFrameLines([
  'Tools',
  'Name               Purpose                                                    Recommend',
  'CodeGraph          Local code intelligence and MCP code map for AI agents.     *****'
], 48);
assert.equal(renderedToolLines.every((line) => selectionRenderTestApi.visibleWidth(line) <= 48), true);

const workspace = await mkdtemp(path.join(tmpdir(), 'tmlus-tools-'));
try {
  const list = await run(['tools'], workspace);
  assert.match(list.stdout, /CodeGraph/);
  assert.match(list.stdout, /SkillClaw/);
  assert.match(list.stdout, /codegraph/);
  assert.match(list.stdout, /skillclaw/);
  assert.match(list.stdout, /CodeGraph\s+\S+\s+Local code intelligence/);

  const unknown = await runExpectFail(['tools', 'not-real'], workspace);
  assert.match(unknown.stderr, /Unknown Tool/);
  assert.match(unknown.stderr, /codegraph/);
  assert.match(unknown.stderr, /skillclaw/);

  const envHome = await mkdtemp(path.join(tmpdir(), 'tmlus-tool-env-home-'));
  assert.equal(resolveToolEnvRoot({ homeDir: envHome }), path.join(envHome, '.tmlus', 'env'));
  const skillclaw = findToolById('skillclaw');
  const remoteFixturePath = await mkdtemp(path.join(tmpdir(), 'tmlus-skillclaw-remote-fixture-'));
  const skillclawSourcePath = path.resolve('..', 'data', 'tools', 'skillclaw');
  for (const fileName of ['install-runbook.md', 'skillclaw-help.md', 'tml-team-config-guide.md', 'manifest.json']) {
    await cp(path.join(skillclawSourcePath, fileName), path.join(remoteFixturePath, fileName));
  }
  const prepared = await prepareToolDocumentPackage(skillclaw, {
    homeDir: envHome,
    downloader: async (_source, _includePaths, destinationPath) => {
      for (const fileName of ['install-runbook.md', 'skillclaw-help.md', 'tml-team-config-guide.md', 'manifest.json']) {
        await cp(path.join(remoteFixturePath, fileName), path.join(destinationPath, fileName));
      }
      return true;
    }
  });
  assert.equal(
    prepared.actions.some((action) => action.label === 'SkillClaw docs' && action.status === 'prepared'),
    true,
    JSON.stringify(prepared.actions, null, 2)
  );
  const skillclawEnv = path.join(envHome, '.tmlus', 'env', 'skillclaw');
  assert.equal(existsSync(path.join(skillclawEnv, 'install-runbook.md')), true);
  assert.equal(existsSync(path.join(skillclawEnv, 'skillclaw-help.md')), true);
  assert.equal(existsSync(path.join(skillclawEnv, 'tml-team-config-guide.md')), true);
  assert.equal(existsSync(path.join(skillclawEnv, 'manifest.json')), true);
  assert.equal((await inspectToolDocumentPackage('skillclaw', { homeDir: envHome })).status, 'complete');

  await rm(path.join(skillclawEnv, 'skillclaw-help.md'), { force: true });
  assert.equal((await inspectToolDocumentPackage('skillclaw', { homeDir: envHome })).status, 'incomplete');

  const failedRemoteHome = await mkdtemp(path.join(tmpdir(), 'tmlus-tool-env-remote-fail-home-'));
  const failedRemote = await prepareToolDocumentPackage(skillclaw, {
    homeDir: failedRemoteHome,
    downloader: async () => false
  });
  assert.equal(failedRemote.actions.some((action) => action.label === 'SkillClaw docs' && action.status === 'failed'), true);
  assert.equal((await inspectToolDocumentPackage('skillclaw', { homeDir: failedRemoteHome })).status, 'incomplete');

  const tool = findToolById('codegraph');
  const project = await mkdtemp(path.join(tmpdir(), 'tmlus-codegraph-adapter-'));
  try {
    await writeFile(path.join(project, '.gitignore'), 'dist/\n', 'utf8');
    const result = await installCodeGraphTool(project, tool, {
      environments: [],
      runner: commandRunner({
        '--version': { stdout: '0.9.8\n' },
        [`init ${project}`]: { stdout: 'initialized\n' },
        [`status ${project}`]: { stdout: 'ok\n' }
      })
    });
    assert.equal(result.actions.some((action) => action.label === 'CodeGraph CLI' && action.status === 'existing'), true);
    assert.equal(result.actions.some((action) => action.label === 'Project index' && action.status === 'initialized'), true);
    assert.match(readFileSync(path.join(project, '.gitignore'), 'utf8'), /(^|\n)\.codegraph\/(\n|$)/);

    let versionAttempts = 0;
    const installed = await installCodeGraphTool(project, tool, {
      environments: [],
      runner: async (_command, args) => {
        const key = args.join(' ');
        if (key === '--version') {
          versionAttempts += 1;
          if (versionAttempts === 1) {
            throw new Error('codegraph missing');
          }

          return { stdout: '0.9.9\n', stderr: '' };
        }

        if (key === 'install -g @colbymchenry/codegraph') {
          return { stdout: 'installed\n', stderr: '' };
        }

        if (key === `init ${project}` || key === `status ${project}`) {
          return { stdout: 'ok\n', stderr: '' };
        }

        throw new Error(`Unexpected command: ${key}`);
      }
    });
    assert.equal(installed.actions.some((action) => action.label === 'CodeGraph CLI' && action.status === 'installed'), true);
    assert.equal(installed.actions.some((action) => action.label === 'Project index' && action.status === 'initialized'), true);

    const again = await installCodeGraphTool(project, tool, {
      environments: [],
      runner: commandRunner({
        '--version': { stdout: '0.9.8\n' },
        [`init ${project}`]: { stdout: 'initialized\n' },
        [`status ${project}`]: { stdout: 'ok\n' }
      })
    });
    assert.equal(again.actions.some((action) => action.label === 'Git ignore' && action.status === 'existing'), true);

    const failed = await installCodeGraphTool(project, tool, {
      environments: [],
      runner: commandRunner({
        '--version': { stdout: '0.9.8\n' },
        [`init ${project}`]: { error: 'init failed' },
        [`status ${project}`]: { error: 'status failed' }
      })
    });
    assert.equal(failed.actions.some((action) => action.label === 'Project index' && action.status === 'failed'), true);
    assert.equal(failed.actions.some((action) => action.label === 'CodeGraph status' && action.status === 'failed'), true);
  } finally {
    await rm(project, { force: true, recursive: true });
  }

  const mcpProject = await mkdtemp(path.join(tmpdir(), 'tmlus-codegraph-mcp-'));
  const homeDir = await mkdtemp(path.join(tmpdir(), 'tmlus-codegraph-home-'));
  try {
    const environments = AI_IDE_ENVIRONMENTS.filter((environment) => ['codex', 'claude', 'cursor', 'trae'].includes(environment.id));
    const firstMcp = await installCodeGraphTool(mcpProject, tool, {
      environments,
      homeDir,
      runner: commandRunner({
        '--version': { stdout: '0.9.8\n' },
        [`init ${mcpProject}`]: { stdout: 'initialized\n' },
        [`status ${mcpProject}`]: { stdout: 'ok\n' }
      })
    });

    assert.equal(firstMcp.actions.some((action) => action.label === 'Codex MCP' && action.status === 'configured'), true);
    assert.equal(firstMcp.actions.some((action) => action.label === 'Claude MCP' && action.status === 'configured'), true);
    assert.equal(firstMcp.actions.some((action) => action.label === 'Cursor MCP' && action.status === 'configured'), true);
    assert.equal(firstMcp.actions.some((action) => action.label === 'Trae MCP' && action.status === 'skipped'), true);

    const codexConfigPath = path.join(homeDir, '.codex', 'config.toml');
    const claudeConfigPath = path.join(homeDir, '.claude.json');
    const cursorConfigPath = path.join(homeDir, '.cursor', 'mcp.json');
    assert.match(readFileSync(codexConfigPath, 'utf8'), /\[mcp_servers\.codegraph\]/);
    assert.deepEqual(JSON.parse(readFileSync(claudeConfigPath, 'utf8')).mcpServers.codegraph.args, ['serve', '--mcp']);
    assert.deepEqual(JSON.parse(readFileSync(cursorConfigPath, 'utf8')).mcpServers.codegraph.args, ['serve', '--mcp', '--path', '${workspaceFolder}']);

    const secondMcp = await installCodeGraphTool(mcpProject, tool, {
      environments,
      homeDir,
      runner: commandRunner({
        '--version': { stdout: '0.9.8\n' },
        [`init ${mcpProject}`]: { stdout: 'initialized\n' },
        [`status ${mcpProject}`]: { stdout: 'ok\n' }
      })
    });

    assert.equal(secondMcp.actions.some((action) => action.label === 'Codex MCP' && action.status === 'existing'), true);
    assert.equal(secondMcp.actions.some((action) => action.label === 'Claude MCP' && action.status === 'existing'), true);
    assert.equal(secondMcp.actions.some((action) => action.label === 'Cursor MCP' && action.status === 'existing'), true);
    assert.equal((readFileSync(codexConfigPath, 'utf8').match(/\[mcp_servers\.codegraph\]/g) ?? []).length, 1);
  } finally {
    await rm(mcpProject, { force: true, recursive: true });
    await rm(homeDir, { force: true, recursive: true });
  }
} finally {
  await rm(workspace, { force: true, recursive: true });
}

console.log('tool checks passed');
