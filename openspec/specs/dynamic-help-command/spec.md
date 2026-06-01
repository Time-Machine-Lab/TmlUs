## Purpose

Specify dynamic, bilingual, design-compliant help output for TmlUs CLI commands.

## Requirements

### Requirement: Dynamic help command registry

TmlUs SHALL render `tmlus help` from a command metadata registry rather than hardcoded help text.

The registry MUST include each command's name, aliases when available, Chinese and English display names, Chinese and English descriptions, usage examples, and parameter notes when relevant.

#### Scenario: Help lists registered commands

- **WHEN** the user runs `tmlus help`
- **THEN** the CLI lists all commands registered in the command metadata registry

#### Scenario: New command appears without editing help renderer

- **WHEN** a developer adds a new command with metadata to the command registry
- **THEN** `tmlus help` includes that command without requiring changes to the help rendering function

### Requirement: Bilingual help output

TmlUs help output SHALL support Chinese and English command descriptions.

The default help output MUST include Chinese-friendly descriptions for team usage and MUST allow English descriptions to be selected through a supported language option or environment setting.

#### Scenario: Default help is Chinese-friendly

- **WHEN** the user runs `tmlus help` without selecting a language
- **THEN** the output includes Chinese command names or descriptions

#### Scenario: English help is available

- **WHEN** the user requests English help through the supported language option or environment setting
- **THEN** the output uses English command names or descriptions from the command registry

### Requirement: Help output follows CLI design language

TmlUs help output SHALL comply with `docs/spec/DESIGN.md`.

Help output MUST remain readable without color, MUST avoid decorative animation, and MUST remain clean in CI, non-TTY, `--quiet`, and machine-readable output modes.

#### Scenario: Help is readable in plain output

- **WHEN** the user runs `tmlus help` in a no-color or non-TTY environment
- **THEN** the help text remains readable and contains no broken ANSI escape output

#### Scenario: Help avoids startup animation

- **WHEN** the user runs `tmlus help`
- **THEN** the command does not require a startup animation to understand available commands

### Requirement: Help includes requested command families

TmlUs help output SHALL include the `ide` and `skills` command families.

The help entry for `ide` MUST explain optional direct IDE-name arguments. The help entry for `skills` MUST explain optional Skill IDs and target IDE arguments.

#### Scenario: Help describes IDE initialization

- **WHEN** the user reads `tmlus help`
- **THEN** they can see that `tmlus ide` initializes AI IDE environments and can accept IDE names

#### Scenario: Help describes Skill installation

- **WHEN** the user reads `tmlus help`
- **THEN** they can see that `tmlus skills` lists or installs maintained skills and can target AI IDE environments
