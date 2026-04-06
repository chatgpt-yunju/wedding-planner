# 备婚助手 - AI 功能测试指南

## 当前状态

- ✅ 前端开发服务器运行在 `http://localhost:5173`
- ⚠️ 后端需要 PostgreSQL 数据库（未配置）

## 快速测试 AI 配置功能（无后端可用时）

由于 AI 配置功能完全存储在客户端 IndexedDB 中，你可以通过以下方式测试：

### 方法 1: 临时绕过登录（推荐用于快速 UI 测试）

1. 打开 `client/src/App.tsx`
2. 修改代码，模拟已登录状态：

找到第 21-35 行，将 `validateToken` 逻辑简化为直接设置用户状态：

```typescript
function App() {
  const [user, setUser] = useState<any>(() => {
    // 临时模拟登录状态
    return {
      id: 'test-user-1',
      email: 'test@test.com',
      name: '测试用户'
    };
  });
  const [couple, setCouple] = useState<any>(() => {
    return {
      id: 'test-couple-1',
      partner_a_id: 'test-user-1',
      status: 'active',
      partner_a_name: '测试用户 A',
      partner_b_name: '测试用户 B'
    };
  });
  // ... 其余代码
```

3. 重启前端，直接进入仪表盘
4. 点击导航栏的设置⚙️，即可看到 AI 助手配置区域

### 方法 2: 完整测试流程（需要数据库）

#### 1. 准备 PostgreSQL 数据库

**Windows (使用 Docker):**
```bash
docker run -d \
  --name wedding-db \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=wedding_planner \
  postgres:15
```

**Windows (直接安装):**
- 下载并安装 PostgreSQL 15+
- 创建数据库: `createdb wedding_planner`
- 运行 schema: `psql -U postgres -d wedding_planner -f server/src/db/schema.sql`

#### 2. 初始化表结构

```bash
cd server
npm run db:migrate
# 或手动:
# psql -U postgres -d wedding_planner -f src/db/schema.sql
```

#### 3. 启动后端

```bash
cd server
npm run dev
# 服务运行在 http://localhost:3000
```

#### 4. 启动前端（如果还没启动）

```bash
cd client
npm run dev
```

#### 5. 测试 AI 配置功能

1. 访问 `http://localhost:5173`
2. 注册两个用户并完成配对（见下方详细步骤）
3. 登录后进入「设置」页面
4. 配置 AI 助手：
   - API Base URL: `https://api.yunjunet.cn`
   - API Key: 从 [yunjunet.cn](https://api.yunjunet.cn) 申请
   - 模型: `step-3.5-flash`
5. 点击「保存配置」
6. 点击「测试连接」验证
7. 在对话测试区域输入消息，测试 AI 回复

## 详细手动测试步骤

### 测试用户注册与配对

1. 打开两个浏览器标签页（或无痕窗口）
2. **标签页 A** - 注册用户 A:
   - 邮箱: `alice@test.com`
   - 密码: `password123`
   - 姓名: `Alice`
   - 点击「注册」
3. **标签页 B** - 注册用户 B:
   - 邮箱: `bob@test.com`
   - 密码: `password123`
   - 姓名: `Bob`
   - 点击「注册」
4. **标签页 A** - 生成邀请码:
   - 登录 Alice 账户
   - 在仪表盘点击「配对」或「邀请」按钮
   - 复制显示的邀请码
5. **标签页 B** - 加入配对:
   - 登录 Bob 账户
   - 输入邀请码并点击「加入配对」
   - 配对成功后，状态变为「已配对」

### 测试 AI 配置同步

由于 AI 配置存储在本地 IndexedDB，不会通过后端同步，每个客户端需要单独配置。

## 测试检查清单

- [ ] 设置页面正常显示
- [ ] AI 配置区域紫色主题正确
- [ ] 默认值已填充（Base URL、模型名称）
- [ ] 输入 API Key 后可保存（保存后显示成功提示）
- [ ] 测试连接功能正常（成功/失败有明确提示）
- [ ] AI 对话测试：发送消息后收到回复
- [ ] API Key 保存到 IndexedDB 后刷新页面不丢失
- [ ] 配置错误时的错误提示清晰

## 预期行为

### 保存配置
- 点击「保存配置」后 3 秒内显示 ✅ 提示
- 提示消失后无残留 UI 痕迹

### 测试连接
- 无 API Key 时：显示错误提示「请先输入 API Key」
- 无效 Key/URL：显示具体错误信息（如认证失败、网络错误）
- 有效配置：显示「✅ 连接成功」

### AI 对话
- 发送消息时按钮显示「发送中...」并禁用
- 收到回复后显示在灰色背景区域
- 错误时显示「❌ 错误: <具体信息>」

## 常见问题

**Q: 前端启动后无法连接到后端**
A: 确保后端已启动在 http://localhost:3000，且 CORS 允许 http://localhost:5173。

**Q: 数据库连接失败**
A: 检查 PostgreSQL 是否运行，`DATABASE_URL` 是否正确。可在 `server/.env` 中调整。

**Q: AI 配置保存后重启丢失**
A: 检查浏览器是否禁用了 IndexedDB，或是否有隐私模式导致存储被清除。

**Q: 测试连接超时**
A: 检查网络连接，确认 `https://api.yunjunet.cn` 可访问。

## 下一步开发建议

- 在任务创建页面添加 AI 辅助功能（如智能标题建议）
- 在预算、嘉宾管理等模块集成 AI
- 添加 AI 对话历史记录功能
- 支持多轮对话上下文
- 后端验证和代理 AI 请求（避免前端暴露 key）
