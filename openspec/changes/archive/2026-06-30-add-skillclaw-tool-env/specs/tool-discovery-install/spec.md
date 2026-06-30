## ADDED Requirements

### Requirement: Document-preparation Tool strategy

TmlUs SHALL support Tool catalog entries whose selected action prepares maintained documentation instead of directly installing an external CLI.

A document-preparation Tool MUST still appear in `tmlus tools`, support direct selection by Tool ID or alias, participate in the same result summary conventions, and clearly describe that the Tool action prepares guidance materials rather than installing the external tool.

#### Scenario: Document-preparation Tool can be selected directly

- **WHEN** the user runs `tmlus tools skillclaw`
- **THEN** TmlUs skips the generic Tool selector
- **AND** TmlUs starts the SkillClaw document-preparation Tool flow

#### Scenario: Tool summary names document preparation

- **WHEN** a document-preparation Tool flow completes
- **THEN** TmlUs summarizes document preparation actions and statuses
- **AND** TmlUs does not claim the external tool itself was installed

### Requirement: Tool env-aware selection

TmlUs SHALL allow a Tool flow to inspect user-level env state before deciding which Tool-specific options to show.

When a selected Tool requires env state, TmlUs MUST create or inspect the relevant Tool env folder through platform-independent path resolution before rendering Tool-specific options.

#### Scenario: Env-aware Tool inspects env state

- **WHEN** the user selects a Tool that requires env state
- **THEN** TmlUs resolves that Tool's env folder under `~/.tmlus/env`
- **AND** TmlUs uses the env state to decide which options to show
