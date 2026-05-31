## Why

TmlUs 当前 CLI 仍停留在预览包阶段，`--help` 是静态文本，尚未提供团队最需要的 AI IDE 环境初始化和 Skill 安装能力。为了让 TmlUs 成为真正可用的本地 AI Helper / AI Tools 工具箱，需要先落地命令注册、AI IDE 环境初始化、Skill 发现与安装这三类基础能力。

## What Changes

- Add a dynamic command registry so `tmlus --help` can render all supported commands without editing help-specific code whenever a command is added.
- Add `tmlus --ide [ideNames]` to detect, display, and initialize supported AI IDE environment folder structures.
- Add `tmlus --skills [skillIds] [--ide <ideNames>]` to list maintained TmlUs skills, support paged/multi-select installation, and install selected skills into one or more AI IDE environments.
- Add structured catalogs for commands, AI IDE environments, and skills so future additions do not require changing core command logic.
- Ensure CLI UI and command output comply with `docs/spec/DESIGN.md`, including readable text, quiet/no-banner behavior, CI/non-TTY degradation, and progress display rules.
- Keep search, online discovery, and recommendation features out of scope for this change.

## Capabilities

### New Capabilities

- `dynamic-help-command`: Dynamic `tmlus --help` command listing with Chinese and English command metadata.
- `ai-ide-environment-init`: AI IDE environment detection and initialization via `tmlus --ide`.
- `skill-discovery-install`: Maintained Skill catalog listing, selection, and installation via `tmlus --skills`.

### Modified Capabilities

- None.

## Impact

- Affected package:
  - `tmlus-core`
- Affected code areas:
  - CLI entry and argument dispatch
  - command metadata registry
  - AI IDE environment catalog/adapters
  - Skill catalog and installer
  - workspace file/directory creation
  - CLI UI list/progress output
- Affected user workflows:
  - `tmlus --help`
  - `tmlus --ide`
  - `tmlus --skills`
- Dependencies may need a CLI prompt library and lightweight download/progress utilities, but the implementation must stay local-first and must not introduce hosted platform, account, database, or API service dependencies.
