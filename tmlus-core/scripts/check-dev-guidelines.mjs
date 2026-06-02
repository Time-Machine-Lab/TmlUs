import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { selectionRenderTestApi } from '../dist/ui/selection.js';
import { SKILL_CATALOG, findSkillById } from '../dist/catalog/skills.js';
import { findToolById } from '../dist/catalog/tools.js';
import { COMMAND_REGISTRY } from '../dist/cli/command-registry.js';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve('..');
const testRoot = path.join(repoRoot, 'tmlus-test');
const cli = path.resolve('bin/tmlus.js');

function assertInsideTestRoot(targetPath) {
  const resolvedTarget = path.resolve(targetPath);
  const relative = path.relative(testRoot, resolvedTarget);
  assert.equal(relative.startsWith('..') || path.isAbsolute(relative), false, `Unexpected path outside tmlus-test: ${targetPath}`);
}

async function run(args, cwd = testRoot, extraEnv = {}) {
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

async function runExpectFail(args, cwd = testRoot) {
  try {
    await run(args, cwd);
  } catch (error) {
    return error;
  }

  throw new Error(`Expected command to fail: ${args.join(' ')}`);
}

async function wait(ms) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function assertSandboxWritable() {
  const probe = path.join(testRoot, '.write-probe');
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await mkdir(probe, { recursive: true });
      await rm(probe, { force: true, recursive: true });
      return;
    } catch (error) {
      if (attempt === 4) {
        throw error;
      }
      await wait(100);
    }
  }
}

const gitignore = readFileSync(path.join(repoRoot, '.gitignore'), 'utf8');
assert.match(gitignore, /(^|\n)tmlus-test\/(\n|$)/);
const commandWiki = readFileSync(path.join(repoRoot, 'docs', 'TmlUs命令Wiki.md'), 'utf8');

const longInteractiveLines = selectionRenderTestApi.normalizeFrameLines([
  '* Skills',
  '| Name                     Category   Source                               Description',
  '> * TML Docs Spec Generate TML spec     github:Time-Machine-Lab/TML-Skills/skills/tml-docs-spec-generate Generate project concept, architecture, and development guideline docs from templates.',
  '|   github:Time-Machine-Lab/TML-Skills/skills/tml-docs-spec-generate'
], 60);
assert.equal(longInteractiveLines.every((line) => selectionRenderTestApi.visibleWidth(line) <= 60), true);

assertInsideTestRoot(testRoot);
await execFileAsync('powershell', [
  '-ExecutionPolicy',
  'Bypass',
  '-File',
  path.join(repoRoot, 'scripts', 'clean-tmlus-test.ps1'),
  '-Force'
], { cwd: repoRoot });
assert.equal(existsSync(testRoot), true);
await assertSandboxWritable();

