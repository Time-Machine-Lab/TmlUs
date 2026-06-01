import type { TmlusUpdateResult } from '../core/types.js';
import {
  createNpmTmlusUpdateAdapter,
  type TmlusUpdateAdapter
} from '../adapters/package-manager/npm.js';

export const TMLUS_PACKAGE_NAME = '@time-machine-lab/tmlus';

export interface TmlusUpdateOptions {
  currentVersion: string;
  packageName?: string;
  env?: NodeJS.ProcessEnv;
  adapter?: TmlusUpdateAdapter;
}

interface ParsedVersion {
  core: number[];
  prerelease: string[];
}

function manualUpdateCommand(packageName: string): string {
  return `npm install -g ${packageName}@latest`;
}

function cleanVersion(value: string): string {
  return value.trim().split(/\s+/)[0] ?? '';
}

function parseVersion(value: string): ParsedVersion {
  const [withoutBuild] = cleanVersion(value).replace(/^v/i, '').split('+');
  const [coreText, prereleaseText = ''] = withoutBuild.split('-');
  const core = coreText.split('.').map((part) => {
    const parsed = Number.parseInt(part, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  });

  while (core.length < 3) {
    core.push(0);
  }

  return {
    core,
    prerelease: prereleaseText ? prereleaseText.split('.') : []
  };
}

function comparePrerelease(left: string[], right: string[]): number {
  if (!left.length && !right.length) {
    return 0;
  }

  if (!left.length) {
    return 1;
  }

  if (!right.length) {
    return -1;
  }

  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = left[index];
    const rightPart = right[index];
    if (leftPart === undefined) {
      return -1;
    }
    if (rightPart === undefined) {
      return 1;
    }

    const leftNumber = /^\d+$/.test(leftPart) ? Number.parseInt(leftPart, 10) : undefined;
    const rightNumber = /^\d+$/.test(rightPart) ? Number.parseInt(rightPart, 10) : undefined;
    if (leftNumber !== undefined && rightNumber !== undefined && leftNumber !== rightNumber) {
      return leftNumber > rightNumber ? 1 : -1;
    }
    if (leftNumber !== undefined && rightNumber === undefined) {
      return -1;
    }
    if (leftNumber === undefined && rightNumber !== undefined) {
      return 1;
    }
    if (leftPart !== rightPart) {
      return leftPart > rightPart ? 1 : -1;
    }
  }

  return 0;
}

export function compareSemverVersions(left: string, right: string): number {
  const parsedLeft = parseVersion(left);
  const parsedRight = parseVersion(right);

  for (let index = 0; index < 3; index += 1) {
    const leftPart = parsedLeft.core[index] ?? 0;
    const rightPart = parsedRight.core[index] ?? 0;
    if (leftPart !== rightPart) {
      return leftPart > rightPart ? 1 : -1;
    }
  }

  return comparePrerelease(parsedLeft.prerelease, parsedRight.prerelease);
}

export function isUnsupportedUpdateInvocation(env: NodeJS.ProcessEnv = process.env): boolean {
  const npmCommand = env.npm_command?.toLowerCase();
  const npmExecPath = env.npm_execpath?.toLowerCase() ?? '';

  return npmCommand === 'exec'
    || Boolean(env.npm_lifecycle_event)
    || env.npm_config_npx === 'true'
    || Boolean(env._npx)
    || npmExecPath.includes('npx-cli');
}

export async function runTmlusUpdate(options: TmlusUpdateOptions): Promise<TmlusUpdateResult> {
  const packageName = options.packageName ?? TMLUS_PACKAGE_NAME;
  const currentVersion = cleanVersion(options.currentVersion);
  const adapter = options.adapter ?? createNpmTmlusUpdateAdapter();
  const command = manualUpdateCommand(packageName);

  const latest = await adapter.latestVersion(packageName);
  if (!latest.ok) {
    return {
      status: 'failed',
      failureStage: 'latest-version',
      currentVersion,
      message: `Failed to check latest ${packageName} version. ${latest.message ?? latest.stderr}`.trim(),
      manualCommand: command
    };
  }

  const latestVersion = cleanVersion(latest.stdout);
  if (!latestVersion) {
    return {
      status: 'failed',
      failureStage: 'latest-version',
      currentVersion,
      message: `Failed to check latest ${packageName} version. npm returned an empty version.`,
      manualCommand: command
    };
  }

  if (compareSemverVersions(currentVersion, latestVersion) >= 0) {
    return {
      status: 'already-current',
      currentVersion,
      latestVersion,
      message: `TmlUs is already current (${currentVersion}).`
    };
  }

  if (isUnsupportedUpdateInvocation(options.env)) {
    return {
      status: 'unsupported-invocation',
      currentVersion,
      latestVersion,
      message: `TmlUs ${latestVersion} is available, but this invocation cannot be updated in place.`,
      manualCommand: command
    };
  }

  const install = await adapter.installLatest(packageName);
  if (!install.ok) {
    return {
      status: 'failed',
      failureStage: 'install',
      currentVersion,
      latestVersion,
      message: `Failed to update ${packageName}. ${install.message ?? install.stderr}`.trim(),
      manualCommand: command
    };
  }

  const verification = await adapter.installedVersion();
  if (!verification.ok) {
    return {
      status: 'verification-failed',
      failureStage: 'verification',
      currentVersion,
      latestVersion,
      message: `Installed ${packageName}@latest, but verification failed. ${verification.message ?? verification.stderr}`.trim(),
      manualCommand: command
    };
  }

  const verifiedVersion = cleanVersion(verification.stdout);
  if (compareSemverVersions(verifiedVersion, latestVersion) < 0) {
    return {
      status: 'verification-failed',
      failureStage: 'verification',
      currentVersion,
      latestVersion,
      verifiedVersion,
      message: `Installed ${packageName}@latest, but the visible tmlus version is still ${verifiedVersion || 'unknown'}. Restart the terminal or check npm global bin on PATH.`,
      manualCommand: command
    };
  }

  return {
    status: 'updated',
    currentVersion,
    latestVersion,
    verifiedVersion,
    message: `Updated TmlUs from ${currentVersion} to ${verifiedVersion}.`
  };
}

export function tmlusUpdateHasFailure(result: TmlusUpdateResult): boolean {
  return result.status === 'failed' || result.status === 'verification-failed';
}
