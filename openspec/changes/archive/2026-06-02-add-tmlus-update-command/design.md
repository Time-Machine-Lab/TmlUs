## Context

TmlUs is a local-first, CLI-first toolkit distributed as the public npm package `@time-machine-lab/tmlus`. The current CLI already has `version` output, dynamic help metadata, npm-based package publishing, and external tool adapters that run npm commands for global CLI installation.

The `update` command sits at the boundary between CLI routing, application use cases, and external tool adapters. It should not write to the current project workspace. Its only mutable target is the user's installed TmlUs package, delegated to npm.

## Goals / Non-Goals

**Goals:**

- Let users run `tmlus update` to check the latest public npm version and update when a newer version exists.
- Keep version comparison deterministic and avoid reinstalling when the current version is already current.
- Provide clear outcomes for success, already-current, registry failure, npm install failure, and npx/non-global usage.
- Respect TmlUs output rules for quiet, CI, non-TTY, no-color, and no-banner contexts.
- Keep package-manager process execution isolated behind an adapter-like boundary so CLI routing does not invoke npm directly.

**Non-Goals:**

- Do not add hosted update services, accounts, telemetry, dashboards, or databases.
- Do not support private registries in the first implementation beyond allowing npm's normal registry configuration or explicit command options if added later.
- Do not update project dependencies, AI IDE resources, Skills, Commands, or Tools.
- Do not guarantee self-replacement for `npx` executions; that mode should report guidance instead.

## Decisions

### Decision: Use npm registry metadata as the update source

`tmlus update` will query npm for the latest `@time-machine-lab/tmlus` version, using the public npm registry by default. This aligns with the package publishing workflow and avoids introducing a separate release manifest.

Alternative considered: maintain a custom remote update manifest. That would add another hosted source of truth and drift away from the current npm release boundary.

### Decision: Install through npm global package installation

When a newer version is available, the command will run the platform-appropriate npm executable with `install -g @time-machine-lab/tmlus@latest`. This mirrors the documented installation path and matches existing external CLI installation patterns.

Alternative considered: download package tarballs and replace files manually. That would be more fragile across npm layouts, permissions, Windows shims, and Node installations.

### Decision: Keep update orchestration in the application layer

CLI routing should recognize `update` and call an application use case. The use case should coordinate current version, registry lookup, semantic version comparison, package installation, and post-update verification. npm process calls should live in an adapter-style helper.

Alternative considered: implement all update logic inside `src/cli/index.ts`. That would make command routing carry external tool behavior and would work against the architecture boundary between CLI shell and application use cases.

### Decision: Treat npx or non-global usage as guidance-first

If the command cannot confidently update the active installation, it should avoid destructive or misleading behavior and print a manual command or npx-specific guidance. `npx` users can invoke the latest package directly from the registry, while global users can run npm global install.

Alternative considered: always run `npm install -g` regardless of invocation mode. That could update a global package while the active `tmlus` came from npx or another local path, leaving users thinking the running command updated itself when it did not.

### Decision: Verify after install

After npm reports success, the command should run or inspect the installed CLI version again and report whether the latest version is now visible. If verification fails, the install result should be treated as incomplete and the user should receive PATH or terminal restart guidance.

Alternative considered: trust npm install success. That misses common global-bin and shell PATH issues, especially on Windows.

## Risks / Trade-offs

- [Risk] npm registry lookup may fail because of network, proxy, or registry configuration issues. Mitigation: report a clear failure and keep the current installation unchanged.
- [Risk] global npm install may require elevated permissions. Mitigation: surface npm's failure message and show the exact manual update command.
- [Risk] the running process cannot replace itself on every package-manager layout. Mitigation: verify after install and tell users to restart the terminal when the new version is not immediately visible.
- [Risk] semantic version comparison can be wrong if implemented with plain string comparison. Mitigation: implement a small semver comparator for stable versions or use npm's own version data in a tested helper.
- [Risk] `npx` invocation semantics are ambiguous. Mitigation: detect obvious npx/npm execution indicators when possible and provide guidance instead of pretending to mutate the active invocation.
