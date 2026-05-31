## MODIFIED Requirements

### Requirement: Help includes requested command families
TmlUs help output SHALL include the `init`, `--ide`, `--skills`, `--tml-spec`, and `--work-mode` command families.

The help entry for `init` MUST explain guided project initialization and `--from <step>` resume usage. The help entry for `--ide` MUST explain optional direct IDE-name arguments. The help entry for `--skills` MUST explain optional Skill IDs and target IDE arguments. The help entry for `--tml-spec` MUST explain TML Docs structure initialization. The help entry for `--work-mode` MUST explain supported project work modes.

#### Scenario: Help describes project initialization
- **WHEN** the user reads `tmlus --help`
- **THEN** they can see that `tmlus init` guides project initialization
- **AND** they can see that `tmlus init --from <step>` resumes from a named step

#### Scenario: Help describes IDE initialization
- **WHEN** the user reads `tmlus --help`
- **THEN** they can see that `tmlus --ide` initializes AI IDE environments and can accept IDE names

#### Scenario: Help describes Skill installation
- **WHEN** the user reads `tmlus --help`
- **THEN** they can see that `tmlus --skills` lists or installs maintained skills and can target AI IDE environments

#### Scenario: Help describes TML Docs structure initialization
- **WHEN** the user reads `tmlus --help`
- **THEN** they can see that `tmlus --tml-spec` initializes the standard TML Docs folder structure

#### Scenario: Help describes work-mode initialization
- **WHEN** the user reads `tmlus --help`
- **THEN** they can see that `tmlus --work-mode` initializes project work mode and supports `openspec` or `skip`
