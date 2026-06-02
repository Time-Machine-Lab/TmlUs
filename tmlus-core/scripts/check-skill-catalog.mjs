import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  loadSkillCatalog,
  loadSkillSearchSourceRegistry
} from '../dist/catalog/skill-catalog.js';
import {
  resolveSkillIds
} from '../dist/app/skill-install.js';
import {
  resolveSkillSearchSources,
  searchRemoteSkills
} from '../dist/app/skill-search.js';

const repoRoot = path.resolve('..');
const fixtureCatalog = path.join(repoRoot, 'tmlus-core', 'scripts', 'fixtures', 'remote-skill-catalog.json');
const fixtureSources = path.join(repoRoot, 'tmlus-core', 'scripts', 'fixtures', 'remote-skill-search-sources.json');

function testEnv(cacheDir, extra = {}) {
  return {
    ...process.env,
    TMLUS_SKILL_CACHE_DIR: cacheDir,
    TMLUS_SKILL_CATALOG_URL: fixtureCatalog,
    TMLUS_SKILL_SEARCH_SOURCES_URL: fixtureSources,
    ...extra
  };
}

async function withTempCache(callback) {
  const root = await mkdtemp(path.join(tmpdir(), 'tmlus-skill-cache-'));
  try {
    return await callback(root);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

await withTempCache(async (cacheDir) => {
  const catalog = await loadSkillCatalog({ env: testEnv(cacheDir) });
  assert.equal(catalog.some((skill) => skill.id === 'fixture-skill'), true);
  assert.equal(existsSync(path.join(cacheDir, 'skills-catalog.json')), true);
});

await withTempCache(async (cacheDir) => {
  const env = testEnv(cacheDir);
  const first = await loadSkillCatalog({ env });
  assert.equal(first.some((skill) => skill.id === 'fixture-skill'), true);

  const second = await loadSkillCatalog({
    env: testEnv(cacheDir, { TMLUS_SKILL_CATALOG_URL: 'https://example.invalid/catalog.json' })
  });
  assert.equal(second.some((skill) => skill.id === 'fixture-skill'), true);
});

await withTempCache(async (cacheDir) => {
  const env = testEnv(cacheDir);
  const cachedAt = new Date('2026-06-02T00:00:00.000Z');
  const later = new Date('2026-06-02T05:00:00.000Z');
  const first = await loadSkillCatalog({ env, now: cachedAt });
  assert.equal(first.some((skill) => skill.id === 'fixture-skill'), true);

  const stale = await loadSkillCatalog({
    env: testEnv(cacheDir, { TMLUS_SKILL_CATALOG_URL: 'https://example.invalid/catalog.json' }),
    now: later
  });
  assert.equal(stale.some((skill) => skill.id === 'fixture-skill'), true);
});

await withTempCache(async (cacheDir) => {
  const invalidCatalog = path.join(cacheDir, 'invalid-catalog.json');
  await writeFile(invalidCatalog, JSON.stringify({ version: 999, skills: [] }), 'utf8');
  const fallback = await loadSkillCatalog({
    env: testEnv(cacheDir, { TMLUS_SKILL_CATALOG_URL: invalidCatalog })
  });
  assert.equal(fallback.some((skill) => skill.id === 'skill-creator'), true);
  assert.equal(fallback.some((skill) => skill.id === 'fixture-skill'), false);
});

await withTempCache(async (cacheDir) => {
  const catalog = await loadSkillCatalog({ env: testEnv(cacheDir) });
  const resolved = resolveSkillIds(['humanizer-zh'], catalog);
  assert.equal(resolved.unknown.length, 0);
  assert.equal(resolved.skills[0].category, '内容创作');
  assert.equal(resolved.skills[0].installer.strategy, 'github-root-skill');
});

await withTempCache(async (cacheDir) => {
  const registry = await loadSkillSearchSourceRegistry({ env: testEnv(cacheDir) });
  const defaultResolved = resolveSkillSearchSources([], registry);
  assert.deepEqual(defaultResolved.sources.map((source) => source.id), ['tmlus']);

  const explicitResolved = resolveSkillSearchSources(['tml-skills'], registry);
  assert.deepEqual(explicitResolved.sources.map((source) => source.id), ['tml-skills']);

  const aliasResolved = resolveSkillSearchSources(['tml-team'], registry);
  assert.deepEqual(aliasResolved.sources.map((source) => source.id), ['tml-skills']);
});

await withTempCache(async (cacheDir) => {
  const previousCatalogUrl = process.env.TMLUS_SKILL_CATALOG_URL;
  const previousSourcesUrl = process.env.TMLUS_SKILL_SEARCH_SOURCES_URL;
  const previousCacheDir = process.env.TMLUS_SKILL_CACHE_DIR;
  process.env.TMLUS_SKILL_CATALOG_URL = fixtureCatalog;
  process.env.TMLUS_SKILL_SEARCH_SOURCES_URL = fixtureSources;
  process.env.TMLUS_SKILL_CACHE_DIR = cacheDir;
  try {
    const result = await searchRemoteSkills([]);
    assert.equal(result.unknown.length, 0);
    assert.equal(result.skills.some((skill) => skill.id === 'fixture-skill'), true);
  } finally {
    if (previousCatalogUrl === undefined) {
      delete process.env.TMLUS_SKILL_CATALOG_URL;
    } else {
      process.env.TMLUS_SKILL_CATALOG_URL = previousCatalogUrl;
    }
    if (previousSourcesUrl === undefined) {
      delete process.env.TMLUS_SKILL_SEARCH_SOURCES_URL;
    } else {
      process.env.TMLUS_SKILL_SEARCH_SOURCES_URL = previousSourcesUrl;
    }
    if (previousCacheDir === undefined) {
      delete process.env.TMLUS_SKILL_CACHE_DIR;
    } else {
      process.env.TMLUS_SKILL_CACHE_DIR = previousCacheDir;
    }
  }
});

console.log('skill catalog checks passed');
