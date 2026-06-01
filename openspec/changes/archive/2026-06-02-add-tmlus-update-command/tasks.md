## 1. Command Surface

- [x] 1.1 Add `update` to CLI command resolution so `tmlus update` is recognized and `--update` is rejected with the existing dashed-command guidance.
- [x] 1.2 Add `update` metadata to the command registry with bilingual names, descriptions, usage examples, and any relevant parameter notes.
- [x] 1.3 Ensure startup banner behavior for `tmlus update` follows existing quiet/no-banner/CI/non-TTY rules.

## 2. Update Use Case

- [x] 2.1 Add core result types for update statuses: already-current, update-available, updated, verification-failed, unsupported-invocation, and failed.
- [x] 2.2 Implement a semantic version comparison helper and unit coverage for equal, greater, lower, and multi-digit version segments.
- [x] 2.3 Implement the application use case that reads the current package version, checks the latest npm version, decides whether an update is needed, and returns structured results.
- [x] 2.4 Detect obvious npx or non-global invocation signals and return guidance without claiming the active invocation was updated.

## 3. npm Adapter

- [x] 3.1 Add a package-manager adapter for platform-aware npm command execution.
- [x] 3.2 Implement latest-version lookup for `@time-machine-lab/tmlus` using npm registry metadata.
- [x] 3.3 Implement global package update using `npm install -g @time-machine-lab/tmlus@latest`.
- [x] 3.4 Implement post-update verification by resolving the installed `tmlus version` result or equivalent package version check.
- [x] 3.5 Surface registry, install, and verification errors as structured failures with actionable messages.

## 4. Output Rendering

- [x] 4.1 Add update progress and summary rendering helpers that match existing CLI output style.
- [x] 4.2 Ensure `--quiet` prints only essential update status or error information.
- [x] 4.3 Ensure CI, non-TTY, and no-color output remains readable and contains no broken ANSI escape sequences.
- [x] 4.4 Include manual recovery commands when automatic update or verification fails.

## 5. Verification

- [x] 5.1 Add command smoke checks for `tmlus help` including `update`.
- [x] 5.2 Add command smoke checks that `tmlus --update` is rejected with the subcommand migration message.
- [x] 5.3 Add mocked update-flow checks for already-current, update-available success, registry failure, install failure, npx/non-global guidance, and verification failure.
- [x] 5.4 Run `npm run build` from `tmlus-core`.
- [x] 5.5 Run relevant command and update verification scripts from `tmlus-core`.
- [x] 5.6 Run `openspec validate add-tmlus-update-command`.
- [x] 5.7 Update `docs/TmlUs命令Wiki.md` and README command summary for `tmlus update`.
- [x] 5.8 Add command Wiki consistency checks so future registered commands must appear in the Wiki index and command reference.
