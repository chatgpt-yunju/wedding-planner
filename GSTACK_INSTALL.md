# gstack 安装指南

gstack 是一个强大的浏览器自动化测试工具，用于 QA 和站点测试。需要 Bun 运行时。

## 当前状态

- ✅ gstack 仓库已克隆到 `~/.claude/skills/gstack`
- ⏳ Bun 已下载但未完全配置
- ⏳ gstack 安装暂停在 setup 步骤

## 完成安装（3 步）

### 1. 完成 Bun 安装

Bun 安装脚本已下载，但需要手动完成：

```bash
# 解压并安装 Bun
cd ~
# 应已下载 bun.zip 到 ~/.bun/bin/
# 解压（如果还没解压）
unzip ~/.bun/bin/bun.zip -d ~/.bun/bin/
# 或如果已经解压，bun 可执��文件应在:
ls ~/.bun/bin/bun.exe
```

然后添加到 PATH：

```bash
# 添加到 ~/.bashrc 或 ~/.bash_profile
echo 'export BUN_PATH="$HOME/.bun/bin"' >> ~/.bashrc
echo 'export PATH="$BUN_PATH:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

验证：
```bash
bun --version
# 应输出: 1.3.10 (或类似)
```

### 2. 运行 gstack setup

```bash
cd ~/.claude/skills/gstack
./setup
```

setup 会：
- 安装依赖 (`bun install`)
- 构建工具
- 配置 Claude Code 集成

### 3. 验证安装

```bash
# 检查技能是否可用
cd ~/.claude/skills/gstack
bun run bin/gstack-cli.ts --help
```

或在 Claude Code 中尝试：
```
/browse --help
/qa --help
```

---

## 快速测试 gstack

安装完成后，可以测试：

```bash
# 1. 启动浏览器测试
/browse http://localhost:5175

# 2. 运行 QA 测试
/qa http://localhost:5175

# 3. 截图比较
/browse --screenshot before.png
# ...做些操作...
/browse --screenshot after.png
/browse --diff before.png after.png
```

---

## 可选：添加到项目 CLAUDE.md

为了让团队成员也能使用 gstack，在你的项目 `CLAUDE.md` 中添加：

```markdown
## Skills

This project uses gstack for browser automation and QA testing:

- `/browse` - Navigate pages, interact with elements, take screenshots
- `/qa` - Automated QA testing
- `/design-review` - UI/UX review with screenshots
- `/review` - Code review automation
- ...

Install: `git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup`
```

---

## 故障排除

### "bun: command not found"
- 确保 `~/.bun/bin/bun` 存在且可执行
- 检查 PATH 设置

### "Error: Cannot find module '...'"
- 运行 `./setup` 安装依赖

### Windows 特定问题
- 确保使用 Git Bash 或 WSL
- 如果使用 PowerShell，可能需要调整脚本执行策略

---

## 跳过 gstack 直接测试 AI 功能

不需要 gstack 也可以测试本项目的 AI 功能：

1. 访问 http://localhost:5175
2. 进入 ⚙️ 设置 → 🤖 AI 助手配置
3. 填入 API Key 测试

---

## 参考

- gstack README: `~/.claude/skills/gstack/README.md`
- gstack SKILL.md: `~/.claude/skills/gstack/SKILL.md`
- 在线文档: https://github.com/garrytan/gstack
