# TmlUs

TmlUs is the TML AI development workspace initializer and toolkit.

This package is currently a preview CLI package used to establish the public npm release path. Product commands will be added through future OpenSpec changes.

## Package

- npm package: `@time-machine-lab/tmlus`
- CLI command: `tmlus`
- public registry: `https://registry.npmjs.org/`

## Local Validation

```bash
npm ci
npm run build
npm pack --dry-run
```

## Release Notes

Public releases are intended to be published from GitHub Actions when a version tag such as `v0.1.0` is pushed.
