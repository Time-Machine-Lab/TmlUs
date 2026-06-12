## Why

TmlUs remote Skill catalog and remote Skill search both use local cache so daily commands stay fast and resilient, but users currently have no first-class way to discard stale or incorrect cache on demand. A `tmlus refresh` command gives developers a clear, local-first maintenance action without requiring environment-variable workarounds or manual file deletion.

## What Changes

- Add a `tmlus refresh` command that clears TmlUs-owned cache files for remote Skill catalog data, remote Skill search source registry data, and remote Skill search result data.
- Report which cache entries were deleted, skipped because absent, or failed to delete.
- Respect existing cache directory configuration, including `TMLUS_SKILL_CACHE_DIR` and platform-specific default cache roots.
- Keep the command non-destructive by limiting it to TmlUs-managed cache files, not project files, AI IDE directories, installed Skills, `.codegraph/`, or external tool state.
- Add bilingual help metadata and command wiki coverage for `tmlus refresh`.
- Preserve local-first behavior: after refresh, later `tmlus skills` or `tmlus skills search` runs rebuild cache through existing remote fetch and bundled fallback logic.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `remote-skill-catalog`: Add user-triggered cache clearing for official remote Skill catalog, search source registry, and remote Skill search result cache.
- `dynamic-help-command`: Include `refresh` in registered help output and command documentation.

## Impact

- Affected code: CLI command resolution and dispatch, command metadata registry, cache directory helpers, cache clearing use case, CLI summary rendering, command checks, and command wiki.
- Affected files likely include `tmlus-core/src/cli/index.ts`, `tmlus-core/src/cli/command-registry.ts`, `tmlus-core/src/catalog/skill-catalog.ts`, `tmlus-core/src/app/skill-search.ts`, a new refresh application module, `tmlus-core/src/ui/output.ts`, `tmlus-core/src/core/types.ts`, `tmlus-core/scripts/check-commands.mjs`, and `docs/TmlUs命令Wiki.md`.
- No hosted service, database, account, remote dashboard, or API contract is introduced.
