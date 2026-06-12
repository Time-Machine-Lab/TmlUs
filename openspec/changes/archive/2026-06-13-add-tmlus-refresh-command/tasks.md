## 1. Cache Path Foundation

- [x] 1.1 Add shared cache path helpers for resolving the TmlUs Skill cache directory and known cache file names.
- [x] 1.2 Update remote Skill catalog loading to use the shared cache helpers without changing cache filenames or fallback behavior.
- [x] 1.3 Update remote Skill search result caching to use the shared cache helpers without changing cache filenames or TTL behavior.

## 2. Refresh Use Case

- [x] 2.1 Add refresh result types for deleted, skipped, and failed cache entries.
- [x] 2.2 Implement a refresh application flow that deletes `skills-catalog.json`, `skills-search-sources.json`, and `skills-search-*.json` from the configured cache directory.
- [x] 2.3 Ensure missing cache files are treated as skipped and deletion errors are captured per entry.
- [x] 2.4 Ensure refresh does not fetch remote catalog, search source, or search result data.
- [x] 2.5 Ensure refresh deletes only known TmlUs-managed cache files and leaves unrelated files in the cache directory untouched.

## 3. CLI and Output

- [x] 3.1 Register `refresh` in CLI command resolution and dispatch.
- [x] 3.2 Add `runRefresh` wiring that invokes the refresh use case and sets non-zero exit status on deletion failure.
- [x] 3.3 Add CLI summary rendering for refresh results with normal and `--quiet` behavior.
- [x] 3.4 Add `refresh` metadata to the command registry with bilingual description, examples, and notes distinguishing it from `update`.

## 4. Documentation and Tests

- [x] 4.1 Update `docs/TmlUs命令Wiki.md` command index and command reference for `tmlus refresh`.
- [x] 4.2 Extend command checks so `tmlus help` includes `refresh`, old `--refresh` command-style usage is rejected, and the command wiki contains the registry entry.
- [x] 4.3 Add tests for deleting existing cache files, skipping absent cache files, respecting `TMLUS_SKILL_CACHE_DIR`, and leaving unrelated files untouched.
- [x] 4.4 Add tests or assertions that refresh does not perform remote fetch work.

## 5. Verification

- [x] 5.1 Run `npm run build` in `tmlus-core`.
- [x] 5.2 Run `npm run check:commands` in `tmlus-core`.
- [x] 5.3 Run `npm run check:skill-catalog` in `tmlus-core`.
- [x] 5.4 Run refresh-specific tests or the relevant check script after implementation.
- [x] 5.5 Run `openspec validate add-tmlus-refresh-command --strict`.
