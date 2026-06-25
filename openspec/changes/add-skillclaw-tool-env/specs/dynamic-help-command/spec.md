## ADDED Requirements

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
