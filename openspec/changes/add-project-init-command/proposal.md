## Why

TmlUs needs a single project initialization entry point so a new or existing project can quickly receive the team's AI IDE folders, TML Docs structure, starter skills, and optional OpenSpec working mode without manual sequencing. The current `--ide` and `--skills` commands provide useful pieces, but project setup still requires users to remember the correct order and repeat choices such as the target AI IDE.

## What Changes

- Add `tmlus init` as an interactive project initialization workflow with startup banner, working-directory selection, AI IDE initialization, TML Docs structure initialization, Skill installation, and work-mode selection.
- Add `tmlus init --from <step>` so users can resume from a named step and continue through all later steps.
- Add `tmlus --tml-spec` as an idempotent standalone command for creating and repairing the standard TML Docs folder structure under the selected project root.
- Add `tmlus --work-mode` as an idempotent standalone command for choosing project-level working mode, initially supporting `openspec` and `skip`.
- Reuse existing AI IDE and Skill installation behavior while allowing `init` to pass the previously selected AI IDE targets into the Skill step without asking again.
- Update help metadata so the new initialization commands appear in dynamic bilingual help output.
- Non-goals: no hosted platform, account system, remote dashboard, database, server API, or replacement for OpenSpec itself.

## Capabilities

### New Capabilities
- `project-initialization-command`: Covers the `tmlus init` workflow, step ordering, working directory selection, AI IDE reuse, default Skill behavior, and `--from` resume semantics.
- `tml-docs-structure-init`: Covers `tmlus --tml-spec`, standard `/docs` subdirectories, `.gitkeep` preservation, idempotency, and folder completeness repair.
- `project-work-mode-init`: Covers `tmlus --work-mode`, current-project work-mode selection, OpenSpec project initialization, skip behavior, and idempotency.

### Modified Capabilities
- `dynamic-help-command`: Help output must include `tmlus init`, `--tml-spec`, and `--work-mode` with bilingual descriptions and examples.

## Impact

- Affected code: `tmlus-core/src/cli/index.ts`, `tmlus-core/src/cli/command-registry.ts`, `tmlus-core/src/app/*`, `tmlus-core/src/ui/*`, `tmlus-core/src/workspace/*`, and command verification scripts.
- Affected specs: new project initialization, TML Docs structure, and work-mode capabilities; dynamic help requirements.
- Dependencies: OpenSpec CLI is treated as a project-level external tool for the `openspec` work mode. No global OpenSpec installation or user-level configuration is introduced.
- User-facing behavior: `tmlus init` becomes the recommended guided setup path while `--ide`, `--skills`, `--tml-spec`, and `--work-mode` remain independently runnable building blocks.
