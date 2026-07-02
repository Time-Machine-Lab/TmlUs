## Why

Agent Reach is a useful internet capability router for AI agents, but TmlUs currently has no maintained `tools` entry that helps a user hand the official install or update prompt to their agent. Adding a prompt-only Tool keeps TmlUs as the local CLI entry point while avoiding direct responsibility for Agent Reach installation, credentials, browser sessions, or channel configuration.

## What Changes

- Add Agent Reach to the maintained `tmlus tools` catalog.
- When users select Agent Reach interactively, show two actions:
  - Install Agent Reach
  - Update Agent Reach
- Render a SkillClaw-style "COPY THIS PROMPT" box for the selected action.
- Support direct non-interactive actions:
  - `tmlus tools agent-reach install`
  - `tmlus tools agent-reach update`
- Keep Agent Reach handling prompt-only: TmlUs will not install Agent Reach, download Agent Reach runbooks, configure channels, run `agent-reach`, or store credentials.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tool-discovery-install`: Add a prompt-only Agent Reach Tool flow with interactive install/update choices and direct install/update actions.

## Impact

- Affected code:
  - Tool catalog metadata
  - Tool selection/action UI
  - CLI `tools` command routing
  - CLI output renderer
  - Tool checks
- No new runtime dependency.
- No workspace file writes or user-level env writes for Agent Reach.
- No hosted services, accounts, databases, or API contracts.
