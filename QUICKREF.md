# 快速启动参考

## 当前状态

✅ **前端已启动**: http://localhost:5173
✅ **AI 助手功能已添加**: 配置界面在设置页面
⚠️  **PostgreSQL 未完全配置**: 需要完成最后步骤

## 快速完成配置

### 方案 A: 一键配置（推荐）

1. 打开 PowerShell（**以管理员身份运行**）
2. 执行：
```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
.\QuickStartPostgreSQL.ps1
```

### 方案 B: 手动配置（如果 A 失败）

1. 以管理员打开 PowerShell
2. 停止服务：
```powershell
net stop postgresql-15
```
3. 修改配置文件（允许免密）：
```powershell
$pgData = "C:\Program Files\PostgreSQL\15\data"
$pgHba = "$pgData\pg_hba.conf"
(Get-Content $pgHba) -replace 'scram-sha-256', 'trust' | Set-Content $pgHba
```
4. 启动服务：
```powershell
net start postgresql-15
```
5. 创建数据库：
```powershell
"C:\Program Files\PostgreSQL\15\bin\createdb.exe" -U postgres wedding_planner
```
6. 初始化表结构：
```powershell
cd wedding-planner/wedding-planner/server
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d wedding_planner -f src/db/schema.sql
```

## 测试 AI 配置

### 方式 1: 快速 UI 测试（无需数据库）

1. 打开 `client/src/App.tsx`
2. 替换第 8-11 行，使用模拟数据：
```typescript
const [user, setUser] = useState({
  id: 'test-user-1',
  email: 'test@test.com',
  name: '测试'
});
const [couple, setCouple] = useState({
  id: 'test-couple-1',
  status: 'active'
});
```
3. 重启前端
4. 访问 http://localhost:5173 → 设置页面
5. 配置 AI（填入 yunjunet.cn 的 API Key）
6. 测试对话功能

### 方式 2: 完整测试（需数据库配置完成）

1. 完成上面的 PostgreSQL 配置
2. 启动后端（新终端）：
```bash
cd server
npm run dev
```
3. 访问 http://localhost:5173
4. 注册两个用户并配对
5. 进入设置，配置 AI 助手
6. 测试对话

## AI 功能说明

- **位置**: 设置 ⚙️ 页面
- **配置项**:
  - Base URL: `https://api.yunjunet.cn`（默认）
  - API Key: 从 yunjunet.cn 申请
  - 模型: `step-3.5-flash`（默认）
- **特性**:
  - 配置存储在本地 IndexedDB
  - 连接测试按钮
  - 内置对话测试界面
  - 安全：API Key 不会发送到您自己的后端

## 文件清单

- ✅ `client/src/lib/anthropic.ts` - AI API 封装
- ✅ `client/src/db/index.ts` - 新增 AIConfig 表
- ✅ `client/src/features/settings/SettingsPage.tsx` - 配置 UI
- ✅ `TESTING.md` - 详细测试指南
- ✅ `SETUP.md` - PostgreSQL 配置指南
- ✅ `QuickStartPostgreSQL.ps1` - 一键配置脚本
- ✅ `CLAUDE.md` - Claude Code 配置指南

## 故障排除

**前端无法访问**
- 检查 http://localhost:5173 是否运行
- 重启: `cd client && npm run dev`

**后端无法启动**
- 检查 PostgreSQL 是否运行: `net start postgresql-15`
- 检查数据库是否存在: `psql -U postgres -l`
- 检查 .env 配置

**AI 连接失败**
- 检查 API Key 是否正确
- 检查网络是否能访问 https://api.yunjunet.cn
- 确认 Base URL 包含完整路径（包括 /v1）
