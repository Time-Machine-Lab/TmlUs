## Why

TmlUs is distributed through npm and is intended to be a reusable local CLI entry point for the TML team's AI development workspace. Team members need a simple way to tell whether their installed `tmlus` is behind the public npm release and update it without remembering package names or registry commands.

## What Changes

- Add a new `tmlus update` command that checks the current CLI version against the latest published npm version.
- When a newer version is available, update the global npm installation to the latest `@time-machine-lab/tmlus` package.
- Report clear results for already-current, updated, update-failed, registry-unreachable, and non-global or npx usage scenarios.
- Preserve automation-friendly output behavior for `--quiet`, CI, non-TTY, and no-banner contexts.
- Add the new command to dynamic help output and command validation.
- Non-goals:
  - Do not introduce hosted update services, accounts, remote dashboards, databases, or telemetry.
  - Do not replace npm as the package source for this change.
  - Do not mutate project workspace files; the command only concerns the installed TmlUs CLI package.

## Capabilities

### New Capabilities
- `cli-self-update`: Detect and update the installed TmlUs CLI from the public npm package registry.

### Modified Capabilities
- `dynamic-help-command`: Help output includes the new `update` command and its key usage examples.

## Impact

- CLI routing in `tmlus-core/src/cli/index.ts` adds `update` as a recognized command.
- A new application use case handles version lookup, semantic version comparison, npm global installation, and post-update verification.
- A tool or package-manager adapter invokes npm commands with platform-aware command names.
- CLI output helpers render update progress and final status while respecting quiet/no-banner/CI behavior.
- Command smoke checks cover help inclusion, update status paths, and old dashed-command rejection for `--update`.
