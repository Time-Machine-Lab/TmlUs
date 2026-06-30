## Why

TmlUs maintains a curated Skill catalog so team members can discover and install approved AI capabilities through `tmlus skills`. WeWrite is a complete WeChat public account writing, formatting, and publishing Skill, and adding it to the maintained catalog makes content creation workflows available through the same local-first installation path.

## What Changes

- Add `wewrite` to the official remote Skill catalog data.
- Add `wewrite` to the bundled fallback Skill catalog so offline and disabled-remote modes remain usable.
- Document WeWrite in the `tmlus skills` command reference.
- Extend catalog checks so WeWrite remains resolvable by ID and aliases and keeps the expected installer strategy.
- Remove the accidental local `.codex/skills/wewrite` placeholder left from the interrupted exploratory attempt.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `remote-skill-catalog`: the official catalog must include WeWrite as a content creation Skill backed by `github:oaker-io/wewrite`.
- `skill-discovery-install`: the maintained Skill list must expose WeWrite and allow installing it through the existing Skill install flow.

## Impact

- Affected data: `data/skills/catalog.json`.
- Affected fallback source: `tmlus-core/src/catalog/skills.ts`.
- Affected docs: `docs/TmlUs命令Wiki.md`.
- Affected checks: `tmlus-core/scripts/check-dev-guidelines.mjs`.
- No new service, account system, database, hosted API, or new installer strategy is introduced.
