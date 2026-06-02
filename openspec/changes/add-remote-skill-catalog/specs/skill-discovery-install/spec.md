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

### Requirement: Search and recommendation deferred

TmlUs SHALL support explicit remote Skill discovery through configured search sources.

TmlUs MUST use the `tmlus` source by default for `tmlus skills search`. TmlUs MUST allow users to select other configured sources such as `tml-skills`. TmlUs SHALL still defer semantic search, ranking, online recommendation, and personalized recommendation behavior.

#### Scenario: Default search uses TmlUs source

- **WHEN** the user runs `tmlus skills search`
- **THEN** TmlUs discovers remote Skills from the configured `tmlus` search source

#### Scenario: User selects TML-Skills source

- **WHEN** the user runs `tmlus skills search --search tml-skills`
- **THEN** TmlUs discovers remote Skills from the configured `tml-skills` search source

#### Scenario: Recommendation remains unavailable

- **WHEN** the user runs `tmlus skills`
- **THEN** the command does not expose semantic ranking, online recommendation, or personalized recommendation behavior
