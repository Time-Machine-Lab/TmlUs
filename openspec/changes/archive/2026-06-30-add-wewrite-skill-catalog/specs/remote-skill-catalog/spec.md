## MODIFIED Requirements

### Requirement: Official remote Skill catalog

TmlUs SHALL define its official Skill catalog as static data in the `Time-Machine-Lab/TmlUs` repository under `data/skills/catalog.json`.

The catalog MUST include enough metadata to construct installable Skill definitions, including Skill ID, optional aliases, display name, source, category, functional description, installer strategy, and supported AI IDE targets.

#### Scenario: Official catalog includes Humanizer-zh

- **WHEN** the official remote Skill catalog is loaded
- **THEN** it includes a Skill with ID `humanizer-zh`
- **THEN** that Skill has category `内容创作`
- **THEN** that Skill uses `github:op7418/Humanizer-zh` as its source

#### Scenario: Official catalog includes WeWrite

- **WHEN** the official remote Skill catalog is loaded
- **THEN** it includes a Skill with ID `wewrite`
- **THEN** that Skill has category `内容创作`
- **THEN** that Skill uses `github:oaker-io/wewrite` as its source
- **THEN** that Skill uses an installer that includes its root `SKILL.md` and required runtime resource directories

#### Scenario: Catalog entries are installable

- **WHEN** TmlUs loads a valid official catalog entry
- **THEN** TmlUs can normalize it into a `SkillDefinition`
- **THEN** the existing Skill install flow can use its source, installer, and target metadata without special-case logic
