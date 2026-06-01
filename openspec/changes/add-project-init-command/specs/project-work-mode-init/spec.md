## ADDED Requirements

### Requirement: Project work-mode command
TmlUs SHALL provide `tmlus work-mode` as a standalone command for initializing the selected project's working mode.

The initial supported work-mode choices MUST be `openspec` and `skip`.

#### Scenario: User selects work mode interactively
- **WHEN** the user runs `tmlus work-mode` in an interactive terminal
- **THEN** TmlUs presents `openspec` and `skip` as available work-mode choices

#### Scenario: User passes work mode directly
- **WHEN** the user runs `tmlus work-mode openspec`
- **THEN** TmlUs initializes the `openspec` work mode without prompting for work-mode selection

#### Scenario: Unknown work mode
- **WHEN** the user runs `tmlus work-mode unknown-mode`
- **THEN** TmlUs reports the unknown work mode
- **AND** it lists the supported work modes

### Requirement: OpenSpec work mode initializes current project
TmlUs SHALL initialize OpenSpec only for the selected project root when the work mode is `openspec`.

The command MUST NOT install OpenSpec globally, modify user-level OpenSpec settings, or write outside the selected project root.

#### Scenario: OpenSpec mode initializes project
- **WHEN** the user selects `openspec` during `tmlus init`
- **THEN** TmlUs initializes OpenSpec in the project root selected earlier in the init workflow

#### Scenario: OpenSpec mode does not change user configuration
- **WHEN** the user runs `tmlus work-mode openspec`
- **THEN** TmlUs does not modify user-level OpenSpec configuration
- **AND** it does not perform a global OpenSpec installation

### Requirement: OpenSpec work mode is idempotent
TmlUs SHALL make OpenSpec work-mode initialization safe to run repeatedly for the same project.

If project-level OpenSpec structure already exists, TmlUs MUST report it as existing or already initialized instead of duplicating content.

#### Scenario: Existing OpenSpec project
- **WHEN** the selected project already contains an initialized `openspec` structure
- **THEN** `tmlus work-mode openspec` reports that OpenSpec is already initialized or repairs missing project-level pieces
- **AND** it does not duplicate existing OpenSpec artifacts

### Requirement: Skip work mode
TmlUs SHALL support `skip` as a work-mode selection that performs no project work-mode initialization.

#### Scenario: User skips work mode
- **WHEN** the user selects `skip` during `tmlus init`
- **THEN** TmlUs does not initialize OpenSpec
- **AND** the init workflow proceeds to its final summary

### Requirement: Work-mode failure reporting
TmlUs SHALL report work-mode initialization failures without claiming full success.

If the OpenSpec CLI is unavailable or project initialization fails, TmlUs MUST explain the failure and preserve any earlier successful init steps.

#### Scenario: OpenSpec command unavailable
- **WHEN** the user selects `openspec`
- **AND** TmlUs cannot run the required OpenSpec project initialization command
- **THEN** TmlUs reports that OpenSpec project initialization failed
- **AND** it provides a next-step suggestion

### Requirement: Work-mode output follows CLI design language
TmlUs work-mode output SHALL comply with `docs/spec/DESIGN.md`.

The output MUST be readable without color and MUST suppress decorative output in CI, non-TTY, `--quiet`, and machine-oriented modes.

#### Scenario: Work mode runs without color
- **WHEN** `tmlus work-mode openspec` runs in a no-color terminal
- **THEN** status and failure information remains understandable without color
