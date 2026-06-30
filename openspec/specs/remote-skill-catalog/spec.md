## Purpose

Specify official remote Skill catalog loading, caching, fallback behavior, configuration hooks, and remote search source registry behavior.

## Requirements

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

### Requirement: Search source descriptions

TmlUs SHALL allow each remote Skill search source to define a functional description.

The search source description MUST explain in Chinese what problem space the source helps users solve when the source is maintained by TmlUs official metadata. Existing search source entries without a description MUST remain valid and MUST fall back to source URL or category display behavior.

#### Scenario: Source description is normalized

- **WHEN** TmlUs loads a search source entry that includes a non-empty `description`
- **THEN** the search source registry preserves the description for downstream UI and Skill search behavior

#### Scenario: Source without description remains valid

- **WHEN** TmlUs loads an existing valid search source entry without `description`
- **THEN** the source remains usable without requiring a catalog schema migration from users

### Requirement: User-triggered cache refresh

TmlUs SHALL provide a `tmlus refresh` command that clears TmlUs-managed Skill cache files from the currently configured TmlUs cache directory.

The command MUST clear the official remote Skill catalog cache, the remote Skill search source registry cache, and remote Skill search result cache files. The command MUST respect the same cache directory resolution used by Skill catalog and Skill search loading, including `TMLUS_SKILL_CACHE_DIR` overrides and platform-specific default cache roots.

The command MUST limit deletion to known TmlUs-managed cache filenames and MUST NOT delete project files, AI IDE environment directories, installed Skills, `.codegraph/`, OpenSpec artifacts, npm cache, Git cache, or external tool state.

#### Scenario: Existing cache files are deleted

- **WHEN** the user runs `tmlus refresh`
- **AND** TmlUs-managed Skill cache files exist in the configured cache directory
- **THEN** TmlUs deletes those cache files
- **THEN** TmlUs reports the deleted cache entries in the command summary

#### Scenario: Missing cache files are skipped

- **WHEN** the user runs `tmlus refresh`
- **AND** one or more expected TmlUs-managed Skill cache files are absent
- **THEN** TmlUs treats the absent files as skipped rather than failed
- **THEN** the command succeeds if no deletion operation fails

#### Scenario: Refresh does not fetch remote data

- **WHEN** the user runs `tmlus refresh`
- **THEN** TmlUs clears the configured cache files without fetching the remote Skill catalog or remote Skill search sources
- **THEN** a later `tmlus skills` or `tmlus skills search` run rebuilds cache through the existing remote loading and fallback flow

#### Scenario: Deletion failure is reported

- **WHEN** the user runs `tmlus refresh`
- **AND** TmlUs cannot delete one or more managed cache files
- **THEN** TmlUs reports each failed cache entry with a clear error message
- **THEN** the command exits with a failure status

#### Scenario: Custom cache directory is respected

- **WHEN** `TMLUS_SKILL_CACHE_DIR` is configured
- **AND** the user runs `tmlus refresh`
- **THEN** TmlUs clears managed cache files from the configured directory
- **THEN** TmlUs does not clear cache files from the platform default cache directory

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
