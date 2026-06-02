## 1. Data Files

- [x] 1.1 Add `data/skills/catalog.json` with the current bundled Skill catalog entries.
- [x] 1.2 Add `humanizer-zh` to `data/skills/catalog.json` with category `内容创作`, source `github:op7418/Humanizer-zh`, and `github-root-skill` installer metadata.
- [x] 1.3 Add `data/skills/search-sources.json` with default `tmlus` source and additional `tml-skills` source.
- [x] 1.4 Define fixture data for tests so catalog and source registry checks do not depend on live GitHub.

## 2. Catalog Loading

- [x] 2.1 Add types for remote Skill catalog documents and remote Skill search source documents.
- [x] 2.2 Implement validation and normalization from remote catalog entries to `SkillDefinition[]`.
- [x] 2.3 Implement local cache read/write with 4-hour default TTL and stale-cache fallback.
- [x] 2.4 Implement official catalog loading with fallback order: fresh cache, remote fetch, stale cache, bundled catalog.
- [x] 2.5 Add configuration hooks for catalog URL override, TTL override, and remote catalog disablement.

## 3. Skill Flow Integration

- [x] 3.1 Refactor Skill resolution so `tmlus skills` uses a loaded catalog instead of direct `SKILL_CATALOG` imports.
- [x] 3.2 Refactor `tmlus init` Skill selection to use the same loaded catalog.
- [x] 3.3 Update unknown Skill messages to report IDs from the active loaded catalog.
- [x] 3.4 Keep bundled `SKILL_CATALOG` available as fallback and for offline behavior.

## 4. Search Source Integration

- [x] 4.1 Load search source definitions from `data/skills/search-sources.json` with cache and bundled fallback.
- [x] 4.2 Make `tmlus` the default source for `tmlus skills search`.
- [x] 4.3 Keep `tml-skills` mapped to `github:Time-Machine-Lab/TML-Skills/skills`.
- [x] 4.4 Support both catalog-backed and GitHub-directory-backed search sources in `searchRemoteSkills`.

## 5. UI And Documentation

- [x] 5.1 Update Skill list/search UI text so it no longer assumes only TML Team or only directory-based search.
- [x] 5.2 Keep quiet, CI, non-TTY, and no-color output compatible with the existing CLI design rules.
- [x] 5.3 Update `docs/spec/TmlUs开发规范文档.md` so Skill addition rules point to `data/skills/catalog.json`, clarify bundled catalog fallback, and keep installer strategy rules unchanged.
- [x] 5.4 Update `docs/TmlUs命令Wiki.md` for remote catalog loading, cache behavior, `Humanizer-zh`, and search source selection.
- [x] 5.5 Update `docs/design/TmlUs架构设计文档.md` only if the Resource Catalog section needs wording that distinguishes remote official catalogs from bundled fallback catalogs.

## 6. Verification

- [x] 6.1 Add tests for remote catalog success and cache refresh.
- [x] 6.2 Add tests for fresh cache hit and stale cache fallback.
- [x] 6.3 Add tests for invalid remote catalog fallback to bundled catalog.
- [x] 6.4 Add tests for `humanizer-zh` direct install resolution.
- [x] 6.5 Add tests for default `tmlus` search source and explicit `tml-skills` search source.
- [x] 6.6 Run `npm run build` and relevant command/dev-guideline checks.
