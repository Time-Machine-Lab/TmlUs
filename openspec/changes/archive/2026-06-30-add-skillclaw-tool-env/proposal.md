## Why

TmlUs 的 `tools` 体系目前适合直接安装和配置外部 CLI 工具，但 SkillClaw 的团队接入需要 Agent 根据用户环境、远端存储、AI IDE 配置和团队约定进行交互式安装与配置，直接由 TmlUs 程序化安装容易遗漏关键上下文。

这个改动让 TmlUs 只负责准备跨平台的 SkillClaw 工具文档环境，把安装说明、帮助说明和后续 Agent 操作入口交付给用户，由用户交给 Agent 完成实际 SkillClaw 安装、配置和运维。

## What Changes

- 在 TmlUs 用户级环境目录下创建并维护 `env` 根目录，例如通过平台无关的 home 目录解析得到 `~/.tmlus/env`。
- 在 `tmlus tools` 中新增 SkillClaw Tool，标记为需要用户级 Tool env 的文档准备型工具。
- 当用户选择 `skillclaw` 且 `~/.tmlus/env/skillclaw` 不存在或文档不完整时，TmlUs 创建该目录并获取 SkillClaw 文档包。
- SkillClaw 文档包至少包含：
  - `install-runbook.md`：仅指导 Agent 安装和基础配置 SkillClaw。
  - `skillclaw-help.md`：指导用户把文档交给 Agent 后可获得哪些 SkillClaw 相关帮助。
  - `manifest.json`：记录文档包版本、来源和完整性状态。
- 文档包来源只使用 TmlUs 维护的远程 GitHub 静态文件；远程不可用或文档不完整时，准备流程失败并提示用户稍后重试或检查网络。
- 当 `~/.tmlus/env/skillclaw` 已准备完成时，`tmlus tools skillclaw` 展示重新获取文档、查看安装说明、查看 SkillClaw 帮助等操作。
- TmlUs 不直接 clone、install、configure、start、doctor、pull、validate 或 evolve SkillClaw；这些动作属于用户交给 Agent 后基于文档执行的 SkillClaw/Agent 能力。
- 输出遵守现有 CLI 可读性、quiet、CI、non-TTY 和 no-color 降级规则。

## Capabilities

### New Capabilities

- `tool-env-docs`: 用户级 Tool env 目录和文档包准备能力，覆盖跨平台 env 路径、远程文档获取、manifest 和展示行为。
- `skillclaw-tool-env`: SkillClaw 作为文档准备型 Tool 的目录状态、准备流程、菜单选项和用户指导。

### Modified Capabilities

- `tool-discovery-install`: `tmlus tools` 需要支持文档准备型 Tool，而不仅是直接安装或适配外部 CLI 的 Tool。
- `dynamic-help-command`: 帮助输出需要说明 `tools` 可包含文档准备型工具，并可示例 SkillClaw。

## Impact

- 影响代码：
  - Tool catalog metadata and installer strategy definitions.
  - `tmlus tools` selection and direct tool dispatch.
  - New user-level env path helper using platform-independent home directory resolution.
  - New document package fetch/copy/manifest validation use case.
  - CLI output rendering for prepared, refreshed, skipped, and failed document preparation states.
- 影响数据/文档：
  - Add maintained SkillClaw document package under TmlUs static data.
  - Add SkillClaw help/runbook docs.
  - Update command wiki and README tool descriptions.
- 外部依赖：
  - Uses GitHub/raw static document fetch.
  - Must not require a hosted TmlUs service, database, account system, or remote dashboard.
- 非目标：
  - Do not install SkillClaw itself.
  - Do not modify AI IDE configuration.
  - Do not start local SkillClaw client proxy.
  - Do not deploy Evolve Server.
  - Do not implement SkillClaw doctor/pull/validate/evolve execution in TmlUs for this change.
