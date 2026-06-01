# TmlUs

> TML AI development workspace initializer and toolkit.
> Open the terminal, summon the project console, and let the AI development party start. (o^▽^o)

[![npm](https://img.shields.io/npm/v/@time-machine-lab/tmlus?style=for-the-badge&logo=npm&label=npm)](https://www.npmjs.com/package/@time-machine-lab/tmlus)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-5FA04E?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-FF8AC8?style=for-the-badge)](LICENSE)
[![CLI](https://img.shields.io/badge/CLI-tmlus-7C3AED?style=for-the-badge)](tmlus-core)

TmlUs 是 TML 团队的 AI 开发工作台。它把项目初始化、AI IDE 环境准备、TML 文档结构、OpenSpec 工作模式、Skill 发现与安装这些零散动作，收束成一个可复制的本地 CLI 流程。

适合想要快速进入 TML AI 开发节奏的项目发起者、AI 驱动开发者和团队规范维护者。它的目标很简单：让新项目从第一分钟开始，就拥有整齐的文档、清晰的规范和随时待命的 AI 协作能力。

## 功能魔法书

完整命令说明见 [TmlUs 命令 Wiki](docs/TmlUs命令Wiki.md)。

| 入口 | 它会做什么 | 适合什么时候使用 |
|------|------------|------------------|
| `tmlus init` | 按步骤引导初始化项目工作区、AI IDE、TML Docs、Skills 和工作模式 | 新项目开局，想一次性把基础设施摆整齐 |
| `tmlus ide` | 检测并初始化 Codex、Claude Code、Cursor、Trae、CodeBuddy 等 AI IDE 所需目录 | 给当前项目补齐 AI IDE 协作环境 |
| `tmlus tml-spec` | 创建或修复 `docs/`、`docs/design/`、`docs/spec/` 等 TML 文档目录 | 项目需要接入 TML 文档规范 |
| `tmlus skills` | 浏览、选择并安装 TML 维护的 AI Skills | 想给 Agent 装上团队认可的能力包 |
| `tmlus skills search` | 从远程来源搜索可安装 Skill | 本地目录不够用，想探索新的 Skill |
| `tmlus tools` | 浏览并安装 TmlUs 维护的外部工具适配，例如 CodeGraph | 想给 Agent 接入本地代码索引或外部工具 |
| `tmlus work-mode openspec` | 为当前项目初始化 OpenSpec 工作模式 | 需要用提案、规格和任务驱动开发 |
| `tmlus help` | 查看所有命令说明和示例 | 忘记咒语时快速翻书 |
| `tmlus version` | 输出当前 CLI 版本 | 检查本地安装版本 |

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) >= 20
- npm >= 10
- Git >= 2.40

### 从 npm 使用

```bash
# 不安装到全局，直接召唤一次
npx @time-machine-lab/tmlus help

# 或者安装为全局命令
npm install -g @time-machine-lab/tmlus
tmlus help
```

### 从源码运行

```bash
git clone https://github.com/Time-Machine-Lab/TmlUs.git
cd TmlUs/tmlus-core
npm ci
npm run build
npm start -- help
```

### 初始化一个项目

在你想要接入 TML AI 开发规范的项目根目录执行：

```bash
tmlus init
```

如果你只想补某一块能力，可以直接使用对应入口：

```bash
# 初始化 TML 文档目录
tmlus tml-spec

# 为 Codex 和 Cursor 准备 AI IDE 环境
tmlus ide codex,cursor

# 安装指定 Skill
tmlus skills tml-docs-spec-generate --ide codex

# 初始化 OpenSpec 工作模式
tmlus work-mode openspec --ide codex
```

预期结果：终端会输出初始化摘要；当前项目中会出现或修复对应目录、配置和 Skill 文件。小小工作台，就绪啦。

## 常见问题 (FAQ)

**Q: 使用 `npm install -g @time-machine-lab/tmlus` 时报错 404 Not Found (npmmirror)?**

**A:** 这是因为如果你配置了淘宝镜像源 (`npmmirror`)，而包刚刚发布，镜像源可能还未同步。你可以通过以下方式快速解决：

- **方式一（推荐）**：临时使用 npm 官方源安装
  ```bash
  npm install -g @time-machine-lab/tmlus --registry=https://registry.npmjs.org/
  ```
- **方式二**：前往 [npmmirror 页面](https://npmmirror.com/sync/@time-machine-lab/tmlus) 手动点击“同步”，等待同步完成后再次尝试安装。
