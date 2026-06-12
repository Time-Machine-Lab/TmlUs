## ADDED Requirements

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
