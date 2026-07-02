## 1. Catalog And Types

- [x] 1.1 Add a prompt-only Tool strategy/adapter type to core Tool metadata.
- [x] 1.2 Add Agent Reach to the Tool catalog with install/update prompt action metadata.

## 2. CLI Interaction

- [x] 2.1 Add Agent Reach action selection UI with install and update choices.
- [x] 2.2 Add Agent Reach prompt rendering that matches the SkillClaw copy-prompt style and degrades cleanly for quiet/non-TTY output.
- [x] 2.3 Route `tmlus tools agent-reach`, `tmlus tools agent-reach install`, and `tmlus tools agent-reach update` without running external installers or creating Tool env files.
- [x] 2.4 Return an actionable error for unsupported Agent Reach actions.

## 3. Verification

- [x] 3.1 Update tool checks to cover Agent Reach catalog discovery, direct install/update prompts, and unknown-tool messages.
- [x] 3.2 Verify the implementation with the existing tool check script.
