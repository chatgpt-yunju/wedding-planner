# 快速启动指南

## 当前进度 (2026-04-05)

- ✅ **阶段0**: 项目基建 + 同步引擎 (后端完整，前端基础框架)
- ✅ **阶段1**: 任务管理与日历 (UI完成，可交互)
- ⏳ **阶段2-4**: 未开始

## 项目位置

```
D:/wedding-planner/
├── client/           # 前端 (React + TypeScript)
│   ├── src/
│   │   ├── db/          # Dexie 数据库定义
│   │   ├── sync/        # Socket.io 同步客户端
│   │   ├── features/    # 功能模块
│   │   │   ├── auth/        # 登录/注册
│   │   │   ├── dashboard/   # 主仪表盘
│   │   │   ├── tasks/       # 任务管理 ✅
│   │   │   └── calendar/    # 智能日历 ✅
│   │   └── lib/api.ts   # API 封装
│   ├── dist/          # 生产构建 (已完成 ✅)
│   └── package.json
└── server/           # 后端 (Node.js + Express + Socket.io)
    ├── src/
    │   ├── server.js      # 主入口
    │   ├── routes/        # API 路由 (auth, couple, sync)
    │   ├── middleware/    # auth, coupleGuard
    │   ├── db/            # PostgreSQL schema
    │   ├── services/      # tokenService 等
    │   └── sockets/       # Socket.io handler
    └── .env.example
```

## 极速体验 (5分钟)

### 1. 启动数据库 (Docker)

```bash
docker run -d \
  --name wedding-db \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=wedding_planner \
  postgres:15
```

### 2. 初始化表结构

```bash
cd server
psql -U postgres -d wedding_planner -f src/db/schema.sql
```

或手动:
```sql
-- 在 psql 中执行:
\i src/db/schema.sql
```

### 3. 配置环境

```bash
cd server
cp .env.example .env  # 已存在，可按需修改
# 确保 .env 中的 DATABASE_URL 指向你的 PostgreSQL
```

### 4. 启动后端

```bash
npm run dev
# 服务运行在 http://localhost:3000
```

### 5. 启动前端 (新终端)

```bash
cd client
npm run dev
# 打开 http://localhost:5173
```

## 手动测试流程

1. **注册用户 A** (alice@test.com / password123)
2. **注册用户 B** (bob@test.com / password123)
3. **A 登录** → 自动创建 pending couple，显示邀请码
4. **B 登录** → 使用邀请码加入 → 配对成功 (状态变 active)
5. **A 创建任务** → B 应实时收到 WebSocket 推送 (两个浏览器标签)
6. **B 离线** (DevTools Network Offline) → 创建任务 → 恢复网络 → 自动同步

## 关键文件说明

| 文件 | 说明 |
|------|------|
| `server/src/db/schema.sql` | PostgreSQL 表结构 (users, couples, sync_events, ...) |
| `server/src/routes/auth.js` | 注册/登录/JWT |
| `server/src/routes/couple.js` | 邀请码、配对 |
| `server/src/routes/sync.js` | 增量同步 API |
| `server/src/sockets/syncHandler.js` | WebSocket 实时推送 |
| `client/src/db/index.ts` | Dexie 数据库定义 (8个实体) |
| `client/src/sync/syncClient.ts` | 同步客户端类 |
| `client/src/hooks/useSync.ts` | React hooks (useLiveQuery 包装器) |
| `client/src/features/auth/Login.tsx` | 登录/注册 UI |
| `client/src/features/dashboard/Dashboard.tsx` | 主界面 (路由 + 状态) |
| `client/src/features/tasks/` | 任务模块 (列表、表单、统计) |
| `client/src/features/calendar/` | 日历模块 (月视图、倒计时) |

## API 接口速查

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/couple/invite` | 生成邀请码 |
| POST | `/api/couple/join` | 加入配对 |
| GET  | `/api/couple` | 获取配对信息 |
| GET  | `/api/couple/:id/sync?since=ts` | 增量拉取 |
| POST | `/api/couple/:id/sync` | 批量推送变更 |

## 同步机制

- **协议**: Socket.io + REST 增量同步
- **冲突解决**: Last-Write-Wins (基于客户端时间戳)
- **隔离**: couple 专属房间 (`socket.join('couple:' + coupleId)`)
- **离线**: 变更队列 + reconnect 自动刷新

## 常见问题

**Q: 没有 PostgreSQL 能跑吗?**  
A: 暂时不行，阶段0依赖 PG 的 `sync_events` 表。可以改用 SQLite + 适配器，但需要改代码。

**Q: 如何重置数据库?**  
A: 删除 `wedding_planner` 库，重新创建并执行 `schema.sql`。

**Q: 前端构建报错 "index.html not found"?**  
A: 确保在 `client/` 目录运行 `npm run build`，且 `index.html` 存在。

**Q: 同步不工作?**  
A: 确认后端 Socket.io 已启动，浏览器 Console 查看连接错误。确保 JWT 有效且 `coupleId` 存在。

## 下一步计划

- [ ] 编写单元测试 (Jest)
- [ ] 实现预算、亲友、座位模块
- [ ] 添加心情胶囊、回忆上传
- [ ] 实现 Excel 导入导出
- [ ] PWA 离线推送 (VAPID)
- [ ] 部署到 Vercel + Railway

---

**提示**: 本项目仍在早期开发阶段，API 可能变动。建议按阶段顺序逐步实现功能。
