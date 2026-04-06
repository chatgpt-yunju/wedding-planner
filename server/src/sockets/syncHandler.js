import { query } from '../db/index.js';
import { verifyAccessToken } from '../services/tokenService.js';

/**
 * Socket.io 连接处理
 * @param {Socket} socket
 */
export function handleConnection(socket) {
  const { handshake } = socket;
  const { auth } = handshake;

  if (!auth?.token) {
    socket.disconnect(true);
    return;
  }

  const payload = verifyAccessToken(auth.token);
  if (!payload) {
    socket.disconnect(true);
    return;
  }

  socket.userId = payload.sub;
  socket.coupleId = payload.coupleId;

  if (!socket.coupleId) {
    socket.disconnect(true);
    return;
  }

  // 加入 couple 专属房间（实现数据隔离）
  socket.join(`couple:${socket.coupleId}`);

  console.log(`User ${socket.userId} joined couple room ${socket.coupleId}`);

  // 推送离线期间错过的增量事件
  const lastSyncTs = auth.lastSyncTs ? new Date(auth.lastSyncTs) : new Date(0);
  pushMissedEvents(socket, socket.coupleId, socket.userId, lastSyncTs);

  // 监听客户端推送的同步事件
  socket.on('sync:push', async (event, ack) => {
    try {
      const { entityType, entityId, operation, payload, clientTs } = event;

      if (!entityType || !entityId || !operation) {
        return ack({ success: false, error: 'Invalid event format' });
      }

      // 冲突检测（简洁版）
      const conflict = await detectConflict(socket.coupleId, entityId, clientTs);
      if (conflict) {
        return ack({
          success: false,
          error: 'CONFLICT',
          serverVersion: conflict,
        });
      }

      // 持久化事件
      const saved = await query(
        `INSERT INTO sync_events
           (couple_id, author_id, entity_type, entity_id, operation, payload, client_ts)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, server_ts`,
        [socket.coupleId, socket.userId, entityType, entityId, operation, payload, new Date(clientTs)]
      );

      const savedEvent = saved.rows[0];

      // 广播给 couple 房间内其他成员（不含自己）
      socket.to(`couple:${socket.coupleId}`).emit('sync:pull', {
        ...event,
        serverTs: savedEvent.server_ts,
        eventId: savedEvent.id,
      });

      ack({
        success: true,
        eventId: savedEvent.id,
        serverTs: savedEvent.server_ts,
      });
    } catch (err) {
      console.error('sync:push error', err);
      ack({ success: false, error: 'Server error' });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`User ${socket.userId} disconnected: ${reason}`);
  });
}

/**
 * 推送离线期间错过的事件
 */
async function pushMissedEvents(socket, coupleId, userId, lastSyncTs) {
  try {
    const missed = await query(
      `SELECT id, couple_id, author_id, entity_type, entity_id,
              operation, payload, client_ts, server_ts, version
       FROM sync_events
       WHERE couple_id = $1
         AND author_id != $2
         AND server_ts > $3
       ORDER BY server_ts ASC
       LIMIT 500`,
      [coupleId, userId, lastSyncTs]
    );

    if (missed.rows.length > 0) {
      socket.emit('sync:catchup', {
        events: missed.rows,
        count: missed.rows.length,
      });

      // 更新客户端 lastSyncTs
      const last = missed.rows[missed.rows.length - 1];
      socket.emit('sync:updateTimestamp', { serverTs: last.server_ts });
    }
  } catch (err) {
    console.error('pushMissedEvents error', err);
  }
}

/**
 * 冲突检测：检查是否有比 clientTs 更新的记录
 */
async function detectConflict(coupleId, entityId, clientTs) {
  const result = await query(
    `SELECT payload, server_ts FROM sync_events
     WHERE couple_id = $1
       AND entity_id = $2
       AND server_ts > $3
     ORDER BY server_ts DESC
     LIMIT 1`,
    [coupleId, entityId, new Date(clientTs)]
  );
  return result.rows[0] || null;
}
