#!/bin/bash
echo "=== Wedding Planner 完整功能测试 ==="
echo "时间: $(date)"
echo ""

BASE="http://localhost:5174/api"
FRONTEND="http://localhost:5173"

# 测试后端健康
echo "1. 健康检查"
curl -s $BASE/../health | head -1
echo ""

# 测试注册
echo "2. 注册新用户"
REG_RESP=$(curl -s -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"qa_test@test.com","password":"Test123!","name":"QA Tester"}')
echo $REG_RESP | head -c 200
echo ""

# 提取 tokens
ACCESS_TOKEN=$(echo $REG_RESP | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
if [ -n "$ACCESS_TOKEN" ]; then
  echo "✅ 获取到 Access Token (长度: ${#ACCESS_TOKEN})"
else
  echo "❌ 未获取到 Token"
fi
echo ""

# 测试登录
echo "3. 登录测试"
LOGIN_RESP=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"qa_test@test.com","password":"Test123!"}')
echo $LOGIN_RESP | head -c 200
echo ""

# 测试获取 couple info
if [ -n "$ACCESS_TOKEN" ]; then
  echo "4. 获取用户信息 (带 Token)"
  curl -s -H "Authorization: Bearer $ACCESS_TOKEN" $BASE/couple/me | head -c 200
  echo ""
fi

# 测试前端页面
echo ""
echo "5. 前端页面检查"
echo "   首页: $FRONTEND"
curl -s $FRONTEND | grep -o '<title>[^<]*</title>' | head -1
echo ""

echo "6. 检查静态资源"
curl -s $FRONTEND/src/main.tsx | head -5 || echo "   main.tsx 可访问"
echo ""

echo "=== 测试完成 ==="
