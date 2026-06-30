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

TmlUs help output SHALL include the `init`, `ide`, `skills`, `tools`, `tml-spec`, `work-mode`, and `update` command families.

The help entry for `init` MUST explain guided project initialization and `--from <step>` resume usage. The help entry for `ide` MUST explain optional direct IDE-name arguments. The help entry for `skills` MUST explain optional Skill IDs and target IDE arguments. The help entry for `tools` MUST explain optional direct Tool IDs and MUST include CodeGraph as an example Tool. The help entry for `tml-spec` MUST explain TML Docs structure initialization. The help entry for `work-mode` MUST explain supported project work modes. The help entry for `update` MUST explain that it checks the installed TmlUs CLI version against the latest npm release and updates when a newer version is available.

#### Scenario: Help describes project initialization

- **WHEN** the user reads `tmlus help`
- **THEN** they can see that `tmlus init` guides project initialization
- **AND** they can see that `tmlus init --from <step>` resumes from a named step

#### Scenario: Help describes IDE initialization

- **WHEN** the user reads `tmlus help`
- **THEN** they can see that `tmlus ide` initializes AI IDE environments and can accept IDE names

#### Scenario: Help describes Skill installation

- **WHEN** the user reads `tmlus help`
- **THEN** they can see that `tmlus skills` lists or installs maintained skills and can target AI IDE environments

#### Scenario: Help describes Tool installation

- **WHEN** the user reads `tmlus help`
- **THEN** they can see that `tmlus tools` lists or installs maintained external tools and can accept a Tool ID such as `codegraph`

#### Scenario: Help describes TML Docs structure initialization

- **WHEN** the user reads `tmlus help`
- **THEN** they can see that `tmlus tml-spec` initializes the standard TML Docs folder structure

#### Scenario: Help describes work-mode initialization

- **WHEN** the user reads `tmlus help`
- **THEN** they can see that `tmlus work-mode` initializes project work mode and supports `openspec` or `skip`

#### Scenario: Help describes CLI update

- **WHEN** the user reads `tmlus help`
- **THEN** they can see that `tmlus update` checks for and installs a newer TmlUs CLI release when available

#### Scenario: English help describes CLI update

- **WHEN** the user reads English help output
- **THEN** the update entry uses English command metadata from the command registry

### Requirement: Help describes cache refresh

TmlUs help output SHALL include the `refresh` command family.

The help entry for `refresh` MUST explain that it clears TmlUs-managed cache files and MUST distinguish this behavior from `tmlus update`, which checks and updates the installed CLI package. The English help output MUST include English command metadata for `refresh`.

#### Scenario: Help describes refresh command

- **WHEN** the user reads `tmlus help`
- **THEN** they can see that `tmlus refresh` clears TmlUs-managed cache files
- **THEN** they can distinguish cache refresh from CLI package update

#### Scenario: English help describes refresh command

- **WHEN** the user reads English help output
- **THEN** the refresh entry uses English command metadata from the command registry

#### Scenario: Refresh appears in command examples

- **WHEN** the user reads `tmlus help`
- **THEN** the examples include at least one `tmlus refresh` usage

### Requirement: Help describes document-preparation Tools

TmlUs help output SHALL explain that some `tools` entries prepare Agent-readable guidance documents instead of installing the external tool directly.

The help text MUST keep CodeGraph-style direct installation/adaptation Tools distinct from SkillClaw-style document-preparation Tools.

#### Scenario: Help distinguishes Tool strategies

- **WHEN** the user reads `tmlus help`
- **THEN** the `tools` help explains that some Tools are installed or adapted directly
- **AND** it explains that some Tools prepare guidance documents for Agent-assisted setup

#### Scenario: Help can mention SkillClaw

- **WHEN** the user reads `tmlus help`
- **THEN** the help may include SkillClaw as an example of an Agent-guided Tool preparation flow
