## 1. Package Prerequisites

- [x] 1.1 Decide and document the public npm package name and scope for TmlUs.
- [x] 1.2 Create or verify `tmlus-core/package.json` with package name, version, scripts, CLI `bin` entry, `files` whitelist, license, Node engine, and public publish configuration.
- [x] 1.3 Create or verify `tmlus-core/package-lock.json` so the workflow can install dependencies deterministically.
- [x] 1.4 Create or verify the package build entry points so `npm run build` succeeds from `tmlus-core`.
- [x] 1.5 Run `npm pack --dry-run` from `tmlus-core` and confirm only intended public package files are included.

## 2. GitHub Actions Workflow

- [x] 2.1 Add `.github/workflows/publish.yml` for tag-triggered releases matching `v*`.
- [x] 2.2 Configure the workflow to use `actions/checkout@v4`.
- [x] 2.3 Configure the workflow to call `Time-Machine-Lab/TML-Github_Actions/actions/publish-node-package@main`.
- [x] 2.4 Set the workflow inputs for Node.js 20.x, `tmlus-core` working directory, `tmlus-core/package-lock.json` cache path, and `npm run build` build command.
- [x] 2.5 Set the publish command to `npm publish --access public`.
- [x] 2.6 Wire `registry_url` to `${{ secrets.NPM_REGISTRY_URL }}` and `npm_token` to `${{ secrets.NPM_TOKEN }}`.

## 3. Repository Secret Setup

- [ ] 3.1 Add GitHub repository secret `NPM_REGISTRY_URL` with value `https://registry.npmjs.org/`.
- [ ] 3.2 Add GitHub repository secret `NPM_TOKEN` using the npm access token with publish permission for the selected package or scope.
- [x] 3.3 Confirm no npm token or `.npmrc` authentication value is committed to the repository.

## 4. Release Validation

- [x] 4.1 Run local package validation from `tmlus-core`: install dependencies, build, and inspect `npm pack --dry-run`.
- [ ] 4.2 Push a version tag such as `v0.1.0` only after `tmlus-core/package.json` version matches the tag without the `v` prefix.
- [ ] 4.3 Confirm the GitHub Actions run publishes the package to the public npm registry.
- [ ] 4.4 Confirm the package can be installed or invoked from the public registry with npm or npx.
