## Purpose

Specify SkillClaw as a Tool catalog entry whose TmlUs flow prepares Agent-readable setup and usage documents without installing or operating SkillClaw directly.

## Requirements

### Requirement: SkillClaw Tool catalog entry

TmlUs SHALL include SkillClaw as a supported Tool in the Tool catalog.

The SkillClaw Tool entry MUST identify SkillClaw as a document-preparation Tool that requires a user-level env folder. The entry MUST make clear that TmlUs prepares SkillClaw guidance documents rather than installing or configuring SkillClaw itself.

#### Scenario: SkillClaw appears in tools

- **WHEN** the user runs `tmlus tools`
- **THEN** SkillClaw appears as a supported Tool
- **AND** its purpose communicates that it prepares Agent-readable SkillClaw setup and usage documents

#### Scenario: SkillClaw is not a Skill

- **WHEN** the user runs `tmlus skills`
- **THEN** SkillClaw does not appear as an installable AI Skill

### Requirement: SkillClaw env preparation

TmlUs SHALL prepare `~/.tmlus/env/skillclaw` when the user selects SkillClaw and the SkillClaw env is missing or incomplete.

The preparation flow MUST create the folder, obtain the SkillClaw document package, write all required documents, validate the manifest, and tell the user what to do next.

#### Scenario: Missing SkillClaw env is prepared

- **WHEN** the user selects SkillClaw from `tmlus tools`
- **AND** `~/.tmlus/env/skillclaw` does not exist
- **THEN** TmlUs creates `~/.tmlus/env/skillclaw`
- **AND** TmlUs writes the SkillClaw document package into that folder

#### Scenario: Incomplete SkillClaw env is refreshed

- **WHEN** the user selects SkillClaw from `tmlus tools`
- **AND** `~/.tmlus/env/skillclaw` exists but required package files are missing
- **THEN** TmlUs treats the env as incomplete
- **AND** TmlUs offers or performs document package retrieval to complete it

### Requirement: SkillClaw document package contents

The SkillClaw document package prepared by TmlUs SHALL include install and help documents.

The package MUST include `install-runbook.md`, `skillclaw-help.md`, and `manifest.json`. `install-runbook.md` MUST be limited to Agent-facing SkillClaw installation and basic configuration guidance. `skillclaw-help.md` MUST explain how a user can give the prepared documents to an Agent for SkillClaw-related help, without requiring TmlUs to execute SkillClaw operations.

#### Scenario: Required SkillClaw docs exist

- **WHEN** SkillClaw env preparation completes
- **THEN** `~/.tmlus/env/skillclaw/install-runbook.md` exists
- **AND** `~/.tmlus/env/skillclaw/skillclaw-help.md` exists
- **AND** `~/.tmlus/env/skillclaw/manifest.json` exists

#### Scenario: Install runbook is installation-only

- **WHEN** a user opens `install-runbook.md`
- **THEN** the document focuses on Agent-guided SkillClaw installation, prerequisite checks, basic configuration, and verification
- **AND** it does not define TmlUs product behavior for doctor, pull, validate, or evolve

### Requirement: SkillClaw prepared-state menu

TmlUs SHALL show different SkillClaw options depending on whether the SkillClaw env is prepared.

When the env is missing or incomplete, the primary option MUST be preparing the SkillClaw installation materials. When the env is complete, the options MUST include refreshing the document package and viewing the prepared help or installation documents.

#### Scenario: SkillClaw env is not prepared

- **WHEN** the user selects SkillClaw
- **AND** the SkillClaw env is missing or incomplete
- **THEN** TmlUs presents an option equivalent to `安装 SkillClaw`
- **AND** the option prepares SkillClaw installation materials rather than installing SkillClaw

#### Scenario: SkillClaw env is prepared

- **WHEN** the user selects SkillClaw
- **AND** the SkillClaw env is complete
- **THEN** TmlUs presents options to refresh the document package
- **AND** TmlUs presents options to view SkillClaw help and installation instructions

### Requirement: SkillClaw next-step guidance

TmlUs SHALL clearly tell users that SkillClaw has not been installed by TmlUs after document preparation.

After preparing the SkillClaw env, TmlUs MUST display the path to `install-runbook.md` and instruct the user to give that document to an Agent to perform the actual SkillClaw installation and configuration.

#### Scenario: Preparation completion explains next step

- **WHEN** SkillClaw document preparation completes
- **THEN** TmlUs tells the user that installation materials are ready
- **AND** TmlUs shows the path to `install-runbook.md`
- **AND** TmlUs explains that an Agent should use the runbook for actual SkillClaw installation

### Requirement: TmlUs does not execute SkillClaw operations

TmlUs SHALL NOT execute SkillClaw installation, configuration, proxy management, Evolve Server deployment, or SkillClaw operational commands as part of this Tool env change.

The SkillClaw Tool env flow MUST NOT clone the SkillClaw repository, install Python dependencies, modify AI IDE configuration, start client proxy, deploy Evolve Server, or run doctor, pull, validate, or evolve actions.

#### Scenario: SkillClaw preparation does not install SkillClaw

- **WHEN** the user selects the SkillClaw preparation option
- **THEN** TmlUs prepares documents under `~/.tmlus/env/skillclaw`
- **AND** TmlUs does not clone or install SkillClaw itself

#### Scenario: SkillClaw preparation does not change AI IDE config

- **WHEN** SkillClaw document preparation completes
- **THEN** TmlUs has not modified Codex, Claude, Cursor, or other AI IDE configuration files
