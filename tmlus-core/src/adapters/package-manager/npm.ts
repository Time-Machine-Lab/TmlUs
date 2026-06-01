import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const NPM_COMMAND = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const TMLUS_COMMAND = process.platform === 'win32' ? 'tmlus.cmd' : 'tmlus';
const PUBLIC_NPM_REGISTRY = 'https://registry.npmjs.org/';

export type CommandRunner = (
  command: string,
  args: string[],
  options: { cwd?: string; shell?: boolean; windowsHide?: boolean }
) => Promise<{ stdout: string; stderr: string }>;

export interface PackageCommandResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  message?: string;
}

export interface TmlusUpdateAdapter {
  latestVersion(packageName: string): Promise<PackageCommandResult>;
  installLatest(packageName: string): Promise<PackageCommandResult>;
  installedVersion(): Promise<PackageCommandResult>;
}

const defaultRunner: CommandRunner = async (command, args, options) => execFileAsync(command, args, options);

async function runCommand(
  runner: CommandRunner,
  command: string,
  args: string[]
): Promise<PackageCommandResult> {
  try {
    const result = await runner(command, args, {
      shell: process.platform === 'win32',
      windowsHide: true
    });
    return { ok: true, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return {
      ok: false,
      stdout: '',
      stderr: '',
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

export function createNpmTmlusUpdateAdapter(
  runner: CommandRunner = defaultRunner,
  registry = PUBLIC_NPM_REGISTRY
): TmlusUpdateAdapter {
  return {
    latestVersion(packageName: string) {
      return runCommand(runner, NPM_COMMAND, ['view', packageName, 'version', `--registry=${registry}`]);
    },
    installLatest(packageName: string) {
      return runCommand(runner, NPM_COMMAND, ['install', '-g', `${packageName}@latest`]);
    },
    installedVersion() {
      return runCommand(runner, TMLUS_COMMAND, ['version']);
    }
  };
}
