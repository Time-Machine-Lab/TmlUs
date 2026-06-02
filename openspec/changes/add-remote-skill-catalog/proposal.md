## Why

TmlUs Skill discovery is currently tied to the npm package release cycle because the maintained Skill catalog lives in CLI source code. The team needs to update official Skill metadata, add content creation Skills such as Humanizer-zh, and adjust remote search sources without publishing a new CLI version each time.

This change keeps TmlUs local-first while moving Skill catalog data to a GitHub-hosted data file that the CLI can read with a short cache and safe fallbacks.

## What Changes

- Add a remote official Skill catalog under `Time-Machine-Lab/TmlUs` at `data/skills/`, with `Humanizer-zh` included in category `内容创作`.
- Make `tmlus skills` and the Skill step in `tmlus init` load the official catalog from the remote data file by default, using a multi-hour local cache.
- Keep the bundled catalog as an offline and network-failure fallback so existing workflows continue to work without GitHub access.
- Add a remote search source registry so `Time-Machine-Lab/TmlUs` is the default search source and `Time-Machine-Lab/TML-Skills` remains an additional remote Skill source.
- Preserve the existing install strategies (`github-directory`, `github-root-skill`, `github-skill-bundle`, `local-directory`) and AI IDE target handling.
- Add configuration hooks for tests and advanced users to override the catalog URL, cache TTL, and remote catalog behavior.

Non-goals:

- Do not introduce hosted accounts, a backend service, dashboards, databases, or a remote API controlled by TmlUs.
- Do not remove local fallback behavior or require network access for all Skill commands.
- Do not change the Skill installation file layout for Codex, Claude, Cursor, Trae, or CodeBuddy.
- Do not make `TML-Skills` the official default catalog; it remains a remote search/content source.

## Capabilities

### New Capabilities

- `remote-skill-catalog`: Official GitHub-hosted Skill catalog loading, local caching, fallback behavior, and remote source registry.

### Modified Capabilities

- `skill-discovery-install`: Skill discovery SHALL use the remote official catalog by default, support cached/stale fallback behavior, and include Humanizer-zh as a maintained content creation Skill.

## Impact

- Affected code:
  - `tmlus-core/src/catalog/skills.ts`
  - `tmlus-core/src/app/skill-install.ts`
  - `tmlus-core/src/app/skill-flow.ts`
  - `tmlus-core/src/app/skill-search.ts`
  - `tmlus-core/src/cli/index.ts`
  - `tmlus-core/src/ui/output.ts`
  - `tmlus-core/src/ui/selection.ts`
  - `tmlus-core/src/adapters/tools/github-skill-source.ts` or a new catalog adapter
- Affected top-level docs:
  - `docs/spec/TmlUs开发规范文档.md`
  - `docs/TmlUs命令Wiki.md`
  - optionally `docs/design/TmlUs架构设计文档.md` if Resource Catalog wording needs to distinguish remote official catalogs from bundled fallback catalogs
- New repository data files:
  - `data/skills/catalog.json`
  - `data/skills/search-sources.json`
- Tests and checks must cover remote catalog success, cache hit, stale fallback, bundled fallback, search source resolution, and direct install of `humanizer-zh`.
- Runtime network use remains limited to fetching static GitHub-hosted data and Skill source content.
