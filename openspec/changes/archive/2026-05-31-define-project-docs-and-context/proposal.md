## Why

TmlUs 已明确定位为 TML 团队本地 AI Helper / AI Tools 工具箱，但当前项目只有概念文档，缺少能约束后续开发的顶层架构设计、开发规范，以及让 OpenSpec 自动参考这些上下文的配置。现在需要先补齐这些顶层文档和上下文同步规则，确保后续实现围绕同一套项目边界、CLI 体验和 AI 协作规范推进。

## What Changes

- 新增 TmlUs 架构设计文档，明确本地优先、CLI-first、Recipe 驱动、Environment Adapter 与 Tool Adapter 分层的系统架构。
- 新增 TmlUs 开发规范文档，约束 TypeScript/Node CLI 项目的目录结构、文件写入安全、Adapter 规范、诊断规则、测试策略和 CLI 输出风格。
- 开发规范文档必须引用并遵守 `docs/spec/DESIGN.md` 中定义的 CLI 设计语言。
- 基于 `.codex/prompts/tml-covenant-sync.md` 的 OpenSpec 同步思路，将项目应参考的上下文同步到 `openspec/config.yaml`。
- 本次不引入平台化、服务端化、账号体系、数据库/API 契约或业务系统规范。

## Capabilities

### New Capabilities

- `project-guidance-docs`: 定义并维护 TmlUs 的顶层架构设计文档与开发规范文档，作为后续实现和 AI 协作的权威项目上下文。
- `openspec-context-sync`: 将 TmlUs 的概念、架构、开发规范和 CLI 设计语言同步到 OpenSpec 配置，使 Explore/Proposal/Specs/Tasks/Apply 阶段能够参考正确上下文。

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/TmlUs项目概念介绍文档.md`
  - `docs/design/*.md`
  - `docs/spec/*.md`
  - `docs/spec/DESIGN.md`
- Affected configuration:
  - `openspec/config.yaml`
- Affected workflows:
  - OpenSpec Explore/Proposal/Specs/Tasks/Apply will gain project-level context and lifecycle rules.
- No runtime API, database schema, hosted service, or platform dependency is introduced.
