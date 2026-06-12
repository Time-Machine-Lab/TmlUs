## Context

TmlUs already caches remote Skill catalog data so `tmlus skills` and `tmlus skills search` can stay fast, reduce GitHub traffic, and keep working with stale or bundled fallbacks when remote resources fail. The cache is user-level state, not project state. It currently includes the official Skill catalog cache, the remote search source registry cache, and resolver-based search result caches.

Today users can only force a full cache rebuild by finding and deleting cache files manually or by changing cache-related environment variables. That creates unnecessary friction when remote catalog data changes, resolver configuration changes, or a stale cache masks the expected result.

This change stays inside the existing local-first CLI architecture: the CLI shell dispatches a command, an application use case performs the cache operation, and the UI renderer reports a concise summary.

## Goals / Non-Goals

**Goals:**

- Add a first-class `tmlus refresh` command for clearing TmlUs-owned cache files.
- Reuse the existing cache root behavior, including `TMLUS_SKILL_CACHE_DIR`, `%LOCALAPPDATA%`, `$XDG_CACHE_HOME`, and `~/.cache`.
- Delete only known TmlUs cache files: official Skill catalog cache, search source registry cache, and remote Skill search result caches.
- Make the command safe for automation through deterministic output, `--quiet` support, and non-zero exit only when deletion fails.
- Keep the next cache rebuild delegated to existing `tmlus skills` and `tmlus skills search` loading flows.

**Non-Goals:**

- Do not delete project files, AI IDE folders, installed Skills, `.codegraph/`, OpenSpec artifacts, npm cache, Git cache, or external tool state.
- Do not add hosted refresh services, accounts, dashboards, databases, or API contracts.
- Do not change cache TTL semantics, remote fallback order, catalog validation, or resolver behavior.
- Do not fetch remote data during `tmlus refresh`; refresh clears cache only.

## Decisions

### Decision 1: Introduce a shared cache helper for TmlUs cache paths

The current cache root logic is duplicated between catalog loading and remote Skill search. The implementation should centralize cache root resolution in a small helper so `refresh`, `skill-catalog`, and `skill-search` agree on the same directory.

Alternative considered: duplicate the same path logic inside the refresh flow. That would be faster to write but risks clearing a different location than the loaders use after future path changes.

### Decision 2: Clear a whitelist of cache files instead of deleting the whole cache directory

`tmlus refresh` should target:

- `skills-catalog.json`
- `skills-search-sources.json`
- `skills-search-*.json`

This keeps the command safe if the cache directory is shared with future TmlUs cache types or user-created files. It also avoids accidentally deleting unrelated files when `TMLUS_SKILL_CACHE_DIR` points to a broad directory during tests or advanced usage.

Alternative considered: remove the entire resolved cache directory. That is simpler but less safe and does not preserve the product boundary of clearing only TmlUs-managed cache files.

### Decision 3: Treat missing cache as a successful skipped state

If a cache file is absent, the command should report it as skipped or simply include it in the skipped count. The user asked to clean caches; a clean state is already achieved when files do not exist.

Alternative considered: fail when no cache files exist. That would make automation brittle and punish the normal first-run state.

### Decision 4: Keep refresh separate from remote fetching

The command should not immediately re-fetch the remote catalog or search data. Existing Skill commands already own loading, validation, fallback, and cache writing. Keeping refresh as a delete-only action preserves single responsibility and avoids surprising network work.

Alternative considered: add a `tmlus refresh` flow that clears and then warms the cache. That could be useful later, but it would need source selection, failure messaging, and remote fetch semantics beyond the user's requested cache cleanup.

### Decision 5: Reuse command registry and UI renderer patterns

`tmlus refresh` should be registered like existing commands, appear in bilingual help, and render its summary through the CLI UI renderer. `--quiet`, CI, non-TTY, and no-color behavior should follow existing command output rules.

Alternative considered: print directly from the refresh use case. That would blur Application Use Case and UI Renderer boundaries described by the architecture document.

## Risks / Trade-offs

- Cache path mismatch -> Centralize cache root and cache filename helpers before wiring refresh.
- Over-deletion when `TMLUS_SKILL_CACHE_DIR` is broad -> Delete only known filenames and `skills-search-*.json`.
- Hidden stale data if future cache files are added -> Keep refresh cache targets explicit and extend tests when adding new TmlUs cache types.
- Confusion between refresh and update -> Help text must distinguish cache cleanup from `tmlus update`, which updates the CLI package.
- Automation ambiguity -> Quiet output should remain compact and deletion failures should set a non-zero exit code.

## Migration Plan

1. Add shared cache path helpers while preserving the existing resolved cache directory and file names.
2. Update catalog and search code to use the shared helpers without changing loader behavior.
3. Add the refresh use case and CLI dispatch.
4. Add help metadata, summary rendering, command checks, and command wiki coverage.
5. Verify existing skill catalog/search tests still pass, then add refresh-specific checks.

Rollback is simple: remove the command dispatch, refresh use case, help metadata, and tests. Existing cache loading behavior should remain compatible because cache file names and directory resolution are unchanged.

## Open Questions

- Should a later change add `tmlus refresh --warm` or `tmlus refresh skills` for selective cache rebuilding? This proposal intentionally keeps the first version delete-only and all-cache for TmlUs-owned Skill cache files.
