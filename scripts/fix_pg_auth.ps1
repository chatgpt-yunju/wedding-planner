# 设置 PostgreSQL 为本地信任认证（开发用）
$ErrorActionPreference = "Stop"

$pgData = "C:\Program Files\PostgreSQL\15\data"
$pgHba = Join-Path $pgData "pg_hba.conf"

Write-Host "修改 pg_hba.conf 为信任认证..."

# 读取并替换
$lines = Get-Content $pgHba
$modified = $false
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match 'scram-sha-256') {
        $lines[$i] = $lines[$i] -replace 'scram-sha-256', 'trust'
        $modified = $true
    }
}

if ($modified) {
    Set-Content $pgHba $lines
    Write-Host "✅ 已更新认证方法为 trust"
} else {
    Write-Warning "未找到 scram-sha-256，可能已配置过"
}

# 重启服务
Write-Host "重启 PostgreSQL 服务..."
Restart-Service postgresql-x64-15 -Force
Start-Sleep -Seconds 3

# 尝试创建数据库
Write-Host "创建 wedding_planner 数据库..."
$createdb = Join-Path $pgData "..\bin\createdb.exe"
& $createdb -U postgres wedding_planner 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 数据库创建成功"
} else {
    Write-Host "⚠️  数据库可能已存在，继续..."
}

# 初始化表结构
Write-Host "执行 schema.sql..."
$psql = Join-Path $pgData "..\bin\psql.exe"
$schema = Join-Path (Get-Location) "wedding-planner\server\src\db\schema.sql"

& $psql -U postgres -d wedding_planner -f $schema | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 表结构初始化完成"
} else {
    Write-Error "schema 执行失败"
}

Write-Host "`n=== 完成 ==="
Write-Host "连接 URL: postgresql://postgres:@localhost:5432/wedding_planner"
