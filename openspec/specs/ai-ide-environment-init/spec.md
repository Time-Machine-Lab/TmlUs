## Purpose

Specify how TmlUs discovers, initializes, and reports supported AI IDE environment folders in a local project.

## Requirements

### Requirement: AI IDE environment catalog

TmlUs SHALL maintain a structured catalog of supported AI IDE environments.

Each environment entry MUST include a stable ID, display name, aliases, project marker directory, required initialization directories, and supported resource target types such as skills, commands, prompts, or rules.

#### Scenario: Supported IDEs are catalog-driven

- **WHEN** the `tmlus ide` command needs to render choices
- **THEN** it reads supported AI IDE environments from the environment catalog

#### Scenario: New IDE can be added through catalog

- **WHEN** a developer adds a new environment entry with required metadata
- **THEN** the `tmlus ide` selection list can include it without rewriting the initialization flow

### Requirement: AI IDE detection

TmlUs SHALL detect which supported AI IDE environments already exist in the current project root.

The detection MUST distinguish between missing environments, existing complete environments, and existing incomplete environments.

#### Scenario: Existing IDE is marked

- **WHEN** the current project contains a supported AI IDE marker directory
- **THEN** `tmlus ide` marks that environment as already existing in the selection list

#### Scenario: Incomplete IDE is marked

- **WHEN** the current project contains an AI IDE marker directory but lacks required subdirectories
- **THEN** `tmlus ide` marks that environment as incomplete and offers initialization of missing required directories

### Requirement: Interactive IDE initialization

TmlUs SHALL support interactive AI IDE environment initialization through `tmlus ide`.

The command MUST show a selection list of supported AI IDE environments, including status markers for existing or incomplete environments, and MUST create only the required directories for selected environments.

#### Scenario: User initializes IDE interactively

- **WHEN** the user runs `tmlus ide` and selects one or more AI IDE environments
- **THEN** TmlUs creates missing required directories for the selected environments
- **AND** it reports created, existing, skipped, or failed items

#### Scenario: Initialization is idempotent

- **WHEN** the user runs `tmlus ide` for an environment whose required directories already exist
- **THEN** TmlUs does not duplicate files or directories and reports that the environment is already initialized

### Requirement: Direct IDE initialization arguments

TmlUs SHALL support direct IDE-name arguments for `tmlus ide`.

When one or more IDE names or aliases are provided, the command MUST skip the selection prompt and initialize the requested environments directly.

#### Scenario: Direct single IDE initialization

- **WHEN** the user runs `tmlus ide codex`
- **THEN** TmlUs initializes the Codex environment without prompting for IDE selection

#### Scenario: Unknown IDE argument

- **WHEN** the user runs `tmlus ide unknown-ide`
- **THEN** TmlUs reports the unknown IDE name and lists supported IDs or aliases

### Requirement: Minimal required IDE folder structures

TmlUs SHALL create only necessary folder structures for each AI IDE environment.

The initial required structures MUST include:

- Codex: `.codex/skills/` and `.codex/prompts/`
- Claude Code: `.claude/skills/` and `.claude/commands/`
- Cursor: `.cursor/rules/`, `.cursor/commands/`, and `.cursor/skills/`
- Trae: `.trae/rules/` and `.trae/skills/`
- CodeBuddy: `.codebuddy/rules/`, `.codebuddy/commands/`, and `.codebuddy/skills/`

#### Scenario: Codex minimal structure

- **WHEN** the user initializes Codex
- **THEN** TmlUs creates `.codex/skills/` and `.codex/prompts/` if missing
- **AND** it does not create unrelated Codex files

#### Scenario: Cursor minimal structure

- **WHEN** the user initializes Cursor
- **THEN** TmlUs creates `.cursor/rules/`, `.cursor/commands/`, and `.cursor/skills/` if missing
- **AND** it does not create unrelated Cursor files

### Requirement: IDE initialization UI follows design language

TmlUs IDE initialization output SHALL comply with `docs/spec/DESIGN.md`.

The command MUST use readable list/status output, MUST not rely only on color for status, and MUST suppress decorative output in CI, non-TTY, `--quiet`, and machine-readable modes.

#### Scenario: IDE list status is text-readable

- **WHEN** `tmlus ide` renders the IDE selection list
- **THEN** each environment status is understandable from text even without color

#### Scenario: CI output is clean

- **WHEN** `tmlus ide` runs in CI or non-TTY output
- **THEN** decorative banners or animations are suppressed
