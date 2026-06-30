## MODIFIED Requirements

### Requirement: Maintained Skill catalog

TmlUs SHALL maintain a structured catalog of available skills.

The Skill catalog MUST be loaded from the official remote catalog by default, with local cache and bundled catalog fallback. Each Skill entry MUST include Skill ID, display name, source, category, functional description, installer metadata, and supported AI IDE environment targets.

#### Scenario: Skill list comes from loaded catalog

- **WHEN** the user runs `tmlus skills`
- **THEN** TmlUs displays skills from the loaded maintained Skill catalog

#### Scenario: New Skill can be added through remote catalog

- **WHEN** a maintainer adds a valid new Skill entry to the official remote catalog
- **THEN** the Skill can appear in `tmlus skills` after catalog refresh without publishing a new TmlUs CLI version

#### Scenario: Humanizer-zh appears as content creation Skill

- **WHEN** the official remote catalog is available
- **THEN** `tmlus skills` can display `Humanizer-zh`
- **THEN** its category is `内容创作`

#### Scenario: WeWrite appears as content creation Skill

- **WHEN** the official remote catalog or bundled fallback catalog is available
- **THEN** `tmlus skills` can display `WeWrite`
- **THEN** its category is `内容创作`
- **THEN** users can install it through the existing Skill installation flow without a WeWrite-specific installer
