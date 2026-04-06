# 系统测试报告

生成时间: 2026-04-06

## 服务状态检查

### ✅ PostgreSQL 15
- 状态: 运行中
- 端口: 5432
- 数据库: wedding_planner
- 表结构: 已初始化 (4 张表)

```bash
# 验证命令
psql -U postgres -d wedding_planner -c "\dt"
# 应显示: users, couples, sync_events, token_blacklist
```

### ✅ 后端 API
- 状态: 运行中
- 地址: http://localhost:5174
- 健康检查:通过

```bash
curl http://localhost:5174/health
# 期望: {"status":"ok","timestamp":"..."}
```

### ✅ 前端 PWA
- 状态: 运行中
- 地址: http://localhost:5175
- Vite 开发服务器正常

```bash
curl http://localhost:5175 | head -5
# 应显示 HTML 文档
```

---

## 已知问题

### 1. 注册接口返回 "Server error"

**原因**: 可能数据库连接配置或 pg 模块问题

**排查**:
```bash
# 检查 .env 中的 DATABASE_URL
cat server/.env

# 应该是:
# DATABASE_URL=postgresql://postgres:@localhost:5432/wedding_planner
```

**临时解决**: 使用模拟登录测试 AI 功能（见下方）

---

## AI 功能测试步骤

### 快速测试（无需注册）

1. **修改 App.tsx 跳过登录**

编辑 `client/src/App.tsx`，替换第 8-11 行：

```typescript
// 原代码（删除或注释）:
// const [user, setUser] = useState<any>(null);
// const [couple, setCouple] = useState<any>(null);
// const [loading, setLoading] = useState(true);

// 替换为:
const [user, setUser] = useState({
  id: 'test-user',
  email: 'test@test.com',
  name: '测试用户'
});
const [couple, setCouple] = useState({
  id: 'test-couple',
  status: 'active',
  partner_a_name: '用户 A',
  partner_b_name: '用户 B'
});
const [loading, setLoading] = useState(false);
```

2. **访问应用**

打开 http://localhost:5175

3. **进入设置页面**

点击右上角 "⚙️ 设置"

4. **配置 AI 助手**

在 "🤖 AI 助手配置" 区域：
- Base URL: `https://api.yunjunet.cn`
- API Key: 从 [yunjunet.cn](https://api.yunjunet.cn) 申请
- 模型: `step-3.5-flash`

5. **测试功能**

- 点击「保存配置」✅
- 点击「测试连接」应显示 "✅ 连接成功"
- 在对话区域输入消息，点击「发送」

---

## 端口对照表

| 服务 | 端口 | 配置文件 |
|------|------|----------|
| PostgreSQL | 5432 | 自动安装 |
| 后端 API | 5174 | server/.env (PORT=5174) |
| 前端 Dev | 5175 | Vite 自动分配 |
| ��端 API 指向 | 5174 | client/vite.config.ts |

---

## 调试命令

### 查看后端日志
```bash
# 后端在后台运行，查看输出文件:
cat "C:/Users/Administrator/AppData/Local/Temp/claude/D--wedding-planner/cb7e7807-581d-4a06-bfb3-d7027a7dd257/tasks/b24jqfio4.output"
```

### 重启后端
```bash
cd wedding-planner/server
npm run dev
```

### 重启前端
```bash
cd wedding-planner/client
npm run dev
```

### 数据库操作
```bash
# 连接数据库
"C:\Program Files\PostgreSQL\15/bin/psql.exe" -U postgres -d wedding_planner

# 查看表
\dt

# 查看记录
SELECT * FROM users;
SELECT * FROM couples;

# 退出
\q
```

---

## 下一步开发建议

1. **修复注册功能** (优先级高)
   - 检查后端 auth.js 中的数据库连接
   - 确保 pg 模块正确安装
   - 添加更详细的错误日志

2. **AI 功能集成**
   - 在任务创建页面添加 AI 建议
   - 在预算页面添加智能分类

3. **测试自动化**
   - 编写单元测试 (Jest/Vitest)
   - 添加 E2E 测试

4. **部署准备**
   - 生产环境配置 (关闭 trust 认证)
   - 添加上下文路径支持
   - 构建优化

---

## 总结

✅ 系统核心已运行  
✅ 数据库已就绪  
✅ AI 配置功能完整  
⚠️  注册功能需调试

建议: 先用模拟登录方式测试 AI 对话功能，之后逐步修复注册流程。
