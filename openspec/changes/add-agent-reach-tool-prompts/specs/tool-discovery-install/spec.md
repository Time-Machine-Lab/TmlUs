## ADDED Requirements

### Requirement: Prompt-only Tool strategy

TmlUs SHALL support Tool catalog entries whose selected action renders a maintained prompt instead of installing an external CLI or preparing local documentation.

A prompt-only Tool MUST appear in `tmlus tools`, support direct selection by Tool ID or alias, and render copy-focused output that clearly states no external installation or configuration was performed by TmlUs.

#### Scenario: Prompt-only Tool can be selected directly

- **WHEN** the user runs `tmlus tools agent-reach install`
- **THEN** TmlUs skips the generic Tool selector
- **AND** TmlUs renders the Agent Reach install prompt
- **AND** TmlUs does not install Agent Reach or create a Tool env folder

#### Scenario: Prompt-only Tool does not claim installation

- **WHEN** a prompt-only Tool action renders output
- **THEN** TmlUs presents the output as a prompt for the user to copy to an Agent
- **AND** TmlUs does not summarize the external tool as installed, configured, or updated

### Requirement: Agent Reach prompt actions

TmlUs SHALL expose Agent Reach as a maintained prompt-only Tool with install and update actions.

The install action MUST render exactly this prompt text:

```text
帮我安装 Agent Reach：https://raw.githubusercontent.com/Panniantong/agent-reach/main/docs/install.md
```

The update action MUST render exactly this prompt text:

```text
帮我更新 Agent Reach：https://raw.githubusercontent.com/Panniantong/agent-reach/main/docs/update.md
```

#### Scenario: Interactive Agent Reach action selection

- **WHEN** the user selects Agent Reach from `tmlus tools` in an interactive terminal
- **THEN** TmlUs shows install and update action choices for Agent Reach
- **AND** selecting an action renders the corresponding copy prompt

#### Scenario: Direct Agent Reach install prompt

- **WHEN** the user runs `tmlus tools agent-reach install`
- **THEN** TmlUs renders the Agent Reach install prompt

#### Scenario: Direct Agent Reach update prompt

- **WHEN** the user runs `tmlus tools agent-reach update`
- **THEN** TmlUs renders the Agent Reach update prompt

#### Scenario: Unsupported Agent Reach action

- **WHEN** the user runs `tmlus tools agent-reach not-real`
- **THEN** TmlUs exits with an error that names the unsupported Agent Reach action
- **AND** the error lists supported actions `install` and `update`
