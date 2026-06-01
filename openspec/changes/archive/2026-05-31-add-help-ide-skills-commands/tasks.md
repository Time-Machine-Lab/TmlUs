## 1. Command Registry and Help

- [x] 1.1 Add command metadata types for command names, aliases, bilingual labels, descriptions, examples, and parameter notes.
- [x] 1.2 Create a command registry containing existing `help`, `version`, `--no-banner`, `--quiet`, plus new `ide` and `skills` command entries.
- [x] 1.3 Refactor `tmlus help` to render from the command registry instead of static help text.
- [x] 1.4 Add language selection support for Chinese default output and English output through a supported option or environment setting.
- [x] 1.5 Ensure help output follows `docs/spec/DESIGN.md` and stays clean in no-color, CI, non-TTY, quiet, and machine-readable modes.

## 2. Workspace and Catalog Foundations

- [x] 2.1 Add core types for AI IDE environments, environment status, skill catalog entries, install targets, write plans, and install results.
- [x] 2.2 Add workspace helpers for idempotent directory creation, existence checks, conflict-safe writes, and project-root-relative paths.
- [x] 2.3 Add an AI IDE environment catalog with Codex, Claude Code, Cursor, Trae, and CodeBuddy required folder structures.
- [x] 2.4 Add a maintained Skill catalog with initial TmlUs skills, including name, source, category, function, and supported AI IDE targets.

## 3. AI IDE Environment Initialization

- [x] 3.1 Implement AI IDE detection that marks environments as missing, existing complete, or existing incomplete.
- [x] 3.2 Implement interactive `tmlus ide` selection that displays supported IDEs with text-readable status markers.
- [x] 3.3 Implement direct `tmlus ide <ideNames>` argument handling to skip selection and initialize requested IDEs.
- [x] 3.4 Initialize only missing required folders for selected IDE environments and report created, existing, skipped, and failed items.
- [x] 3.5 Handle unknown IDE arguments with a clear error and supported ID/alias list.

## 4. Skill Discovery and Installation

- [x] 4.1 Implement paged interactive Skill listing with name, source, category, and function.
- [x] 4.2 Implement multi-select Skill selection and direct `tmlus skills <skillIds>` argument handling.
- [x] 4.3 Implement target AI IDE selection that prioritizes existing environments, supports missing supported environments, supports multi-select, and supports installing to all existing IDEs when skipped.
- [x] 4.4 Implement direct `tmlus skills <skillIds> --ide <ideNames>` handling to skip both selection prompts.
- [x] 4.5 Implement bounded concurrent remote Skill downloads with progress output in interactive TTY mode.
- [x] 4.6 Install skills according to each environment's supported target strategy and skip unsupported Skill/environment combinations with a clear message.
- [x] 4.7 Output a final Skill installation summary including successful, skipped, and failed installs.

## 5. CLI UI and Design Compliance

- [x] 5.1 Add reusable UI helpers for command sections, selectable lists, paged lists, status labels, progress, and summaries.
- [x] 5.2 Ensure `ide` and `skills` output remains readable without color and does not rely on color-only status.
- [x] 5.3 Suppress decorative output for CI, non-TTY, `--quiet`, `--no-banner`, and machine-readable output modes.
- [x] 5.4 Ensure progress output uses explicit status text and follows the progress guidance in `docs/spec/DESIGN.md`.

## 6. Verification

- [x] 6.1 Add tests or verification scripts for dynamic help rendering and command registry inclusion.
- [x] 6.2 Add tests or verification scripts for AI IDE detection and idempotent initialization.
- [x] 6.3 Add tests or verification scripts for Skill catalog listing, direct Skill install arguments, target IDE resolution, and unsupported target skipping.
- [x] 6.4 Run `npm run build` in `tmlus-core`.
- [x] 6.5 Run or add CLI smoke checks for `tmlus help`, `tmlus ide codex`, and representative `tmlus skills` flows.
- [x] 6.6 Run `openspec validate add-help-ide-skills-commands`.
