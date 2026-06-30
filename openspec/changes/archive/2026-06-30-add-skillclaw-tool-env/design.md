## Context

TmlUs already has a `tools` command family and a Tool catalog for external tools such as CodeGraph. Those tools currently assume TmlUs can directly detect, install, configure, or initialize the selected tool.

SkillClaw has a different adoption shape. It requires environment-specific decisions about AI IDE configuration, original model upstreams, remote session storage, and optional Evolve Server integration. The team intentionally wants Agent-guided setup rather than hard-coded installation logic inside TmlUs. Therefore SkillClaw should enter TmlUs as a document-preparation Tool: TmlUs prepares a user-level env folder with maintained instructions, and the user gives those instructions to an Agent for actual installation and configuration.

This change must stay cross-platform. Paths such as `C:\Users\WIN11` are examples only; implementation must resolve the user home directory at runtime and derive `~/.tmlus/env` on Windows, macOS, and Linux.

## Goals / Non-Goals

**Goals:**

- Add a platform-independent user-level Tool env root at `~/.tmlus/env`.
- Add SkillClaw as a Tool whose TmlUs action is preparing a documentation package, not installing SkillClaw.
- Fetch maintained SkillClaw docs from GitHub into `~/.tmlus/env/skillclaw`.
- Use a manifest to determine whether the local SkillClaw docs are complete.
- Provide an interactive menu that differs between unprepared and prepared SkillClaw env states.
- Keep the Tool catalog and command output consistent with existing TmlUs architecture and CLI design.

**Non-Goals:**

- Do not install SkillClaw binaries or Python dependencies.
- Do not clone the SkillClaw repository as part of `tmlus tools skillclaw`.
- Do not modify Codex, Claude, Cursor, or other AI IDE configuration.
- Do not start or manage SkillClaw client proxy.
- Do not deploy or configure Evolve Server.
- Do not implement SkillClaw doctor, pull, validate, or evolve execution in TmlUs.
- Do not introduce a TmlUs hosted service, database, account system, or dashboard.

## Decisions

### 1. Store Tool env under the user home directory

TmlUs will resolve the env root as `path.join(os.homedir(), '.tmlus', 'env')`, with tests using injectable home/cache roots. This avoids hard-coded Windows paths and keeps Tool env state outside project workspaces and npm package installation directories.

Alternative considered: write docs under the current project or the installed npm package. Project-local docs would duplicate state across repositories, while package-local docs can be read-only and may be replaced during package updates.

### 2. Model SkillClaw as a documentation-preparation Tool

The Tool catalog entry will identify SkillClaw as a Tool but use a document/env strategy instead of the external CLI strategy used by CodeGraph. The Tool adapter prepares docs and reports what was prepared; it does not execute SkillClaw installation.

Alternative considered: extend the CodeGraph-style installer and run SkillClaw installation directly. This conflicts with the requirement that Agent should handle environment-specific installation and configuration.

### 3. Use GitHub as the only document package source

The document source is GitHub static files maintained by TmlUs. The CLI package must not include fallback copies of `install-runbook.md`, `skillclaw-help.md`, `tml-team-config-guide.md`, or `manifest.json`. Remote failure should fail the Tool preparation with an actionable message.

Alternative considered: include bundled fallback docs in the npm package. This was rejected to avoid duplicated document sources and stale packaged docs.

### 4. Use a manifest for local completeness checks

`~/.tmlus/env/skillclaw/manifest.json` will record package version, files, source, and updated time. TmlUs will treat SkillClaw env as prepared only when the folder and required files exist and the manifest is parseable.

Alternative considered: check only for the directory. That cannot distinguish an interrupted or partial document fetch from a completed preparation.

### 5. Keep future SkillClaw operations out of this change

`skillclaw-help.md` can describe the future Agent-assisted service surface, but TmlUs will only display the document. Execution of doctor/pull/validate/evolve remains outside this change.

Alternative considered: add placeholder CLI subcommands now. That risks implying behavior TmlUs does not yet own and expands the MVP beyond document preparation.

## Risks / Trade-offs

- Remote document source unavailable → Fail document preparation and report the GitHub source/error in the summary.
- User expects real installation → Output must clearly say TmlUs prepared the SkillClaw installation materials and the next step is to give `install-runbook.md` to an Agent.
- Partial env state after failed fetch → Manifest validation distinguishes complete and incomplete states; refresh can overwrite incomplete docs.
- Cross-platform path bugs → Centralize env root resolution and cover Windows/macOS/Linux path expectations in tests.
- Scope drift toward SkillClaw manager → Specs explicitly exclude install/config/start/doctor/pull/validate/evolve execution.

## Migration Plan

1. Add the shared user env root helper without changing existing Tool behavior.
2. Add GitHub-hosted SkillClaw docs and manifest.
3. Add SkillClaw Tool catalog metadata and document-preparation adapter.
4. Wire `tmlus tools skillclaw` direct and interactive selection to the new adapter/menu.
5. Update docs and command checks.

Rollback: remove the SkillClaw Tool catalog entry and adapter wiring. Existing CodeGraph Tool behavior and Skill installation behavior remain unchanged.

## Open Questions

- Where will the canonical remote TmlUs-maintained SkillClaw document package live in GitHub: this repository under `data/tools/skillclaw`, or a separate TML docs/tools repository?
- Should `tmlus tools` create `~/.tmlus/env` on every invocation or only when a selected Tool requires env state?