const help = await run(['help']);
assert.match(help.stdout, /ide/);
assert.match(help.stdout, /skills/);
assert.match(help.stdout, /tools/);
assert.match(help.stdout, /update/);
for (const command of COMMAND_REGISTRY) {
  const escapedCommand = command.command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(commandWiki, new RegExp(`\\| \`tmlus ${escapedCommand}\` \\|`), `Command Wiki index is missing tmlus ${command.command}`);
  assert.match(commandWiki, new RegExp(`### \\d+\\.\\d+ \`tmlus ${escapedCommand}\``), `Command Wiki reference is missing tmlus ${command.command}`);
}
for (const oldCommand of ['help', 'skills', 'tools']) {
  assert.doesNotMatch(help.stdout, new RegExp(['tmlus', `--${oldCommand}`].join(' ')));
}
assert.doesNotMatch(help.stdout, /\u001B\[/);

const english = await run(['help', '--lang', 'en']);
assert.match(english.stdout, /AI Skill discovery and installation/);

for (const oldCommand of ['help', 'skills', 'tools', 'ide', 'version', 'update', 'tml-spec', 'work-mode']) {
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

const version = await run(['version']);
assert.match(version.stdout.trim(), /^\d+\.\d+\.\d+/);
assert.doesNotMatch(version.stdout, /TML AI DEV ATELIER/);

const emptyIde = await run(['ide']);
assert.equal(emptyIde.stdout.trim(), '');
assert.equal(existsSync(path.join(testRoot, '.codex')), false);
assert.equal(existsSync(path.join(testRoot, '.claude')), false);
assert.equal(existsSync(path.join(testRoot, '.cursor')), false);
assert.equal(existsSync(path.join(testRoot, '.trae')), false);
assert.equal(existsSync(path.join(testRoot, '.codebuddy')), false);

const codex = await run(['ide', 'codex']);
assert.match(codex.stdout, /\[created\] \.codex\/skills/);
assert.equal(existsSync(path.join(testRoot, '.codex', 'skills')), true);
assert.equal(existsSync(path.join(testRoot, '.codex', 'prompts')), true);
assert.equal(existsSync(path.join(testRoot, '.codex', 'commands')), false);

const codexAgain = await run(['ide', 'codex']);
assert.match(codexAgain.stdout, /\[existing\] \.codex\/skills/);

const cursor = await run(['ide', 'cursor']);
assert.equal(existsSync(path.join(testRoot, '.cursor', 'rules')), true);
assert.equal(existsSync(path.join(testRoot, '.cursor', 'commands')), true);
assert.equal(existsSync(path.join(testRoot, '.cursor', 'skills')), true);

const skillList = await run(['skills']);
assert.match(skillList.stdout, /Skill Creator/);
assert.match(skillList.stdout, /GSAP Skills/);
assert.match(skillList.stdout, /Html Anything/);
assert.match(skillList.stdout, /DB Skills/);
assert.match(skillList.stdout, /Humanizer-zh/);
assert.doesNotMatch(skillList.stdout, /Source/);
assert.match(skillList.stdout, /ID: skill-creator/);
assert.match(skillList.stdout, /ID: tml-docs-spec-generate/);
assert.match(skillList.stdout, /tmlus skills <skill-id> --ide codex/);

const cursorSkill = await run(['skills', 'tml-docs-spec-generate', '--ide', 'cursor']);
assert.match(cursorSkill.stdout, /tml-docs-spec-generate -> Cursor/);
assert.match(cursorSkill.stdout, /\.cursor\/skills\/tml-docs-spec-generate/);

const quiet = await run(['skills', 'tml-docs-spec-generate', '--ide', 'cursor', '--quiet']);
assert.doesNotMatch(quiet.stdout, /TML AI DEV ATELIER/);
assert.doesNotMatch(quiet.stdout, /\u001B\[/);

assert.equal(SKILL_CATALOG.every((skill) => !skill.source.startsWith('local:')), true);
assert.equal(findSkillById('html-anythins').id, 'html-anything');
assert.equal(findSkillById('gsap').installer.strategy, 'github-skill-bundle');
assert.equal(findSkillById('frontend-slides').installer.strategy, 'github-root-skill');
assert.equal(findSkillById('dbskill').installer.strategy, 'github-skill-bundle');
assert.equal(findSkillById('humanizer').id, 'humanizer-zh');
assert.equal(findToolById('codegraph').adapter, 'codegraph');
assert.equal(findToolById('cg').id, 'codegraph');

const noColorHelp = await run(['help'], testRoot, { NO_COLOR: '1' });
assert.doesNotMatch(noColorHelp.stdout, /\u001B\[/);

const unknownIde = await runExpectFail(['ide', 'not-real']);
assert.match(unknownIde.stderr, /Unknown AI IDE/);
assert.match(unknownIde.stderr, /Supported IDEs/);

const unknownSkill = await runExpectFail(['skills', 'not-real', '--ide', 'codex']);
assert.match(unknownSkill.stderr, /Unknown Skill/);
assert.match(unknownSkill.stderr, /Supported Skills/);

await execFileAsync('powershell', [
  '-ExecutionPolicy',
  'Bypass',
  '-File',
  path.join(repoRoot, 'scripts', 'clean-tmlus-test.ps1'),
  '-Force'
], { cwd: repoRoot });
await assertSandboxWritable();

console.log('development guideline checks passed');
