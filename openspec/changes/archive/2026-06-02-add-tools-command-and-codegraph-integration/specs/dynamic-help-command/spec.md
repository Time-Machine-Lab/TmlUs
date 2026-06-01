## MODIFIED Requirements

### Requirement: Help includes requested command families

TmlUs help output SHALL include the `ide`, `skills`, and `tools` command families.

The help entry for `ide` MUST explain optional direct IDE-name arguments. The help entry for `skills` MUST explain optional Skill IDs and target IDE arguments. The help entry for `tools` MUST explain optional direct Tool IDs and MUST include CodeGraph as an example Tool.

#### Scenario: Help describes IDE initialization

- **WHEN** the user reads `tmlus help`
- **THEN** they can see that `tmlus ide` initializes AI IDE environments and can accept IDE names

#### Scenario: Help describes Skill installation

- **WHEN** the user reads `tmlus help`
- **THEN** they can see that `tmlus skills` lists or installs maintained skills and can target AI IDE environments

#### Scenario: Help describes Tool installation

- **WHEN** the user reads `tmlus help`
- **THEN** they can see that `tmlus tools` lists or installs maintained external tools and can accept a Tool ID such as `codegraph`
