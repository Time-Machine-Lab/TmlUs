## Context

`tmlus-core` currently exposes a preview CLI with static help text and banner/version handling. It does not yet have a command registry, AI IDE environment initialization, or Skill catalog installation flow.

The relevant project constraints are:

- TmlUs is a local-first AI Helper / AI Tools toolbox, not a hosted platform.
- Codex, Claude, Cursor, Trae, CodeBuddy, Gemini, and OpenCode are user AI IDE environments.
- Skill and command installation changes user project files, so all write plans must be conservative and repeatable.
- CLI output must follow `docs/spec/DESIGN.md`: readable first, decorative output suppressible, CI/non-TTY/machine-readable output clean.

## Goals / Non-Goals

**Goals:**

- Replace static help text with a command metadata registry rendered by `tmlus help`.
- Add `tmlus ide` to detect supported AI IDE environments and initialize only necessary folder structures.
- Add `tmlus skills` to list maintained skills, allow selection, and install selected skills into selected or existing AI IDE environments.
- Keep IDE and Skill definitions catalog-driven so new commands, IDEs, and skills can be added without changing core help or installer logic.
- Provide progress and list UI that respects `docs/spec/DESIGN.md`.

**Non-Goals:**

- Do not implement online Skill search, recommendation, ranking, or marketplace behavior.
- Do not build platform services, accounts, databases, APIs, remote dashboards, or hosted sync.
- Do not create unnecessary folders beyond each AI IDE environment's required Skill/Command/Prompt/Rule targets.
- Do not force a native Skill install into an IDE that lacks a supported Skill target; use the catalog's per-environment install strategy.

## Decisions

### Decision: Use a command metadata registry for help

Introduce a registry structure that stores each command's name, aliases, Chinese/English name, description, examples, parameter notes, and handler metadata. `tmlus help` renders from the registry instead of hardcoded help lines.

This makes help dynamic: adding a new command requires registering metadata and handler wiring, not editing help rendering code.

Alternative considered: keep static help text. Rejected because it would drift as commands grow.

### Decision: Keep `ide` and `skills` as top-level commands

The requested user-facing commands are `tmlus ide` and `tmlus skills`. The command registry should support these subcommands directly. Internally, handlers may map to use cases such as `runIdeInit()` and `runSkillInstall()`.

Future aliases can be added later, but the initial change must satisfy the requested command bodies.

### Decision: Model AI IDE environments as catalog entries plus adapters

Each AI IDE environment should have catalog metadata:

- stable ID and display aliases
- display name
- project root marker directory
- required target directories
- supported resource targets such as skills, commands, prompts, or rules
- status detection logic

The initial supported environments should include:

| ID | Display | Required folders for this change |
|---|---|---|
| `codex` | Codex | `.codex/skills/`, `.codex/prompts/` |
| `claude` | Claude Code | `.claude/skills/`, `.claude/commands/` |
| `cursor` | Cursor | `.cursor/rules/`, `.cursor/commands/` |
| `trae` | Trae | `.trae/rules/`, `.trae/skills/` |
| `codebuddy` | CodeBuddy | `.codebuddy/rules/`, `.codebuddy/commands/`, `.codebuddy/skills/` |

Gemini and OpenCode may remain listed only if their required folder targets are already known in the catalog. If not, they should be deferred rather than guessed.

### Decision: Detect IDE status before rendering choices

`tmlus ide` and `tmlus skills` target selection should scan the project root before rendering choices. The UI should mark each environment as:

- not initialized
- existing complete
- existing incomplete

This supports the user's requirement that existing AI IDE directories are marked in the selection list.

### Decision: Use a maintained local Skill catalog

Skill listing and installation should read from a maintained TmlUs Skill catalog rather than hardcoded installer logic. Each Skill entry should include:

- ID
- name
- source
- category
- description/function
- supported environment targets
- install strategy per target when needed

The first implementation can use TypeScript catalog data. A later change may move it to JSON/YAML without changing the use case boundary.

### Decision: Install via per-environment target strategy

Not every IDE has the same resource model. The installer should ask the environment adapter where a Skill can be installed. If an environment lacks a supported Skill target for a selected Skill, the installer must skip that target with a clear message instead of creating arbitrary directories.

### Decision: Keep downloads concurrent but bounded

Skill downloads should support concurrency, but concurrency must be bounded to avoid noisy output and unnecessary network pressure. Progress output should show current item, completed count, and final summary. It must degrade cleanly for non-TTY, CI, `--quiet`, and machine-readable modes.

### Decision: Use workspace writer for all file system writes

Environment initialization and Skill installation must create directories and files through a workspace writing layer. The implementation must be idempotent and must not silently overwrite user files.

## Risks / Trade-offs

- [Risk] AI IDE folder structures may change or be undocumented.
  → Mitigation: Keep folder definitions in catalog entries and avoid creating unknown folders. Defer uncertain environments rather than guessing.

- [Risk] Skill install semantics differ between IDEs.
  → Mitigation: Use per-environment install strategies and skip unsupported combinations with a clear message.

- [Risk] Dynamic help becomes inconsistent with actual handlers.
  → Mitigation: Use one registry as the source for both help rendering and dispatch wiring.

- [Risk] Interactive UI breaks CI or scripted usage.
  → Mitigation: Support direct parameters for `ide` and `skills`; suppress decorative UI in CI/non-TTY/quiet modes according to `docs/spec/DESIGN.md`.

- [Risk] Network downloads fail midway.
  → Mitigation: Report per-skill/per-environment success and failure; keep completed installs; do not claim total success unless all selected installs succeed.

## Migration Plan

1. Introduce core types for commands, IDE environments, skills, write plans, and install results.
2. Add a command registry and render `tmlus help` from registry metadata.
3. Add AI IDE environment catalog and detection/initialization use case.
4. Add Skill catalog, paged listing, multi-select flow, target IDE selection, bounded concurrent download, and install summary.
5. Route all new writes through workspace helper functions.
6. Add build-time verification and command-level tests for help, IDE detection/init, Skill catalog listing, non-interactive install arguments, and UI degradation.

## Open Questions

- Should Gemini and OpenCode be included in the first `ide` list only after their project-local resource folder conventions are confirmed?
- Should `tmlus skills` default to all existing AI IDE directories when no IDE is passed even in non-interactive mode, or should it require explicit confirmation when multiple targets exist?
