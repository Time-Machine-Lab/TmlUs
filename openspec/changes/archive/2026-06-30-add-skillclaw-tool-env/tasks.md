## 1. Env Infrastructure

- [x] 1.1 Add a platform-independent user Tool env root helper that resolves `~/.tmlus/env` from the current user's home directory.
- [x] 1.2 Add tests for env root resolution without hard-coded Windows, macOS, or Linux user paths.
- [x] 1.3 Add safe directory creation for Tool env folders under the resolved env root.

## 2. SkillClaw Document Package

- [x] 2.1 Add GitHub-hosted SkillClaw document package files: `install-runbook.md`, `skillclaw-help.md`, `tml-team-config-guide.md`, and `manifest.json`.
- [x] 2.2 Ensure `install-runbook.md` is limited to Agent-guided SkillClaw installation and basic configuration.
- [x] 2.3 Write initial `skillclaw-help.md` explaining how users give prepared docs to an Agent for SkillClaw help.
- [x] 2.4 Implement required-file and manifest validation for prepared Tool document packages.

## 3. Document Retrieval

- [x] 3.1 Add a Tool document package source model with remote GitHub/static source metadata.
- [x] 3.2 Implement remote document package retrieval for SkillClaw with validation before writing to env.
- [x] 3.3 Fail SkillClaw document preparation when remote retrieval fails or returns incomplete docs.
- [x] 3.4 Report whether remote docs or existing local docs were used.

## 4. Tool Integration

- [x] 4.1 Extend Tool catalog metadata to represent document-preparation Tools that require env state.
- [x] 4.2 Add SkillClaw Tool catalog entry with aliases, purpose, recommendation level, env requirement, and document-preparation adapter.
- [x] 4.3 Add Tool install/prepare dispatch for the SkillClaw document-preparation adapter.
- [x] 4.4 Ensure document-preparation summaries do not claim SkillClaw itself was installed.

## 5. SkillClaw Menu Flow

- [x] 5.1 Detect missing, incomplete, and complete `~/.tmlus/env/skillclaw` states.
- [x] 5.2 Show the unprepared SkillClaw option that prepares installation materials instead of installing SkillClaw.
- [x] 5.3 Show prepared-state options to refresh docs, view `install-runbook.md`, and view `skillclaw-help.md`.
- [x] 5.4 Print next-step guidance that tells users to give `install-runbook.md` to an Agent for actual SkillClaw setup.

## 6. Output and Help

- [x] 6.1 Add CLI rendering for prepared, refreshed, existing, skipped, and failed document package states.
- [x] 6.2 Ensure quiet, non-TTY, CI, and no-color outputs remain readable and actionable.
- [x] 6.3 Update dynamic help metadata to distinguish direct-install Tools from Agent-guided document-preparation Tools.
- [x] 6.4 Update command wiki and README tool descriptions for SkillClaw document preparation.

## 7. Validation

- [x] 7.1 Add unit tests for manifest validation and incomplete env detection.
- [x] 7.2 Add unit tests for remote failure without bundled fallback.
- [x] 7.3 Add command checks or fixtures covering SkillClaw Tool catalog metadata.
- [x] 7.4 Run the relevant test/build/check commands and document any unrelated failures.
