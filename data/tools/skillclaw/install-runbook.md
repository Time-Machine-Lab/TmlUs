# SkillClaw 安装 Runbook

目标：指导 Agent 完成 SkillClaw 的安装、`skillclaw setup` 初始化、最小验证和安装结果交付。

边界：只处理安装与初始化；不要处理日常使用、Skill 拉取、进化、验证审批或 TmlUs 功能说明。

## 使用规则

- 按章节顺序执行。
- 如果用户同时提供团队配置指南，团队配置指南中的团队约定优先于本 Runbook 的通用默认值。
- 只展开用户选择的配置模块。
- 不打印完整密钥、Token、Access Key 或连接串。
- 修改已有配置前先备份。
- 命令不存在时先用 `skillclaw --help` 查找等价命令，不要猜测危险命令。

## 1. 确认安装范围

先向用户确认本次安装要启用哪些模块：

```text
必选：安装 SkillClaw CLI
可选：配置 client proxy
可选：配置远端会话/Skill 存储
可选：连接已有 Evolve Server
可选：开启本地 Dashboard
```

未选择的模块不要收集信息，也不要写入配置。

## 2. 前置检查

识别当前系统与 Shell：

```text
os: windows | macos | linux
shell: powershell | bash | zsh | other
install_dir: ~/.tmlus/tools/skillclaw
config_path: ~/.skillclaw/config.yaml
```

检查依赖：

```bash
git --version
python --version
python3 --version
```

如果 `~/.tmlus/tools/skillclaw` 已存在，先询问用户选择：

```text
reuse：复用已有目录
update：更新已有目录
reinstall：备份后重装
```

## 3. 收集 setup 信息

### 3.1 基础信息

```yaml
install_dir: "~/.tmlus/tools/skillclaw"
python_command: "python | python3"
config_path: "~/.skillclaw/config.yaml"
```

### 3.2 client proxy（仅在用户选择时）

```yaml
client_proxy:
  upstream_base_url: "<原模型服务 API base url>"
  upstream_api_key: "<secret>"
  upstream_model: "<model>"
  proxy_host: "127.0.0.1"
  proxy_port: 30000
  served_model_name: "skillclaw-model"
  daemon: true | false
```

询问用户是否希望后台运行；如果开启后台运行，不要打开额外终端窗口。

### 3.3 远端会话/Skill 存储（仅在用户选择时）

```yaml
sharing:
  backend: "oss | s3 | other"
  endpoint: "<endpoint>"
  bucket: "<bucket>"
  prefix: "<optional path prefix>"
  group_id: "<team or workspace id>"
  access_key_id: "<secret>"
  access_key_secret: "<secret>"
```

### 3.4 已有 Evolve Server（仅在用户选择时）

```yaml
evolve_server:
  base_url: "<https://...>"
  auth_token: "<optional secret>"
  status_endpoint: "/status"
```

如果用户没有已有 Evolve Server，本 Runbook 不负责部署，只记录为未配置。

### 3.5 本地 Dashboard（仅在用户选择时）

```yaml
dashboard:
  enabled: true | false
  host: "127.0.0.1"
  port: 3788
  evolve_server_base_url: "<与 evolve_server.base_url 保持一致>"
```

如果用户启用 Dashboard 且已配置 Evolve Server，必须把 Dashboard 指向该 Evolve Server。不要把 Dashboard 监听地址暴露到公网或局域网。

## 4. 安装 SkillClaw

### Windows PowerShell

```powershell
$InstallDir = Join-Path $env:USERPROFILE ".tmlus\tools\skillclaw"
git clone https://github.com/AMAP-ML/SkillClaw $InstallDir
Set-Location $InstallDir
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -U pip
python -m pip install -e ".[evolve,sharing,server]"
.\.venv\Scripts\skillclaw.exe --help
```

### macOS / Linux

```bash
INSTALL_DIR="$HOME/.tmlus/tools/skillclaw"
git clone https://github.com/AMAP-ML/SkillClaw "$INSTALL_DIR"
cd "$INSTALL_DIR"
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -U pip
python -m pip install -e ".[evolve,sharing,server]"
.venv/bin/skillclaw --help
```

如果仓库安装文档给出了更新的安装命令，优先使用仓库安装文档，并在交付摘要中说明差异。

## 5. 初始化配置

优先运行交互式初始化：

```bash
skillclaw setup
```

使用第 3 节收集的信息回答 setup 问题。

如果 setup 未覆盖必要字段，再编辑配置文件：

```text
~/.skillclaw/config.yaml
```

编辑要求：

- 只写入用户选择启用的模块。
- 如果启用 Dashboard，写入 dashboard 配置，并确保 dashboard 的 Evolve Server 地址与第 3.4 节一致。
- 备份已有配置，例如 `config.yaml.bak.<timestamp>`。
- 不在聊天记录中展示完整 secret。

## 6. 最小验证

通用验证：

```bash
skillclaw --help
skillclaw status
```

如果启用 client proxy：

```bash
skillclaw start --daemon
skillclaw status
```

daemon 验证要求：

- 不要用进程命令行是否包含 `--daemon` 判断是否 daemon 成功；SkillClaw 的 daemon 子进程可能显示为 `python -m skillclaw start`。
- 以 `skillclaw status`、`~/.skillclaw/skillclaw.pid`、健康检查和是否没有用户可见终端为准。
- 如果 `skillclaw start --daemon` 返回成功但留下可见终端或需要保持当前 Shell 才能运行，视为 daemon 未达标。

再检查本地健康地址：

```text
http://127.0.0.1:<proxy_port>/healthz
```

如果启用远端存储，执行 SkillClaw 支持的最小连接检查；如果没有专用命令，只验证配置存在且凭证未明文输出。

如果连接已有 Evolve Server：

```bash
curl <evolve_server.base_url><status_endpoint>
```

如果启用 Dashboard：

```text
检查 Dashboard 配置存在。
如当前 SkillClaw 版本提供 dashboard 启动/状态命令，运行对应命令。
访问 http://127.0.0.1:<dashboard_port> 或记录“已配置，未启动/未检查”。
```

## 7. 交付结果

同时写入安装摘要：

```text
~/.tmlus/env/skillclaw/install-summary.md
```

摘要用于后续 Agent 使用 SkillClaw 时读取。可以写入服务地址、开关状态和配置文件路径；不要写入完整 secret。

安装结束时只用最精简方式回复以下四块，不输出完整密钥：

```yaml
安装情况:
  status: "passed | partial | failed"
  skillclaw_cli: "<path>"
evolve_server:
  url: "<url or empty>"
  health: "passed | partial | failed | not_checked"
client_proxy:
  url: "http://127.0.0.1:<proxy_port>/v1"
  daemon: true | false
  codex_enabled: true | false
local_dashboard:
  url: "http://127.0.0.1:<dashboard_port>"
  enabled: true | false
```
