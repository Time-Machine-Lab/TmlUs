## ADDED Requirements

### Requirement: Search source descriptions

TmlUs SHALL allow each remote Skill search source to define a functional description.

The search source description MUST explain in Chinese what problem space the source helps users solve when the source is maintained by TmlUs official metadata. Existing search source entries without a description MUST remain valid and MUST fall back to source URL or category display behavior.

#### Scenario: Source description is normalized

- **WHEN** TmlUs loads a search source entry that includes a non-empty `description`
- **THEN** the search source registry preserves the description for downstream UI and Skill search behavior

#### Scenario: Source without description remains valid

- **WHEN** TmlUs loads an existing valid search source entry without `description`
- **THEN** the source remains usable without requiring a catalog schema migration from users

### Requirement: Manifest-based GitHub Skill discovery

TmlUs SHALL support GitHub search sources that discover Skills by finding `SKILL.md` manifest files under the configured source directory.

Manifest-based discovery MUST be opt-in per search source. When a source does not opt in, TmlUs MUST preserve the existing one-level directory discovery behavior. Manifest-based discovery MUST support bounded search scope through depth and category include/exclude configuration.

#### Scenario: Manifest discovery finds nested Skills

- **WHEN** a GitHub search source uses manifest-based discovery
- **AND** the source repository contains `SKILL.md` files below nested category directories
- **THEN** TmlUs discovers each directory containing `SKILL.md` as an installable remote Skill

#### Scenario: Existing directory discovery remains compatible

- **WHEN** a GitHub search source does not declare manifest-based discovery
- **THEN** TmlUs discovers remote Skills using the existing one-level directory behavior

#### Scenario: Excluded categories are not discovered

- **WHEN** a manifest-based search source excludes a category such as `deprecated` or `personal`
- **THEN** TmlUs does not include Skills from that category in the remote Skill results

### Requirement: Matt Pocock Skills search source

TmlUs SHALL include `mattpocock/skills` as a remote Skill search source.

The source metadata MUST use a Chinese description explaining that this source helps solve AI Coding problems such as requirement alignment, excessive agent verbosity, missing feedback loops, debugging discipline, TDD, PRD and issue breakdown, architecture improvement, prototyping, and session handoff. The source SHOULD discover stable team-suitable categories by default and MUST avoid showing deprecated or personal-only Skills unless explicitly configured otherwise.

#### Scenario: Matt Pocock source is available

- **WHEN** TmlUs loads the official remote search source registry
- **THEN** the registry includes a source for `github:mattpocock/skills/skills`
- **AND** that source has a Chinese functional description

#### Scenario: Deprecated and personal Skills are excluded

- **WHEN** TmlUs searches the Matt Pocock Skills source with its default configuration
- **THEN** results from `deprecated` and `personal` categories are not shown
