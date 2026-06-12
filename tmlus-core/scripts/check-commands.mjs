import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { COMMAND_REGISTRY } from '../dist/cli/command-registry.js';

const execFileAsync = promisify(execFile);
const cli = path.resolve('bin/tmlus.js');
const commandWiki = readFileSync(path.resolve('..', 'docs', 'TmlUs命令Wiki.md'), 'utf8');

async function run(args, cwd = process.cwd(), extraEnv = {}) {
  return execFileAsync(process.execPath, [cli, ...args], {
    cwd,
    env: {
      ...process.env,
      CI: '1',
      TMLUS_NO_BANNER: '1',
      TMLUS_DISABLE_REMOTE_CATALOG: '1',
      ...extraEnv
    }
  });
}

const help = await run(['help']);
assert.match(help.stdout, /init/);
assert.match(help.stdout, /ide/);
assert.match(help.stdout, /skills/);
assert.match(help.stdout, /tools/);
assert.match(help.stdout, /update/);
assert.match(help.stdout, /refresh/);
assert.match(help.stdout, /tml-spec/);
assert.match(help.stdout, /work-mode/);
assert.match(help.stdout, /Project initialization/);

for (const command of COMMAND_REGISTRY) {
  const escapedCommand = command.command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(commandWiki, new RegExp(`\\| \`tmlus ${escapedCommand}\` \\|`), `Command Wiki index is missing tmlus ${command.command}`);
  assert.match(commandWiki, new RegExp(`### \\d+\\.\\d+ \`tmlus ${escapedCommand}\``), `Command Wiki reference is missing tmlus ${command.command}`);
}

for (const oldCommand of ['help', 'skills', 'tools']) {
  assert.doesNotMatch(help.stdout, new RegExp(['tmlus', `--${oldCommand}`].join(' ')));
}

for (const oldCommand of ['help', 'skills', 'tools', 'ide', 'version', 'update', 'refresh', 'tml-spec', 'work-mode']) {
  let failed = false;
  try {
    await run([`--${oldCommand}`]);
  } catch (error) {
    failed = true;
    assert.match(error.stderr, /Command names now use subcommands without leading dashes/);
    assert.match(error.stderr, /tmlus help/);
  }
  assert.equal(failed, true);
}

const englishHelp = await run(['help', '--lang', 'en']);
assert.match(englishHelp.stdout, /AI IDE environment initialization/);
assert.match(englishHelp.stdout, /External Tool discovery and installation/);
assert.match(englishHelp.stdout, /global npm installation/);
assert.match(englishHelp.stdout, /Refresh cache/);
assert.match(englishHelp.stdout, /without updating the CLI package/);
assert.match(englishHelp.stdout, /TML Docs structure initialization/);
assert.match(englishHelp.stdout, /Project work mode initialization/);

