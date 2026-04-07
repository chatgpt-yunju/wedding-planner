#!/bin/bash
# 初始化 PostgreSQL 数据库并创建 wedding_planner 数据库

PG_BIN="/c/Program Files/PostgreSQL/15/bin"

echo "=== PostgreSQL 数据库初始化 ==="
echo

# 检查数据目录是否存在
if [ ! -d "/c/Program Files/PostgreSQL/15/data" ]; then
    echo "正在初始化数据库集群..."
    "$PG_BIN/initdb.exe" -D "/c/Program Files/PostgreSQL/15/data" -U postgres --encoding=UTF8 --locale=english
    echo "✅ 数据库集群初始化完成"
else
    echo "数据目录已存在，跳过初始化"
fi

# 启动 PostgreSQL 服务
echo "正在启动 PostgreSQL 服务..."
net start postgresql-15 2>/dev/null || echo "服务可能已在运行"

# 等待服务启动
sleep 3

# 创建数据库
echo "创建 wedding_planner 数据库..."
"$PG_BIN/createdb.exe" -U postgres wedding_planner 2>/dev/null && echo "✅ 数据库创建成功" || echo "⚠️  数据库可能已存在"

# 执行 schema.sql
echo "初始化表结构..."
cd wedding-planner/server
"$PG_BIN/psql.exe" -U postgres -d wedding_planner -f src/db/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ 表结构创建完成！"
    echo
    echo "=== 配置完成 ==="
    echo
    echo "下一步："
    echo "1. 启动后端: cd server && npm run dev"
    echo "2. 前端已在 http://localhost:5173"
else
    echo "❌ 表结构创建失败"
fi
