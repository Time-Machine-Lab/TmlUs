import { readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  isSkillSearchCacheFile,
  SKILL_CATALOG_CACHE_FILE,
  SKILL_SEARCH_SOURCES_CACHE_FILE,
  skillCacheDirectory
} from './cache-paths.js';
import type { TmlusRefreshEntryResult, TmlusRefreshResult } from '../core/types.js';

const FIXED_CACHE_FILES = [
  SKILL_CATALOG_CACHE_FILE,
  SKILL_SEARCH_SOURCES_CACHE_FILE
] as const;

function entry(label: string, targetPath: string, status: TmlusRefreshEntryResult['status'], error?: string): TmlusRefreshEntryResult {
  return {
    label,
    path: targetPath,
    status,
    ...(error ? { error } : {})
  };
}

async function discoverRefreshTargets(cacheDirectory: string): Promise<string[]> {
  const targets = new Set<string>(FIXED_CACHE_FILES);

  try {
    const entries = await readdir(cacheDirectory, { withFileTypes: true });
    for (const candidate of entries) {
      if (candidate.isFile() && isSkillSearchCacheFile(candidate.name)) {
        targets.add(candidate.name);
      }
    }
  } catch {
    return [...targets];
  }

  return [...targets].sort();
}

async function removeCacheFile(cacheDirectory: string, fileName: string): Promise<TmlusRefreshEntryResult> {
  const targetPath = path.join(cacheDirectory, fileName);

  try {
    const current = await stat(targetPath);
    if (!current.isFile()) {
      return entry(fileName, targetPath, 'skipped', 'Path exists but is not a file.');
    }
  } catch {
    return entry(fileName, targetPath, 'skipped');
  }

  try {
    await rm(targetPath, { force: true });
    return entry(fileName, targetPath, 'deleted');
  } catch (error) {
    return entry(fileName, targetPath, 'failed', error instanceof Error ? error.message : String(error));
  }
}

export async function runTmlusRefresh(env: NodeJS.ProcessEnv = process.env): Promise<TmlusRefreshResult> {
  const cacheDirectory = skillCacheDirectory(env);
  const targets = await discoverRefreshTargets(cacheDirectory);
  const entries: TmlusRefreshEntryResult[] = [];

  for (const target of targets) {
    entries.push(await removeCacheFile(cacheDirectory, target));
  }

  return {
    cacheDirectory,
    entries
  };
}

export function tmlusRefreshHasFailure(result: TmlusRefreshResult): boolean {
  return result.entries.some((entryResult) => entryResult.status === 'failed');
}
