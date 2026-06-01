## Why

TmlUs is intended to be distributed as a reusable team CLI, but the current repository does not yet have a repeatable npm public registry release path. A tag-triggered GitHub Actions workflow will make releases auditable, consistent, and easy for team members to install with npm or npx.

This change is needed now because the project is moving from concept and local scaffolding toward a package that can be consumed outside the repository.

## What Changes

- Add a GitHub Actions workflow that publishes the TmlUs npm package to the public npm registry when a version tag such as `v0.1.0` is pushed.
- Configure the workflow to use the existing team publish action pattern from `TML-Docs-Spec/.github/workflows/publish.yml`.
- Target the package workspace that will contain the npm package, expected to be `tmlus-core`.
- Use Node.js 20.x for install, build, and publish.
- Require `NPM_REGISTRY_URL` and `NPM_TOKEN` repository secrets for registry authentication.
- Publish scoped public packages with `npm publish --access public`.
- Ensure release safety checks are part of the workflow, including dependency install and build before publish.
- Document the package prerequisites needed before the workflow can successfully publish, including `package.json`, lockfile, build script, CLI entry, and package file whitelist.

## Capabilities

### New Capabilities

- `npm-public-publishing`: Defines how TmlUs is packaged and published to the public npm registry through a tag-triggered GitHub Actions workflow.

### Modified Capabilities

- None.

## Impact

- Adds release automation under `.github/workflows/`.
- Requires a publishable npm package in `tmlus-core`.
- Requires GitHub repository secrets:
  - `NPM_REGISTRY_URL`, expected to be `https://registry.npmjs.org/` for public npm publishing.
  - `NPM_TOKEN`, expected to be an npm access token with publish permission for the target package or scope.
- Requires the npm package name, scope, version strategy, build command, and public access behavior to be reflected in `tmlus-core/package.json`.
- Does not introduce runtime product behavior or application APIs.
