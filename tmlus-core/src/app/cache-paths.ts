import os from 'node:os';
import path from 'node:path';

export const SKILL_CATALOG_CACHE_FILE = 'skills-catalog.json';
export const SKILL_SEARCH_SOURCES_CACHE_FILE = 'skills-search-sources.json';
export const SKILL_SEARCH_CACHE_PREFIX = 'skills-search-';
export const SKILL_SEARCH_CACHE_SUFFIX = '.json';

export function envValue(env: NodeJS.ProcessEnv, name: string): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

export function skillCacheDirectory(env: NodeJS.ProcessEnv = process.env): string {
  const override = envValue(env, 'TMLUS_SKILL_CACHE_DIR');
  if (override) {
    return path.resolve(override);
  }

  const base = env.LOCALAPPDATA
    ?? env.XDG_CACHE_HOME
    ?? path.join(os.homedir(), '.cache');
  return path.join(base, 'tmlus', 'cache');
}

export function skillCatalogCachePath(env: NodeJS.ProcessEnv = process.env): string {
  return path.join(skillCacheDirectory(env), SKILL_CATALOG_CACHE_FILE);
}

export function skillSearchSourcesCachePath(env: NodeJS.ProcessEnv = process.env): string {
  return path.join(skillCacheDirectory(env), SKILL_SEARCH_SOURCES_CACHE_FILE);
}

export function skillSearchSourceCacheFile(sourceId: string): string {
  return `${SKILL_SEARCH_CACHE_PREFIX}${sourceId}${SKILL_SEARCH_CACHE_SUFFIX}`;
}

export function skillSearchSourceCachePath(sourceId: string, env: NodeJS.ProcessEnv = process.env): string {
  return path.join(skillCacheDirectory(env), skillSearchSourceCacheFile(sourceId));
}

export function isSkillSearchCacheFile(fileName: string): boolean {
  return fileName.startsWith(SKILL_SEARCH_CACHE_PREFIX) && fileName.endsWith(SKILL_SEARCH_CACHE_SUFFIX);
}
