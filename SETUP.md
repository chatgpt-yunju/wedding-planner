# PostgreSQL 配置指南

由于备婚软件需要 PostgreSQL 数据库，请按以下步骤配置。

## 自动配置（推荐）

运行提供的批处理脚本：

```bash
# 右键点击 SETUP_POSTGRESQL.bat，选择"以管理员身份运行"
```

脚本会自动：
1. 通过 winget 安装 PostgreSQL 15（如果未安装）
2. 初始化数据库集群
3. 启动 PostgreSQL 服务
4. 创建 `wedding_planner` 数据库
5. 执行 `server/src/db/schema.sql` 创建表结构

## 手动配置

### Windows

#### 1. 安装 PostgreSQL

**方法 A: 使用 winget（推荐）**
```powershell
winget install --id PostgreSQL.PostgreSQL.15
```

**方法 B: 下载安装包**
- 访问 https://www.postgresql.org/download/windows/
- 下载 PostgreSQL 15+ 的 Windows 安装程序
- 运行安装程序，记住设置的密码（默认 `postgres`）

#### 2. 创建数据库

```powershell
# 打开 PowerShell 或 cmd
createdb wedding_planner
# 或使用 psql:
psql -U postgres -c "CREATE DATABASE wedding_planner;"
```

#### 3. 初始化表结构

```powershell
cd server
psql -U postgres -d wedding_planner -f src/db/schema.sql
```

#### 4. 配置环境变量

编辑 `server/.env` 文件：

```env
DATABASE_URL=postgresql://postgres:你的密码@localhost:5432/wedding_planner
JWT_ACCESS_SECRET=dev-access-secret-change-this-in-production-12345
JWT_REFRESH_SECRET=dev-refresh-secret-change-this-too-67890
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

#### 5. 启动服务

```powershell
cd server
npm run dev
```

服务将在 http://localhost:3000 启动。

### macOS / Linux

#### 1. 安装 PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### 2. 创建数据库

```bash
sudo -u postgres createdb wedding_planner
```

#### 3. 初始化表结构

```bash
cd server
psql -U postgres -d wedding_planner -f src/db/schema.sql
```

#### 4. 配置和启动

同 Windows 步骤 4-5。

## 验证安装

测试数据库连接：

```bash
psql -U postgres -d wedding_planner -c "\dt"
```

应该看到以下表：
- users
- couples
- sync_events
- ...

## 启动完整应用

### 终端 1: 后端

```bash
cd server
npm run dev
```

### 终端 2: 前端

```bash
cd client
npm run dev
```

访问 http://localhost:5173

## 故障排除

### 错误: `psql: command not found`
- **解决**: 将 PostgreSQL 的 bin 目录添加到 PATH
  - Windows: `C:\Program Files\PostgreSQL\15\bin`
  - macOS: `/usr/local/opt/postgresql@15/bin`

### 错误: `Connection refused`
- **解决**: 确保 PostgreSQL 服务已启动
  - Windows: 在服务管理器中启动 `postgresql-15`
  - macOS: `brew services start postgresql@15`
  - Linux: `sudo systemctl start postgresql`

### 错误: `database "wedding_planner" does not exist`
- **解决**: 运行 `createdb wedding_planner`

### 错误: `password authentication failed`
- **解决**: 检查 `DATABASE_URL` 中的密码是否正确。默认密码是安装时设置的。

## 重置数据库

如果需要重新初始化：

```bash
# 删除数据库
dropdb wedding_planner
# 重新创建
createdb wedding_planner
# 重新运行 schema
cd server
psql -U postgres -d wedding_planner -f src/db/schema.sql
```

## 下一步

数据库就绪后，参考 `TESTING.md` 进行完整的功能测试。
