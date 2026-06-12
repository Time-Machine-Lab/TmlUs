## ADDED Requirements

### Requirement: Search source description display

TmlUs SHALL display remote Skill search source descriptions during interactive source selection.

When a source has a description, the selector MUST prefer that description over the raw source URL for detail text. When no description is available, the selector MUST fall back to existing source URL or category detail behavior. The output MUST remain readable without color and in narrow terminal widths.

#### Scenario: User sees source problem description

- **WHEN** the user runs `tmlus skills search` and enters interactive source selection
- **AND** a source has a Chinese description
- **THEN** TmlUs shows that description as the source detail text

#### Scenario: Source detail falls back safely

- **WHEN** a search source has no description
- **THEN** TmlUs shows the source URL or category using the existing fallback behavior

### Requirement: Remote Skill descriptions from SKILL.md

TmlUs SHALL use `SKILL.md` frontmatter to describe remote Skills discovered through manifest-based search.

For each discovered manifest, TmlUs MUST parse supported frontmatter fields and use `name` and `description` when constructing the remote Skill list. The description shown to the user MUST explain the problem the Skill solves when that information is available. If parsing fails or a field is missing, TmlUs MUST fall back to directory name, source description, or source display name without failing the entire search.

#### Scenario: Skill frontmatter appears in results

- **WHEN** TmlUs discovers a remote Skill directory containing `SKILL.md` with `name` and `description`
- **THEN** the remote Skill selection list uses those fields for display

#### Scenario: Missing manifest metadata does not fail all results

- **WHEN** one discovered `SKILL.md` cannot be parsed
- **THEN** TmlUs keeps other discovered Skills available
- **AND** the affected Skill uses fallback display metadata if it can still be installed

### Requirement: Remote Skill search performance and fallback

TmlUs SHALL keep manifest-based remote Skill search bounded and recoverable.

The search implementation MUST use bounded concurrency when fetching multiple remote manifests. It MUST cache successful search metadata according to the remote catalog cache policy or an equivalent Skill search cache policy. If live search fails, TmlUs MUST prefer valid cached data before falling back to less detailed discovery or reporting a source-specific failure.

#### Scenario: Manifest fetches are bounded

- **WHEN** a manifest-based source contains many `SKILL.md` files
- **THEN** TmlUs fetches manifest metadata with a bounded concurrency limit

#### Scenario: Cached results survive remote failure

- **WHEN** live manifest discovery fails after a previous successful search has been cached
- **THEN** TmlUs can use cached search metadata instead of returning no Skills for that source

#### Scenario: One source failure does not cancel other sources

- **WHEN** the user searches multiple remote sources
- **AND** one source fails during manifest discovery
- **THEN** TmlUs can still show results from successful sources
- **AND** reports the failed source without claiming full success
