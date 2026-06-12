## 1. Source Registry Schema

- [x] 1.1 Extend `SkillSearchSource` types and normalization to accept a preferred `resolver` configuration.
- [x] 1.2 Define and validate `github-skill-files` resolver fields: `patterns`, `metadata`, `installSource`, `includeCategories`, and `excludeCategories`.
- [x] 1.3 Keep existing entries without `resolver` valid through current fallback behavior.
- [x] 1.4 Add compatibility mapping for existing `discovery.strategy` metadata where needed.

## 2. Resolver Engine

- [x] 2.1 Implement pattern matching for GitHub file paths with variables such as `{id}` and `{category}`.
- [x] 2.2 Extract path variables from matched `SKILL.md` paths.
- [x] 2.3 Apply source-specific include and exclude category filters during matching.
- [x] 2.4 Resolve metadata mappings from `path.*`, `frontmatter.*`, and `source.*` with deterministic fallbacks.
- [x] 2.5 Construct install source paths from the resolver `installSource` template.

## 3. GitHub Search Integration

- [x] 3.1 Update GitHub remote Skill search to use resolver-driven discovery when a source defines `resolver`.
- [x] 3.2 Enumerate repository trees once per source and fetch `SKILL.md` frontmatter only when required by metadata mappings.
- [x] 3.3 Use bounded concurrency for remote frontmatter reads.
- [x] 3.4 Ensure resolver search failures are scoped to the failed source and do not cancel other successful sources.
- [x] 3.5 Keep discovered Skills on the existing Skill installation pipeline.

## 4. Cache and Fallback

- [x] 4.1 Include resolver type, patterns, metadata mappings, install source template, and filters in the search cache key.
- [x] 4.2 Reuse fresh or stale cached resolver results when live remote discovery fails according to the existing cache policy.
- [x] 4.3 Preserve current one-level directory fallback for sources that do not define resolver.
- [x] 4.4 Add clear error or verbose diagnostics for invalid resolver configuration without breaking the entire registry.

## 5. Source Metadata

- [x] 5.1 Configure `tml-skills` with a flat `skills/{id}/SKILL.md` resolver.
- [x] 5.2 Configure `mattpocock-skills` with a categorized `skills/{category}/{id}/SKILL.md` resolver.
- [x] 5.3 Write the Matt Pocock source description in Chinese and include what problems the source helps solve.
- [x] 5.4 Exclude `deprecated`, `personal`, and `in-progress` from the Matt Pocock source by default.
- [x] 5.5 Update bundled fixture search source data to cover both flat and categorized resolver layouts.

## 6. CLI Display and Documentation

- [x] 6.1 Update source selection detail display to keep using source descriptions with resolver-backed sources.
- [x] 6.2 Ensure remote Skill search results show resolver-generated name, category, source, and description.
- [x] 6.3 Verify long Chinese descriptions remain readable in narrow, no-color, CI, non-TTY, quiet, and no-banner modes.
- [x] 6.4 Update `docs/TmlUs命令Wiki.md` for resolver-backed search sources and Matt Pocock source usage.

## 7. Tests and Validation

- [x] 7.1 Add unit coverage for resolver pattern matching and path variable extraction.
- [x] 7.2 Add fixture or integration coverage for TML-Skills flat resolver discovery.
- [x] 7.3 Add fixture or integration coverage for Matt Pocock categorized resolver discovery and excluded categories.
- [x] 7.4 Add coverage for invalid resolver configuration and legacy source fallback.
- [x] 7.5 Run `npm run build` and `npm run check:skill-catalog` from `tmlus-core`.
- [x] 7.6 Run OpenSpec validation for `refactor-skill-source-resolvers`.
