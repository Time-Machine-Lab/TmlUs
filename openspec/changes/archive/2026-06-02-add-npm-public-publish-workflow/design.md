## Context

TmlUs currently has project documentation and OpenSpec scaffolding, but it does not yet have a complete npm package or GitHub Actions publishing workflow. The reference project `TML-Docs-Spec` publishes `TMLSPEC-cli` through a tag-triggered workflow that delegates install/build/publish mechanics to `Time-Machine-Lab/TML-Github_Actions/actions/publish-node-package@main`.

This change should establish the same release pattern for TmlUs while targeting the public npm registry. The intended package workspace is `tmlus-core`, which will need to become a valid npm package before publishing can succeed.

The publishing flow should not require maintainers to expose npm access tokens in source files. Registry credentials must be supplied through GitHub repository secrets.

## Goals / Non-Goals

**Goals:**

- Add a repeatable npm public publishing workflow triggered by version tags.
- Reuse the existing TML shared GitHub Action pattern where practical.
- Publish from `tmlus-core` as the npm package working directory.
- Support public scoped package publishing through `npm publish --access public`.
- Keep registry URL and npm token outside the repository by using GitHub Secrets.
- Make release prerequisites explicit so failed publishes are caused by real package issues rather than missing conventions.

**Non-Goals:**

- Do not publish automatically on every branch push.
- Do not store npm credentials, `.npmrc` tokens, or access tokens in the repository.
- Do not implement TmlUs CLI product functionality as part of this change.
- Do not introduce private registry publishing in this workflow.
- Do not solve npm organization creation or account management inside code.

## Decisions

### Decision: Use tag-triggered releases

The workflow will run on pushed tags matching `v*`, such as `v0.1.0`.

This matches the existing `TMLSPEC-cli` release convention and makes publishing an intentional release action instead of a side effect of normal development pushes. The main alternative was publishing from `main`, but that would make accidental releases more likely and would couple every merge to a package publication.

### Decision: Publish from `tmlus-core`

The workflow will set `working_directory` to `tmlus-core`.

The repository root contains docs, OpenSpec artifacts, and project metadata rather than a package manifest. Keeping the npm package in `tmlus-core` lets release automation focus on the CLI package while leaving room for future repository-level docs, specs, and supporting assets. The alternative was publishing from the repository root, but that would blur product code with planning and governance artifacts.

### Decision: Use public npm registry secrets

The workflow will read:

- `NPM_REGISTRY_URL`, expected to be `https://registry.npmjs.org/`.
- `NPM_TOKEN`, expected to be an npm access token with publish permission.

Using secrets keeps credentials out of source control and lets maintainers rotate tokens without changing workflow files. The alternative was committing `.npmrc` authentication data, which is not acceptable for a public package release path.

### Decision: Use `npm publish --access public`

The workflow will use `npm publish --access public`.

This is required for scoped packages that should be publicly installable. It is also safe for the intended package direction because the goal is public npm distribution. If TmlUs later chooses an unscoped package, the command remains acceptable for the public release intent.

### Decision: Keep the first workflow token-based

The first version will use `NPM_TOKEN` because the referenced team workflow already accepts an npm token input.

Trusted Publishing via GitHub OIDC can be considered later, but using the existing action contract reduces initial release complexity. If the team migrates to Trusted Publishing, the workflow can be updated to grant `id-token: write` and remove the long-lived npm token dependency.

## Risks / Trade-offs

- [Risk] The workflow can be added before `tmlus-core` is a valid npm package, causing release failures.
  Mitigation: Include explicit tasks to add or verify `package.json`, `package-lock.json`, build script, CLI bin entry, and package file whitelist before enabling the first tag release.

- [Risk] A scoped package may accidentally publish as restricted/private or fail publishing.
  Mitigation: Use `npm publish --access public` and set `publishConfig.access` to `public` in `tmlus-core/package.json` when the package manifest is created.

- [Risk] `NPM_TOKEN` could have broader permissions than necessary.
  Mitigation: Use a granular npm access token limited to the target package or organization scope with publish permissions only where possible.

- [Risk] Tag and package versions may drift.
  Mitigation: Define release practice so `vX.Y.Z` matches `tmlus-core/package.json` version `X.Y.Z`; optionally add a future validation step if drift becomes a recurring issue.

- [Risk] Public npm publication may expose unintended files.
  Mitigation: Use `files` in `package.json` and run `npm pack --dry-run` before the first public release.
