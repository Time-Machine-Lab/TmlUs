## Context

TmlUs is a local-first CLI that installs team-maintained AI development capabilities into the user's current project and AI IDE environments. The existing Skill flow already has a stable installer model and a local `SKILL_CATALOG`, plus a remote search path that can enumerate GitHub directories.

The current catalog source is too tightly coupled to npm releases: adding an official Skill or changing its metadata requires publishing a new CLI version. The team wants `Time-Machine-Lab/TmlUs` to host the official Skill data under `data/skills/`, while `Time-Machine-Lab/TML-Skills` remains one remote search/content source among multiple sources.

This design keeps the CLI local-first. GitHub is treated as a static resource source, not as a TmlUs backend service.

## Goals / Non-Goals

**Goals:**

- Load the official Skill catalog from `Time-Machine-Lab/TmlUs/data/skills/catalog.json` by default.
- Cache remote catalog data locally for a multi-hour TTL so repeated `tmlus skills` usage does not hit GitHub every time.
- Fall back safely to fresh cache, stale cache, or bundled catalog when the network or remote data is unavailable.
- Add `Humanizer-zh` as an official Skill in category `内容创作`.
- Move extra remote search source definitions to `Time-Machine-Lab/TmlUs/data/skills/search-sources.json`.
- Keep `TmlUs Official` out of the Search Source list because `tmlus skills` already loads it as the main catalog.
- Make `tml-skills` the default search source for `tmlus skills search`.
- Reuse existing Skill install strategies and AI IDE target resolution.

**Non-Goals:**

- No server-side TmlUs service, account system, dashboard, database, or remote write API.
- No mandatory network dependency for `tmlus skills` or `tmlus init`.
- No change to installed Skill directory layout for supported AI IDE environments.
- No semantic search, ranking, recommendation, or package registry behavior.
- No automatic update of already installed Skill files unless the existing install flow explicitly installs a selected Skill.

## Decisions

### Decision 1: Host official catalog data in the TmlUs repository

The official catalog will live in this repository under `data/skills/catalog.json`. The default URL will be the raw GitHub URL for the main branch. The catalog will contain metadata needed to construct `SkillDefinition` values, including ID, aliases, name, source, category, description, installer, and targets.

Alternative considered: keep official data in `Time-Machine-Lab/TML-Skills`.

Rationale: `TmlUs` owns the CLI product and the maintained recommendation surface. `TML-Skills` can remain a content/search source without becoming the release gate for official CLI defaults.

### Decision 2: Add a catalog loader instead of expanding hard-coded catalog usage

Introduce a `loadSkillCatalog()` application/catalog function that returns normalized `SkillDefinition[]`. `tmlus skills`, `tmlus init`, `resolveSkillIds`, catalog rendering, and unknown Skill messages should use the loaded catalog instead of importing `SKILL_CATALOG` directly where runtime data is required.

The bundled `SKILL_CATALOG` remains as fallback data and as a minimal offline baseline.

Alternative considered: make only `tmlus skills search` remote-aware.

Rationale: the user's pain is official catalog freshness, not only optional search. The default list and direct install arguments must see remote catalog updates without a CLI release.

### Decision 3: Use local file cache with fallback tiers

Remote catalog and source registry fetches will use this resolution order:

1. Fresh cache if present and within TTL.
2. Remote fetch from GitHub raw URL.
3. Stale cache if remote fetch or validation fails.
4. Bundled fallback catalog or source registry.

Default TTL is 4 hours. Tests and advanced users can override behavior with environment variables such as `TMLUS_SKILL_CATALOG_URL`, `TMLUS_SKILL_CATALOG_TTL_HOURS`, and `TMLUS_DISABLE_REMOTE_CATALOG`.

Alternative considered: always fetch remote data.

Rationale: a multi-hour cache protects GitHub rate limits, improves CLI responsiveness, and preserves local-first behavior.

### Decision 4: Validate remote JSON before using it

The loader will validate the top-level schema version and each Skill entry. Invalid IDs, missing required fields, unsupported install strategies, malformed sources, or unsupported target definitions cause the remote result to be rejected and trigger fallback behavior.

The catalog may support a compact `targets: "common"` shortcut that normalizes to `COMMON_SKILL_TARGETS`, but stored cache should include enough data to reconstruct the validated catalog deterministically.

Alternative considered: trust remote JSON because it is in the official repo.

Rationale: TmlUs writes into user project directories. Even official remote data should not bypass basic validation.

### Decision 5: Separate catalog data from search source registry

`catalog.json` defines official Skills shown by default. `search-sources.json` defines extra named remote sources for `tmlus skills search`.

The official TmlUs catalog will not be registered as a Search Source. The default search source ID will be `tml-skills`, pointing to `github:Time-Machine-Lab/TML-Skills/skills` as a GitHub directory source.

Alternative considered: use one file for both catalog and sources.

Rationale: the catalog answers "what does TmlUs officially list?" while sources answer "where can users discover more?" Keeping them separate makes future source additions lighter and avoids changing official recommendations unintentionally.

## Risks / Trade-offs

- Remote data is unavailable or rate-limited -> use fresh/stale cache first and bundled fallback last; support `GITHUB_TOKEN`/`GH_TOKEN` where the existing GitHub adapter already does.
- Remote catalog schema drifts -> version the catalog format and reject unsupported versions with a clear fallback.
- Tests become flaky if they depend on live GitHub -> expose URL/cache overrides and test with local fixtures or mocked fetch behavior.
- Default remote loading may surprise users in restricted networks -> keep offline fallback and provide an opt-out environment variable.
- Search source behavior can become confusing if the official catalog appears in both places -> keep `TmlUs Official` out of Search Source and document that `tmlus skills` is the official catalog while `tmlus skills search` searches additional sources.

## Migration Plan

1. Add `data/skills/catalog.json` and `data/skills/search-sources.json` with entries matching the current bundled catalog plus `humanizer-zh`, while keeping Search Source limited to extra sources such as `tml-skills`.
2. Implement catalog/source registry loading with cache and validation.
3. Update Skill flows to accept a loaded catalog instead of directly reading static arrays.
4. Keep bundled catalog exports for fallback and tests.
5. Update command checks to avoid live-network dependence by using local fixture URLs or disabled remote mode.
6. Update top-level docs so the Skill maintenance path says official additions go through `data/skills/catalog.json`, not only source-code catalog edits.
7. Rollback strategy: set `TMLUS_DISABLE_REMOTE_CATALOG=1` or revert the flow to bundled catalog while keeping install logic unchanged.

## Open Questions

- Should catalog JSON allow `targets: "common"` in the public file, or should it require fully expanded target arrays for maximum explicitness?
- Should there be a user-facing command or flag to refresh the cache immediately, or is TTL plus environment override enough for this change?
