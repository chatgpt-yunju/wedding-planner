# 快速配置 PostgreSQL 本地开发（一键式）
# 用法: 以管理员身份运行此脚本

$ErrorActionPreference = "Stop"

$pgData = "C:\Program Files\PostgreSQL\15\data"
$pgHba = "$pgData\pg_hba.conf"

Write-Host "`n=== PostgreSQL 本地开发快速配置 ===`n" -ForegroundColor Cyan

# 1. 停止服务
Write-Host "1. 停止 PostgreSQL 服务..."
Stop-Service postgresql-15 -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. 修改认证为 trust（开发用）
if (Test-Path $pgHba) {
    Write-Host "2. 修改 pg_hba.conf 为 trust 认证..."
    $content = Get-Content $pgHba
    $backup = $content -join "`n"
    Set-Content "$pgHba.bak" $backup

    $new = $content -replace 'scram-sha-256', 'trust'
    Set-Content $pgHba $new
    Write-Host "   已备份原配置到 pg_hba.conf.bak"
} else {
    Write-Error "找不到 PostgreSQL 配置文件：$pgHba"
    exit 1
}

# 3. 启动服务
Write-Host "3. 启动 PostgreSQL 服务..."
Start-Service postgresql-15
Start-Sleep -Seconds 3

# 4. 创建数据库
Write-Host "4. 创建 wedding_planner 数据库..."
& "C:\Program Files\PostgreSQL\15\bin\createdb.exe" -U postgres wedding_planner 2>$null
if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 1) {
    Write-Host "   ✅ 数据库已就绪"
}

# 5. 初始化表结构
Write-Host "5. 初始化表结构..."
cd wedding-planner/wedding-planner/server
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d wedding_planner -f src/db/schema.sql | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ 表结构创建完成"
} else {
    Write-Error "表结构创建失败"
    exit 1
}

Write-Host "`n=== ✅ 全部完成 ===" -ForegroundColor Green
Write-Host "`n连接信息:"
Write-Host "  DATABASE_URL=postgresql://postgres:@localhost:5432/wedding_planner"
Write-Host "`n启动应用:"
Write-Host "  后端: cd server && npm run dev"
Write-Host "  前端: cd client && npm run dev (已在 http://localhost:5173)"
Write-Host "`n注意: 此配置仅用于本地开发！`n" -ForegroundColor Yellow