const workspace = await mkdtemp(path.join(tmpdir(), 'tmlus-check-'));
try {
  const ide = await run(['ide', 'codex'], workspace);
  assert.match(ide.stdout, /\.codex\/skills/);
  assert.equal(existsSync(path.join(workspace, '.codex', 'skills')), true);
  assert.equal(existsSync(path.join(workspace, '.codex', 'prompts')), true);

  const ideAgain = await run(['ide', 'codex'], workspace);
  assert.match(ideAgain.stdout, /\[existing\] \.codex\/skills/);

  const cursorWorkspace = await mkdtemp(path.join(tmpdir(), 'tmlus-cursor-'));
  try {
    const cursorIde = await run(['ide', 'cursor'], cursorWorkspace);
    assert.match(cursorIde.stdout, /\.cursor\/skills/);
    assert.equal(existsSync(path.join(cursorWorkspace, '.cursor', 'rules')), true);
    assert.equal(existsSync(path.join(cursorWorkspace, '.cursor', 'commands')), true);
    assert.equal(existsSync(path.join(cursorWorkspace, '.cursor', 'skills')), true);
  } finally {
    await rm(cursorWorkspace, { force: true, recursive: true });
  }

  const skillList = await run(['skills'], workspace);
  assert.match(skillList.stdout, /tml-docs-spec-generate/);
  assert.match(skillList.stdout, /Skill Creator/);
  assert.match(skillList.stdout, /DB Skills/);
  assert.match(skillList.stdout, /Humanizer-zh/);

  const tmlSpec = await run(['tml-spec'], workspace);
  assert.match(tmlSpec.stdout, /TML Docs structure result/);
  for (const directory of ['docs', 'design', 'api', 'sql', 'preview', 'spec']) {
    const target = directory === 'docs'
      ? path.join(workspace, 'docs')
      : path.join(workspace, 'docs', directory);
    assert.equal(existsSync(target), true);
    assert.equal(existsSync(path.join(target, '.gitkeep')), true);
  }

  const tmlSpecAgain = await run(['tml-spec'], workspace);
  assert.match(tmlSpecAgain.stdout, /\[existing\] docs\/spec\/\.gitkeep/);

  const workModeSkip = await run(['work-mode', 'skip'], workspace);
  assert.match(workModeSkip.stdout, /\[skipped\] Skip/);

  const refreshCache = await mkdtemp(path.join(tmpdir(), 'tmlus-refresh-cache-'));
  try {
    await mkdir(refreshCache, { recursive: true });
    await writeFile(path.join(refreshCache, 'skills-catalog.json'), '{}', 'utf8');
    await writeFile(path.join(refreshCache, 'skills-search-sources.json'), '{}', 'utf8');
    await writeFile(path.join(refreshCache, 'skills-search-tml-skills.json'), '{}', 'utf8');
    await writeFile(path.join(refreshCache, 'unrelated.txt'), 'keep', 'utf8');

    const refresh = await run(['refresh', '--quiet'], workspace, {
      TMLUS_DISABLE_REMOTE_CATALOG: '',
      TMLUS_SKILL_CACHE_DIR: refreshCache,
      TMLUS_SKILL_CATALOG_URL: 'https://example.invalid/catalog.json',
      TMLUS_SKILL_SEARCH_SOURCES_URL: 'https://example.invalid/search-sources.json'
    });
    assert.match(refresh.stdout, /completed: deleted 3, skipped 0, failed 0/);
    assert.equal(existsSync(path.join(refreshCache, 'skills-catalog.json')), false);
    assert.equal(existsSync(path.join(refreshCache, 'skills-search-sources.json')), false);
    assert.equal(existsSync(path.join(refreshCache, 'skills-search-tml-skills.json')), false);
    assert.equal(existsSync(path.join(refreshCache, 'unrelated.txt')), true);

    const refreshAgain = await run(['refresh', '--quiet'], workspace, {
      TMLUS_SKILL_CACHE_DIR: refreshCache
    });
    assert.match(refreshAgain.stdout, /completed: deleted 0, skipped 2, failed 0/);
  } finally {
    await rm(refreshCache, { force: true, recursive: true });
  }

  const openspecWorkspace = await mkdtemp(path.join(tmpdir(), 'tmlus-openspec-'));
  try {
    const workModeOpenSpec = await run(['work-mode', 'openspec', '--ide', 'codex,claude'], openspecWorkspace);
    assert.match(workModeOpenSpec.stdout, /Initializing work mode OpenSpec with tools: codex,claude/);
    assert.match(workModeOpenSpec.stdout, /Running openspec init/);
    assert.match(workModeOpenSpec.stdout, /\[(initialized|existing)\] OpenSpec/);
    assert.match(workModeOpenSpec.stdout, /codex,claude/);
    assert.equal(existsSync(path.join(openspecWorkspace, 'openspec')), true);
    assert.equal(existsSync(path.join(openspecWorkspace, '.codex')), true);
    assert.equal(existsSync(path.join(openspecWorkspace, '.claude')), true);
  } finally {
    await rm(openspecWorkspace, { force: true, recursive: true });
  }

  const cursorSkillWorkspace = await mkdtemp(path.join(tmpdir(), 'tmlus-cursor-skill-'));
  try {
      const cursorSkillTarget = await run(['skills', 'tml-docs-spec-generate', '--ide', 'cursor'], cursorSkillWorkspace);
    assert.match(cursorSkillTarget.stdout, /Installing 1 skill\(s\) to 1 AI IDE environment\(s\)/);
    assert.match(cursorSkillTarget.stdout, /Starting skill install batch 1\/1/);
    assert.match(cursorSkillTarget.stdout, /tml-docs-spec-generate -> Cursor/);
    assert.equal(existsSync(path.join(cursorSkillWorkspace, '.cursor', 'skills', 'tml-docs-spec-generate')), true);
  } finally {
    await rm(cursorSkillWorkspace, { force: true, recursive: true });
  }

  const initNoTargetWorkspace = await mkdtemp(path.join(tmpdir(), 'tmlus-init-no-target-'));
  try {
    let initFailed = false;
    try {
      await run(['init', '--from', 'tml-spec', '--work-mode', 'skip'], initNoTargetWorkspace);
    } catch (error) {
      initFailed = true;
      assert.match(error.stdout, /\[completed\] tml-spec/);
      assert.match(error.stdout, /\[failed\] skills/);
      assert.doesNotMatch(error.stdout, /\[completed\] ide/);
    }
    assert.equal(initFailed, true);
  } finally {
    await rm(initNoTargetWorkspace, { force: true, recursive: true });
  }

  let unknownWorkModeFailed = false;
  try {
    await run(['work-mode', 'unknown-mode'], workspace);
  } catch (error) {
    unknownWorkModeFailed = true;
    assert.match(error.stderr, /Unknown work mode/);
    assert.match(error.stderr, /openspec, skip/);
  }
  assert.equal(unknownWorkModeFailed, true);

  let unknownInitStepFailed = false;
  try {
    await run(['init', '--from', 'unknown-step'], workspace);
  } catch (error) {
    unknownInitStepFailed = true;
    assert.match(error.stdout, /Unknown init step/);
    assert.match(error.stdout, /workdir, ide, tml-spec, skills, work-mode/);
  }
  assert.equal(unknownInitStepFailed, true);

  let unknownFailed = false;
  try {
    await run(['ide', 'not-real'], workspace);
  } catch (error) {
    unknownFailed = true;
    assert.match(error.stderr, /Unknown AI IDE/);
  }
  assert.equal(unknownFailed, true);
} finally {
  await rm(workspace, { force: true, recursive: true });
}

console.log('command checks passed');
