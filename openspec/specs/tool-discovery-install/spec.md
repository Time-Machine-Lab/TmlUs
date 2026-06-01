## Purpose

Specify TmlUs external Tool discovery, selection, installation, and reporting.

## Requirements

### Requirement: Tool catalog

TmlUs SHALL maintain a structured catalog of supported external tools.

Each Tool entry MUST include a stable ID, display name, purpose, recommendation level, supported aliases when relevant, installation strategy, and adapter identifier.

#### Scenario: Tool list uses catalog metadata

- **WHEN** the `tmlus tools` command renders available tools
- **THEN** it reads tool names, purposes, recommendation levels, and adapter identifiers from the Tool catalog

#### Scenario: New tool can be added through catalog

- **WHEN** a developer adds a new Tool definition with a supported adapter
- **THEN** `tmlus tools` can display the Tool without hard-coding it in the CLI renderer

### Requirement: Interactive tool selection

TmlUs SHALL support interactive Tool discovery through `tmlus tools`.

The command MUST display a selectable table of recommended tools with Tool name, Tool purpose, and recommendation level. The selection UI MUST allow the user to choose one Tool and confirm with Enter. Escape or cancellation MUST stop the command without running any Tool installation.

#### Scenario: User sees recommended tools

- **WHEN** the user runs `tmlus tools` in an interactive terminal
- **THEN** TmlUs displays a table containing Tool name, Tool purpose, and recommendation level

#### Scenario: User selects one tool

- **WHEN** the user selects a Tool and confirms
- **THEN** TmlUs starts the selected Tool's installation and adaptation flow

#### Scenario: User cancels selection

- **WHEN** the user cancels the Tool selector
- **THEN** TmlUs does not install or configure any Tool

### Requirement: Direct tool selection arguments

TmlUs SHALL support direct Tool selection arguments through `tmlus tools`.

When one Tool ID or alias is provided after `tools`, TmlUs MUST skip the interactive Tool selector and run that Tool's installation and adaptation flow directly. Unknown Tool IDs MUST fail with a message that lists supported Tool IDs.

#### Scenario: Direct CodeGraph selection

- **WHEN** the user runs `tmlus tools codegraph`
- **THEN** TmlUs skips the Tool selector and starts the CodeGraph Tool flow

#### Scenario: Unknown tool

- **WHEN** the user runs `tmlus tools not-real`
- **THEN** TmlUs exits with an error that names the unknown Tool and lists supported Tool IDs

### Requirement: Tool installation summary

TmlUs SHALL summarize Tool installation and adaptation results in a design-compliant CLI output.

The summary MUST distinguish installed, existing, initialized, configured, skipped, and failed actions. Quiet, CI, non-TTY, and no-color modes MUST remain readable and MUST avoid decorative progress noise.

#### Scenario: Summary shows results

- **WHEN** a Tool flow completes
- **THEN** TmlUs prints a concise summary of the Tool actions and their statuses

#### Scenario: Failed action affects exit code

- **WHEN** a required Tool action fails
- **THEN** TmlUs sets a non-zero exit code and includes an actionable next step

#### Scenario: Quiet output is compact

- **WHEN** the user runs `tmlus tools codegraph --quiet`
- **THEN** TmlUs prints only essential Tool results without decorative output
