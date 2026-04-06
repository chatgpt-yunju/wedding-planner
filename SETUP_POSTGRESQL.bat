@echo off
REM 自动安装和配置 PostgreSQL 15 的脚本
REM 需要以管理员身份运行

echo ========================================
echo  PostgreSQL 自动配置脚本
echo ========================================
echo.

REM 检查是否以管理员身份运行
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 错误：请以管理员身份运行此脚本！
    pause
    exit /b 1
)

REM 检查是否已安装 PostgreSQL
where psql >nul 2>&1
if %errorLevel% equ 0 (
    echo PostgreSQL 已安装，跳过安装步骤。
    goto :after_install
)

echo 正在通过 winget 安装 PostgreSQL 15...
echo.
winget install --id PostgreSQL.PostgreSQL.15 --accept-package-agreements --accept-source-agreements --silent --accept-source-agreements
if %errorLevel% neq 0 (
    echo PostgreSQL 安装失败。请手动安装后重试。
    pause
    exit /b 1
)

:after_install

REM 将 PostgreSQL bin 添加到 PATH（临时）
set PATH=C:\Program Files\PostgreSQL\15\bin;%PATH%

echo.
echo 正在初始化数据库...
echo.
REM 使用 initdb 初始化数据库
"C:\Program Files\PostgreSQL\15\bin\initdb.exe" -D "C:\Program Files\PostgreSQL\15\data" -U postgres --encoding=UTF8 --locale=english

if %errorLevel% neq 0 (
    echo 数据库初始化可能已执行，继续...
)

REM 启动 PostgreSQL 服务
echo.
echo 正在启动 PostgreSQL 服务...
net start postgresql-15
if %errorLevel% neq 0 (
    echo 服务可能已在运行，继续...
)

echo.
echo 正在创建 wedding_planner 数据库...
echo.

REM 创建数据库
psql -U postgres -c "CREATE DATABASE wedding_planner;" 2>nul
if %errorLevel% neq 0 (
    echo 数据库可能已存在，继续...
) else (
    echo 数据库 wedding_planner 创建成功！
)

REM 执行 schema.sql
echo.
echo 正在创建表结构...
cd server
psql -U postgres -d wedding_planner -f src/db/schema.sql

if %errorLevel% equ 0 (
    echo.
    echo ========================================
    echo  ✅ PostgreSQL 配置完成！
    echo ========================================
    echo.
    echo 下一步：
    echo 1. 启动后端： cd server && npm run dev
    echo 2. 前端已在 http://localhost:5173
    echo.
) else (
    echo.
    echo 请手动执行：psql -U postgres -d wedding_planner -f server/src/db/schema.sql
)

pause
