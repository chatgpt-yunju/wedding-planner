# 配置 PostgreSQL 15 本地开发环境（免密）
# 需要以管理员身份运行

$ErrorActionPreference = "Stop"

Write-Host "=== PostgreSQL 本地开发配置 ===" -ForegroundColor Cyan
Write-Host

# 检查服务
$serviceName = "postgresql-15"
if (-not (Get-Service $serviceName -ErrorAction SilentlyContinue)) {
    Write-Error "PostgreSQL 服务未找到。请先安装 PostgreSQL 15。"
    exit 1
}

# 停止服务
Write-Host "正在停止 PostgreSQL 服务..." -ForegroundColor Yellow
Stop-Service $serviceName -Force
Write-Host "服务已停止"
Write-Host

# 备份并修改 pg_hba.conf
$pgData = "C:\Program Files\PostgreSQL\15\data"
$pgHba = Join-Path $pgData "pg_hba.conf"

if (-not (Test-Path $pgHba)) {
    Write-Error "找不到 pg_hba.conf，请确认 PostgreSQL 安装路径正确。"
    exit 1
}

Write-Host "备份 pg_hba.conf..."
Copy-Item $pgHba "$pgHba.bak" -Force

Write-Host "修改认证方法为 trust（本地开发用）..."
(Get-Content $pgHba) -replace 'scram-sha-256', 'trust' | Set-Content $pgHba

Write-Host "✅ 配置已更新"
Write-Host

# 启动服务
Write-Host "正在启动 PostgreSQL 服务..." -ForegroundColor Yellow
Start-Service $serviceName
Write-Host "服务已启动"
Write-Host

# 等待服务完全启动
Start-Sleep -Seconds 3

# 创建数据库
Write-Host "创建 wedding_planner 数据库..." -ForegroundColor Yellow
$createdb = Join-Path $pgData "..\bin\createdb.exe"
& $createdb -U postgres wedding_planner 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 数据库创建成功"
} else {
    Write-Host "⚠️  数据库可能已存在"
}

Write-Host
Write-Host "初始化表结构..."
$psql = Join-Path $pgData "..\bin\psql.exe"
$schema = Join-Path (Get-Location) "server\src\db\schema.sql"
& $psql -U postgres -d wedding_planner -f $schema 2>&1 | ForEach-Object { Write-Host $_ }

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 表结构创建完成！" -ForegroundColor Green
} else {
    Write-Host "❌ 表结构创建失败" -ForegroundColor Red
    exit 1
}

Write-Host
Write-Host "=== 配置完成 ===" -ForegroundColor Green
Write-Host
Write-Host "数据库连接信息："
Write-Host "  URL: postgresql://postgres:@localhost:5432/wedding_planner"
Write-Host
Write-Host "下一步："
Write-Host "1. 在项目目录运行: cd server && npm run dev"
Write-Host "2. 前端访问: http://localhost:5173"
Write-Host
Write-Host "注意：此配置仅用于本地开发！生产环境必须使用密码认证。" -ForegroundColor Yellow
