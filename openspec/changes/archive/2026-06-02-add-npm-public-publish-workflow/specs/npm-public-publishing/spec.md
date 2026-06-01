## ADDED Requirements

### Requirement: Tag-triggered npm public publishing

The system SHALL provide a GitHub Actions workflow that publishes the TmlUs npm package to the public npm registry only when a version tag matching `v*` is pushed.

#### Scenario: Publish workflow starts from version tag

- **WHEN** a maintainer pushes a tag such as `v0.1.0`
- **THEN** the npm publish workflow starts

#### Scenario: Normal branch push does not publish

- **WHEN** a maintainer pushes commits to a branch without pushing a matching version tag
- **THEN** the npm publish workflow does not publish a package

### Requirement: Public npm registry configuration

The workflow SHALL publish to the registry provided by the `NPM_REGISTRY_URL` GitHub repository secret and MUST support `https://registry.npmjs.org/` as the public npm registry URL.

#### Scenario: Registry URL is provided by secret

- **WHEN** the workflow runs
- **THEN** it uses `secrets.NPM_REGISTRY_URL` as the npm registry URL

#### Scenario: Public npm registry is configured

- **WHEN** `NPM_REGISTRY_URL` is set to `https://registry.npmjs.org/`
- **THEN** the workflow targets the public npm registry

### Requirement: npm token authentication

The workflow SHALL authenticate publishing with the `NPM_TOKEN` GitHub repository secret and MUST NOT require any npm access token to be committed to the repository.

#### Scenario: npm token is provided by secret

- **WHEN** the workflow runs
- **THEN** it passes `secrets.NPM_TOKEN` to the publish action or npm publish environment

#### Scenario: token is absent from repository files

- **WHEN** a maintainer inspects workflow and package files
- **THEN** no literal npm access token is present in committed source files

### Requirement: tmlus-core package workspace

The workflow SHALL run package install, build, and publish commands from the `tmlus-core` working directory.

#### Scenario: package commands use tmlus-core

- **WHEN** the publish workflow executes
- **THEN** dependency, build, and publish operations run with `tmlus-core` as the working directory

### Requirement: Build before publish

The workflow SHALL build the package before publishing and MUST stop before publication if the build fails.

#### Scenario: build succeeds

- **WHEN** the package build command completes successfully
- **THEN** the workflow proceeds to npm publish

#### Scenario: build fails

- **WHEN** the package build command fails
- **THEN** the workflow stops and does not publish the package

### Requirement: Scoped public package publishing

The workflow SHALL publish with public access semantics so scoped packages such as `@time-machine-lab/tmlus` or `@tml/us` are publicly installable.

#### Scenario: scoped package is published publicly

- **WHEN** the target package name is scoped
- **THEN** the workflow publishes with `npm publish --access public`

### Requirement: Package prerequisites are documented or enforced

The change SHALL ensure the package release path includes the npm package prerequisites required for a successful public publish.

#### Scenario: package manifest exists

- **WHEN** a maintainer prepares the first release
- **THEN** `tmlus-core/package.json` defines package name, version, scripts, CLI bin entry when applicable, files whitelist, license, and Node engine requirements

#### Scenario: lockfile exists

- **WHEN** the publish workflow runs
- **THEN** `tmlus-core/package-lock.json` is available for deterministic dependency install and dependency caching

#### Scenario: package contents are reviewable

- **WHEN** a maintainer validates the package before first publication
- **THEN** `npm pack --dry-run` can be used from `tmlus-core` to review files that will be published
