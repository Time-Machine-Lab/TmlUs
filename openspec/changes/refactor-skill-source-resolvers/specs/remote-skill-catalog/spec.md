## ADDED Requirements

### Requirement: Declarative search source resolver

TmlUs SHALL allow each remote Skill search source to define a declarative `resolver` that describes how Skills are discovered from that source.

The resolver MUST be maintained in the TmlUs search source registry and MUST NOT require the remote repository to maintain a TmlUs-specific manifest. A `github-skill-files` resolver MUST support file path patterns, path variables, metadata mappings, install source templates, and category include/exclude filters.

#### Scenario: Source declares a flat Skill layout

- **WHEN** TmlUs loads a search source whose resolver uses pattern `skills/{id}/SKILL.md`
- **THEN** the registry accepts the source as a flat GitHub Skill file source
- **AND** the resolver can derive the Skill ID from the matched path

#### Scenario: Source declares a categorized Skill layout

- **WHEN** TmlUs loads a search source whose resolver uses pattern `skills/{category}/{id}/SKILL.md`
- **THEN** the registry accepts the source as a categorized GitHub Skill file source
- **AND** the resolver can derive both Skill category and Skill ID from the matched path

### Requirement: Resolver metadata mapping

TmlUs SHALL support resolver metadata mappings for constructing remote Skill metadata from controlled sources.

The supported mapping sources MUST include path variables captured by resolver patterns, supported `SKILL.md` frontmatter fields, and search source metadata. The resolver MUST NOT support arbitrary JavaScript or remote executable code.

#### Scenario: Metadata comes from path and frontmatter

- **WHEN** a resolver maps `category` to `path.category`, `name` to `frontmatter.name`, and `description` to `frontmatter.description`
- **THEN** TmlUs preserves those mappings as structured resolver configuration

#### Scenario: Remote JavaScript resolver is rejected

- **WHEN** a search source attempts to define discovery through a remote JavaScript file or executable code
- **THEN** TmlUs rejects that resolver configuration or ignores the unsupported executable field
- **AND** TmlUs does not execute remote source code during Skill search

### Requirement: Resolver category filtering

TmlUs SHALL allow each search source resolver to define source-specific category filters.

When `excludeCategories` is configured, matching Skills from those categories MUST NOT appear in normal search results. When `includeCategories` is configured, only matching Skills from those categories MUST appear in normal search results.

#### Scenario: Deprecated category is excluded

- **WHEN** a resolver excludes category `deprecated`
- **AND** the remote repository contains a Skill matched under the `deprecated` path category
- **THEN** TmlUs does not include that Skill in the source search results

#### Scenario: Source-specific filtering does not affect other sources

- **WHEN** one search source excludes `in-progress`
- **AND** another search source does not define that exclusion
- **THEN** the exclusion applies only to the source that declared it

### Requirement: Matt Pocock source resolver

TmlUs SHALL define the Matt Pocock Skills source using a source-specific resolver.

The source description MUST be written in Chinese and explain that the source helps with AI Coding workflows such as requirement alignment, feedback loops, TDD, debugging discipline, architecture improvement, PRD or issue breakdown, prototyping, and session handoff. The resolver MUST match Skills under `skills/{category}/{id}/SKILL.md` and MUST exclude `deprecated`, `personal`, and `in-progress` by default.

#### Scenario: Matt Pocock source uses category resolver

- **WHEN** TmlUs loads the official remote search source registry
- **THEN** the `mattpocock-skills` source uses a resolver pattern equivalent to `skills/{category}/{id}/SKILL.md`
- **AND** the source has a Chinese functional description

#### Scenario: Matt Pocock excluded categories are hidden

- **WHEN** TmlUs searches the `mattpocock-skills` source with default registry metadata
- **THEN** Skills from `deprecated`, `personal`, and `in-progress` categories are not included

### Requirement: Resolver compatibility and validation

TmlUs SHALL keep existing search source entries compatible while making `resolver` the preferred configuration model.

Existing entries without `resolver` MUST remain valid through the existing fallback behavior or an internal compatibility mapping. Existing `discovery.strategy` metadata MAY be read for compatibility, but new source definitions MUST use `resolver`.

#### Scenario: Existing source without resolver remains valid

- **WHEN** TmlUs loads an existing valid search source entry that does not include `resolver`
- **THEN** the source remains usable through compatible discovery behavior

#### Scenario: Invalid resolver is rejected

- **WHEN** TmlUs loads a search source with an unsupported resolver type, invalid pattern, or invalid metadata mapping
- **THEN** TmlUs rejects that source entry or marks it unavailable without breaking the entire registry
