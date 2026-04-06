# ✅ 系统配置完成

## 服务状态

| 服务 | 状态 | 地址 | 说明 |
|------|------|------|------|
| PostgreSQL 15 | ✅ 运行 | localhost:5432 | 数据库已就绪 |
| 后端 API | ✅ 运行 | http://localhost:5174 | Express + Socket.io |
| 前端 PWA | ✅ 运行 | http://localhost:5175 | React + Vite |

## 快速测试 AI 功能

### 方法 1: 模拟登录（推荐，30 秒即可）

由于需要完整注册流程，你可以快速跳过登录：

1. 打开 `client/src/App.tsx`
2. 找到第 8-11 行，替换为：

```typescript
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
```

3. 保存后访问 http://localhost:5175
4. 点击右上角 "⚙️ 设置"
5. 在 "🤖 AI 助手配置" 区域：
   - Base URL: `https://api.yunjunet.cn`
   - API Key: 填入你的 key
   - 模型: `step-3.5-flash`
6. 点击「保存配置」
7. 点击「测试连接」验证
8. 在对话测试区域输入消息测试

### 方法 2: 完整测试（需注册流程）

1. 访问 http://localhost:5175
2. 注册两个用户（alice@test.com, bob@test.com）
3. 登录 Alice，生成邀请码
4. 登录 Bob，使用邀请码加入
5. 进入设置页面配置 AI 助手
6. 测试对话功能

## 端口信息

- **前端**: 5175（注意：不是默认的 5173，因为被占用）
- **后端**: 5174
- **数据库**: 5432

如果在浏览器中访问出现 API 错误，请检查：
1. 后端 http://localhost:5174 是否可访问
2. 前端配置中的 API URL 是否指向 `http://localhost:5174/api`
3. 检查浏览器控制台是否有 CORS 错误

## 已实现的 AI 功能

- ✅ `AIConfig` 数据库表（client/src/db/index.ts）
- ✅ Anthropic API 封装（client/src/lib/anthropic.ts）
- ✅ 设置页面配置 UI（紫色主题）
- ✅ 连接测试功能
- ✅ AI 对话测试界面
- ✅ 配置持久化（IndexedDB）
- ✅ 默认配置 yunjunet.cn + step-3.5-flash

## 文件清单

```
wedding-planner/
├── client/
│   ├── src/
│   │   ├── db/index.ts          # + AIConfig interface & table
│   │   ├── lib/anthropic.ts     # NEW: Anthropic API wrapper
│   │   └── features/settings/
│   │       └── SettingsPage.tsx # + AI config section
├── server/
│   └── .env                     # DATABASE_URL, PORT=5174
├── README.md                    # 更新：AI 功能说明
├── TESTING.md                   # 详细测试指南
├── SETUP.md                     # PostgreSQL 配置指南
├── QUICKREF.md                 # 本文件
└── CLAUDE.md                   # Claude Code 开发指南
```

## 常见问题

**Q: 前端报错 "Failed to fetch"**
A: 检查后端是否运行在 5174，且 `vite.config.ts` 中的 API URL 正确。

**Q: AI 连接测试失败**
A:
- 检查 API Key 是否正确
- 确认可以访问 https://api.yunjunet.cn
- 检查浏览器控制台详细错误

**Q: 数据库连接失败**
A: 运行 `psql -U postgres -l` 确认 `wedding_planner` 数据库存在。

**Q: 端口占用如何解决**
A: 修改 `server/.env` 中的 `PORT` 和 `client/vite.config.ts` 中的默认值。

## 下一步

- 在设置中配置真实的 API Key
- 测试 AI 对话功能
- 可考虑将 AI 功能集成到任务创建、预算建议等具体场景

祝你测试顺利! 🎉
