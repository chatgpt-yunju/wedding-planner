# 备婚助手 (Wedding Planner)

一款专为情侣设计的离线优先备婚管理 PWA 应用，支持双人实时同步。

---

## 📜 许可证 / License

### 非商业使用 ✅ 免费

- ✅ 个人学习、研究、教育
- ✅ 个人项目或实验性项目
- ✅ 非营利组织内部使用
- ✅ 测试、评估、原型开发

详细条款见：**[LICENSE](LICENSE)**

### 商业使用 💼 需授权

- 💼 商业产品或服务集成
- 💼 为客户提供商业解决方案
- 💼 任何产生收入的用途

**商业授权价格：** 单人 $99/年起，团队 $499/年起，企业版定制

**查看详情：** **[LICENSE-COMMERCIAL.md](LICENSE-COMMERCIAL.md)**

**联系购买：** 2743319061@qq.com

---

## 技术栈

- **前端**: React 19 + TypeScript + Vite 7 + PWA
- **本地存储**: Dexie.js (IndexedDB)
- **状态管理**: Dexie useLiveQuery (响应式查询)
- **实时同步**: Socket.io Client + Server
- **后端**: Node.js + Express + Socket.io
- **数据库**: PostgreSQL
- **认证**: JWT (Access 15 min, Refresh 30 days)

## 项目结构

```
wedding-planner/
├── client/                 # 前端应用
│   ├── src/
│   │   ├── db/index.ts    # Dexie 数据库定义
│   │   ├── sync/          # 同步客户端
│   │   ├── hooks/         # React hooks
│   │   ├── features/      # 功能模块
│   │   └── lib/api.ts     # API 调用
│   └── vite.config.ts
├── server/                 # 后端服务
│   ├── src/
│   │   ├── server.js       # 入口
│   │   ├── routes/         # API 路由
│   │   ├── middleware/     # 中间件
│   │   ├── db/             # 数据库连接 + schema
│   │   ├── services/       # 业务服务
│   │   └── sockets/        # Socket.io 处理
│   └── .env
└── README.md
```

## 开发状态

- ✅ **阶段0**: 项目基建与同步引擎 (完成)
- ✅ **阶段1**: 任务管理与智能日历 (完成)
- ⏳ **阶段2**: 预算、亲友、座位表 (开发中)
- ⏳ **阶段3**: 心情胶囊、回忆时光轴 (待开始)
- ⏳ **阶段4**: 导入、报表、通知、优化 (待开始)

## 快速开始

### 1. 克隆并安装依赖

```bash
# 前端
cd client
npm install

# 后端
cd ../server
npm install
```

### 2. 配置数据库

你需要一个 PostgreSQL 数据库（版本 12+）。

**使用 Docker (推荐):**

```bash
docker run -d \
  --name wedding-db \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=wedding_planner \
  postgres:15
```

**创建表结构:**

```bash
cd server
psql -U postgres -d wedding_planner -f src/db/schema.sql
```

或使用 `psql` 命令手动:

```sql
\i src/db/schema.sql
```

### 3. 配置环境变量

复制 `server/.env.example` 到 `server/.env` 并修改:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/wedding_planner
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### 4. 启动开发服务器

**终端 1 - 后端:**

```bash
cd server
npm run dev
```

服务启动在 http://localhost:3000

**终端 2 - 前端:**

```bash
cd client
npm run dev
```

应用打开 http://localhost:5173

## 功能说明

### 阶段 0 (✅ 已完成)
- ✅ 用户注册 / 登录 (JWT)
- ✅ 邀请码配对机制
- ✅ WebSocket 实时同步引擎
- ✅ Last-Write-Wins 冲突解决
- ✅ 增量同步 API
- ✅ 离线队列 + 自动重连
- ✅ 数据隔离中间件 (coupleGuard)

### 阶段 1 (✅ 已完成)
- 📋 任务管理 (15 分类 CRUD)
- 📅 智能日历 (月视图、任务截止显示)
- ⏱️ 婚礼倒计时
- 📊 任务统计 (完成度圆环、状态分布)
- 🔄 实时同步 (任务创建/更新/删除)

### 阶段 2 (⏳ 开发中)
- 💰 预算管控 (分类、付款、超支预警)
- 👥 亲友与礼金管理 (RSVP、去重)
- 🪑 座位表 (拖拽、导出)

### 阶段 3 (⏳ 待开始)
- 😊 心情胶囊 (情绪记录、热力图)
- 📸 回忆时光轴 (图片/视频上传、时间线)

### 阶段 4 (⏳ 待开始)
- 📤 一键导入 (Excel, vCard)
- 📊 统计报表 (PDF 导出)
- 🔔 通知提醒 (Web Push)
- 🔐 端到端加密 (可选升级)

## AI 助手功能

设置中可配置 Anthropic 兼容 API（如 yunjunet.cn）以使用 `step-3.5-flash` 模型：
- 配置 Base URL、API Key、模型名称
- 连接测试功能
- 对话测试界面
- API Key 仅本地存储，不会上传到服务器

详情见 `client/src/lib/anthropic.ts` 和设置页面。

## API 接口

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/refresh` - 刷新 Token
- `POST /api/auth/logout` - 登出

### 配对
- `POST /api/couple/invite` - 生成邀请码
- `POST /api/couple/join` - 使用邀请码加入
- `GET /api/couple` - 获取当前配对信息
- `DELETE /api/couple` - 解除配对

### 同步
- `GET /api/couple/:id/sync?since=timestamp` - 增量拉取
- `POST /api/couple/:id/sync` - 批量推送变更

## 同步机制

- **数据模型**: 客户端使用 Dexie (IndexedDB) 存储，服务端使用 PostgreSQL
- **同步策略**: 增量同步 + 事件日志 (`sync_events` 表)
- **冲突解决**: Last-Write-Wins (基于客户端时间戳)
- **离线支持**: 变更队列 + 自动重连

详细设计见 ` docs/sync-design.md` (TODO).

## 部署

### 前端 (Vercel)

```bash
cd client
npm run build
# 部署 dist/ 目录到 Vercel
```

### 后端 (Railway / Render)

- 设置环境变量
- 运行 `npm start`
- 确保 PostgreSQL 可用

## 测试

### 手动测试流程

1. 注册两个用户 (Alice & Bob)
2. Alice 登录后生成邀请码
3. Bob 使用邀请码加入配对
4. Alice 创建任务，观察 Bob 是否实时收到 (WebSocket)
5. 断开 Bob 的网络，创建任务，恢复网络，验证自动同步

### 运行自动化测试 (TODO)

```bash
npm test
```

## 常见问题

**Q: 没有 PostgreSQL 能否运行?**
A: 可以临时使用 SQLite 替代，但需修改代码。生产环境推荐 PostgreSQL。

**Q: 如何重置数据库?**
A: 运行 `npm run db:reset` (脚本待添加) 或手动 `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` 再执行 schema.sql。

**Q: 同步失败怎么办?**
A: 检查 WebSocket 连接状态和网络，查看浏览器控制台错误。确保服务端 Socket.io 中间件 JWT 验证通过。

## 贡献

欢迎提交 Issue 和 Pull Request!

---

**开发状态**: 阶段 0 (基建) 已完成，阶段 1 开发中。
