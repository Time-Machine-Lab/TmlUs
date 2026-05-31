import { access, cp, mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { DirectoryEnsureResult, FileEnsureResult } from '../core/types.js';

export function resolveProjectPath(projectRoot: string, relativePath: string): string {
  const resolvedRoot = path.resolve(projectRoot);
  const resolvedTarget = path.resolve(resolvedRoot, relativePath);
  const relative = path.relative(resolvedRoot, resolvedTarget);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside project root: ${relativePath}`);
  }

  return resolvedTarget;
}

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDirectory(projectRoot: string, relativePath: string): Promise<DirectoryEnsureResult> {
  const targetPath = resolveProjectPath(projectRoot, relativePath);

  try {
    if (await pathExists(targetPath)) {
      const targetStatus = await stat(targetPath);
      if (!targetStatus.isDirectory()) {
        return {
          path: relativePath,
          status: 'failed',
          error: 'Path exists but is not a directory.'
        };
      }

      return { path: relativePath, status: 'existing' };
    }

    await mkdir(targetPath, { recursive: true });
    return { path: relativePath, status: 'created' };
  } catch (error) {
    return {
      path: relativePath,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function ensureFile(projectRoot: string, relativePath: string, content = ''): Promise<FileEnsureResult> {
  const targetPath = resolveProjectPath(projectRoot, relativePath);

  try {
    if (await pathExists(targetPath)) {
      const targetStatus = await stat(targetPath);
      if (!targetStatus.isFile()) {
        return {
          path: relativePath,
          status: 'failed',
          error: 'Path exists but is not a file.'
        };
      }

      return { path: relativePath, status: 'existing' };
    }

    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, content, { flag: 'wx' });
    return { path: relativePath, status: 'created' };
  } catch (error) {
    return {
      path: relativePath,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function copyDirectory(sourcePath: string, projectRoot: string, relativeDestination: string): Promise<void> {
  const targetPath = resolveProjectPath(projectRoot, relativeDestination);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await cp(sourcePath, targetPath, {
    force: true,
    recursive: true
  });
}
