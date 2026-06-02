## ADDED Requirements

### Requirement: Official remote Skill catalog

TmlUs SHALL define its official Skill catalog as static data in the `Time-Machine-Lab/TmlUs` repository under `data/skills/catalog.json`.

The catalog MUST include enough metadata to construct installable Skill definitions, including Skill ID, optional aliases, display name, source, category, functional description, installer strategy, and supported AI IDE targets.

#### Scenario: Official catalog includes Humanizer-zh

- **WHEN** the official remote Skill catalog is loaded
- **THEN** it includes a Skill with ID `humanizer-zh`
- **THEN** that Skill has category `内容创作`
- **THEN** that Skill uses `github:op7418/Humanizer-zh` as its source

#### Scenario: Catalog entries are installable

- **WHEN** TmlUs loads a valid official catalog entry
- **THEN** TmlUs can normalize it into a `SkillDefinition`
- **THEN** the existing Skill install flow can use its source, installer, and target metadata without special-case logic

### Requirement: Remote catalog cache

TmlUs SHALL cache the remote official Skill catalog locally for a multi-hour TTL.

The default TTL MUST be 4 hours unless overridden by configuration.

#### Scenario: Fresh cache is used

- **WHEN** the user runs a Skill command and a valid cached official catalog exists within the TTL
- **THEN** TmlUs uses the cached catalog without requiring a remote catalog request

#### Scenario: Expired or missing cache is refreshed

- **WHEN** the user runs a Skill command and the cached official catalog is missing or expired
- **THEN** TmlUs attempts to fetch the official remote catalog
- **THEN** TmlUs writes a new cache entry after the fetched catalog passes validation

### Requirement: Remote catalog fallback

TmlUs SHALL preserve local-first behavior when the remote catalog cannot be fetched or validated.

Fallback order MUST be fresh cache, remote fetch, stale cache, then bundled catalog.

#### Scenario: Remote fetch fails with stale cache available

- **WHEN** the remote official catalog fetch fails
- **AND** a previously cached catalog exists but is past the TTL
- **THEN** TmlUs uses the stale cached catalog

#### Scenario: Remote fetch fails without cache

- **WHEN** the remote official catalog fetch fails
- **AND** no valid cached catalog exists
- **THEN** TmlUs uses the bundled catalog shipped with the CLI package

#### Scenario: Remote catalog validation fails

- **WHEN** the fetched official catalog has unsupported schema version, missing required fields, unsupported installer strategy, or invalid target metadata
- **THEN** TmlUs rejects the fetched catalog
- **THEN** TmlUs uses stale cache or bundled catalog according to the fallback order

### Requirement: Remote search source registry

TmlUs SHALL define remote Skill search sources as static data in the `Time-Machine-Lab/TmlUs` repository under `data/skills/search-sources.json`.

The registry MUST NOT include the official TmlUs catalog as a Search Source. The registry MUST support `tml-skills` as the default source backed by `github:Time-Machine-Lab/TML-Skills/skills`.

#### Scenario: Default search source is TML-Skills

- **WHEN** the user runs `tmlus skills search` without specifying a source
- **THEN** TmlUs uses the `tml-skills` search source

#### Scenario: TML-Skills remains searchable

- **WHEN** the user runs `tmlus skills search --search tml-skills`
- **THEN** TmlUs searches `github:Time-Machine-Lab/TML-Skills/skills`

#### Scenario: TmlUs Official is not a search source

- **WHEN** the user selects a Search Source
- **THEN** TmlUs does not show `TmlUs Official` as a search source option

### Requirement: Remote catalog configuration

TmlUs SHALL allow tests and advanced users to configure remote catalog behavior without changing source code.

Configuration MUST support overriding the official catalog URL, overriding the cache TTL, and disabling remote catalog loading.

#### Scenario: Catalog URL override is configured

- **WHEN** the catalog URL override is configured
- **THEN** TmlUs fetches the official catalog from the configured URL instead of the default GitHub raw URL

#### Scenario: Remote catalog is disabled

- **WHEN** remote catalog loading is disabled
- **THEN** TmlUs uses the bundled catalog and does not require a remote catalog request
