## ADDED Requirements

### Requirement: Help includes update command

TmlUs help output SHALL include the `update` command.

The help entry for `update` MUST explain that it checks the installed TmlUs CLI version against the latest npm release and updates when a newer version is available.

#### Scenario: Help describes CLI update

- **WHEN** the user reads `tmlus help`
- **THEN** they can see that `tmlus update` checks for and installs a newer TmlUs CLI release when available

#### Scenario: English help describes CLI update

- **WHEN** the user reads English help output
- **THEN** the update entry uses English command metadata from the command registry
