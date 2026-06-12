## ADDED Requirements

### Requirement: Help describes cache refresh

TmlUs help output SHALL include the `refresh` command family.

The help entry for `refresh` MUST explain that it clears TmlUs-managed cache files and MUST distinguish this behavior from `tmlus update`, which checks and updates the installed CLI package. The English help output MUST include English command metadata for `refresh`.

#### Scenario: Help describes refresh command

- **WHEN** the user reads `tmlus help`
- **THEN** they can see that `tmlus refresh` clears TmlUs-managed cache files
- **THEN** they can distinguish cache refresh from CLI package update

#### Scenario: English help describes refresh command

- **WHEN** the user reads English help output
- **THEN** the refresh entry uses English command metadata from the command registry

#### Scenario: Refresh appears in command examples

- **WHEN** the user reads `tmlus help`
- **THEN** the examples include at least one `tmlus refresh` usage
