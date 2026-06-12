import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  loadSkillCatalog,
  loadSkillSearchSourceRegistry,
  normalizeSkillSearchSourcesDocument
} from '../dist/catalog/skill-catalog.js';
import {
  matchGitHubSkillPath,
  parseSkillFrontmatter
} from '../dist/adapters/tools/github-skill-source.js';
import {
  resolveSkillIds
} from '../dist/app/skill-install.js';
import {
  resolveSkillSearchSources,
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
  assert.deepEqual(defaultResolved.sources.map((source) => source.id), ['tml-skills']);

  const explicitResolved = resolveSkillSearchSources(['tml-skills'], registry);
  assert.deepEqual(explicitResolved.sources.map((source) => source.id), ['tml-skills']);

  const aliasResolved = resolveSkillSearchSources(['tml-team'], registry);
  assert.deepEqual(aliasResolved.sources.map((source) => source.id), ['tml-skills']);

  const tmlSource = registry.sources.find((source) => source.id === 'tml-skills');
  assert.equal(typeof tmlSource.description, 'string');
  assert.equal(tmlSource.description.includes('TML'), true);
  assert.equal(tmlSource.source, 'github:Time-Machine-Lab/TML-Skills');
  assert.equal(tmlSource.resolver.type, 'github-skill-files');
  assert.deepEqual(tmlSource.resolver.patterns, ['skills/{id}/SKILL.md']);
  assert.equal(tmlSource.resolver.metadata.category, 'frontmatter.category');
  assert.equal(tmlSource.resolver.installSource, 'skills/{id}');

  const mattSource = registry.sources.find((source) => source.id === 'mattpocock-skills');
  assert.equal(mattSource.displayName, 'Matt Pocock Skills');
  assert.equal(mattSource.description.includes('需求未对齐'), true);
  assert.equal(mattSource.source, 'github:mattpocock/skills');
  assert.equal(mattSource.resolver.type, 'github-skill-files');
  assert.deepEqual(mattSource.resolver.patterns, ['skills/{category}/{id}/SKILL.md']);
  assert.equal(mattSource.resolver.metadata.name, 'frontmatter.name');
  assert.equal(mattSource.resolver.metadata.category, 'path.category');
  assert.equal(mattSource.resolver.installSource, 'skills/{category}/{id}');
  assert.deepEqual(mattSource.resolver.includeCategories, ['engineering', 'productivity', 'misc']);
  assert.equal(mattSource.resolver.excludeCategories.includes('deprecated'), true);
  assert.equal(mattSource.resolver.excludeCategories.includes('personal'), true);
  assert.equal(mattSource.resolver.excludeCategories.includes('in-progress'), true);
  assert.equal(mattSource.discovery, undefined);

  const mattAliasResolved = resolveSkillSearchSources(['mattpocock'], registry);
  assert.deepEqual(mattAliasResolved.sources.map((source) => source.id), ['mattpocock-skills']);
});

{
  const legacyRegistry = normalizeSkillSearchSourcesDocument({
    version: 1,
    defaultSourceId: 'legacy',
    sources: [
      {
        id: 'legacy',
        displayName: 'Legacy',
        type: 'github-directory',
        source: 'github:example/legacy/skills',
        category: 'Legacy'
      }
    ]
  });
  assert.equal(legacyRegistry.sources[0].description, undefined);
  assert.equal(legacyRegistry.sources[0].discovery, undefined);
  assert.equal(legacyRegistry.sources[0].resolver, undefined);
}

{
  const legacyManifestRegistry = normalizeSkillSearchSourcesDocument({
    version: 1,
    defaultSourceId: 'legacy-manifest',
    sources: [
      {
        id: 'legacy-manifest',
        displayName: 'Legacy Manifest',
        type: 'github-directory',
        source: 'github:example/legacy/skills',
        category: 'Legacy',
        discovery: {
          strategy: 'skill-manifest',
          maxDepth: 2,
          excludeCategories: ['deprecated'],
          concurrency: 4
        }
      }
    ]
  });
  assert.equal(legacyManifestRegistry.sources[0].discovery.strategy, 'skill-manifest');
  assert.equal(legacyManifestRegistry.sources[0].resolver.type, 'github-skill-files');
  assert.deepEqual(legacyManifestRegistry.sources[0].resolver.patterns, ['{category}/{id}/SKILL.md']);
  assert.equal(legacyManifestRegistry.sources[0].resolver.excludeCategories.includes('deprecated'), true);
}

{
  assert.throws(() => normalizeSkillSearchSourcesDocument({
    version: 1,
    defaultSourceId: 'invalid',
    sources: [
      {
        id: 'invalid',
        displayName: 'Invalid',
        type: 'github-directory',
        source: 'github:example/invalid',
        category: 'Invalid',
        resolver: {
          type: 'remote-js',
          patterns: ['skills/{id}/SKILL.md']
        }
      }
    ]
  }), /resolver\.type is unsupported/);
}

{
  assert.deepEqual(
    matchGitHubSkillPath('skills/{category}/{id}/SKILL.md', 'skills/engineering/tdd/SKILL.md'),
    { category: 'engineering', id: 'tdd' }
  );
  assert.equal(
    matchGitHubSkillPath('skills/{category}/{id}/SKILL.md', 'skills/deprecated/SKILL.md'),
    undefined
  );

  const parsed = parseSkillFrontmatter(`---
name: example-skill
category: 示例
description: >
  Solve one problem.
  Keep details readable.
---

# Example
`);
  assert.deepEqual(parsed, {
    name: 'example-skill',
    category: '示例',
    description: 'Solve one problem. Keep details readable.'
  });

  const fallback = parseSkillFrontmatter('# No frontmatter');
  assert.deepEqual(fallback, {});
}

console.log('skill catalog checks passed');
