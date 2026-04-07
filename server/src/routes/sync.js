import express from 'express';
import { query, pool } from '../db/index.js';

const router = express.Router();

const MAX_BATCH_SIZE = 500;

/**
 * 获取增量同步事件
 * GET /api/couple/:coupleId/sync?since=1234567890
 * Auth required, coupleGuard required
 */
router.get('/:coupleId/sync', async (req, res) => {
  try {
    const { coupleId } = req.params;
    const { since } = req.query; // ISO timestamp or epoch ms
    const userId = req.user.id;

    const sinceTime = since ? new Date(Number(since)) : new Date(0);

    const result = await query(
      `SELECT id, couple_id, author_id, entity_type, entity_id,
              operation, payload, client_ts, server_ts, version
       FROM sync_events
       WHERE couple_id = $1
         AND author_id != $2
         AND server_ts > $3
       ORDER BY server_ts ASC
       LIMIT 500`,
      [coupleId, userId, sinceTime]
    );

    res.json({
      events: result.rows,
      count: result.rows.length,
    });
  } catch (err) {
    console.error('Sync GET error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * 批量推送变更（离线队列上传）
 * POST /api/couple/:coupleId/sync
 * Auth required, coupleGuard required
 */
router.post('/:coupleId/sync', async (req, res) => {
  const client = null; // declare for finally block
  try {
    const { coupleId } = req.params;
    const { authorId, changes } = req.body; // { authorId, changes: [] }
    const userId = req.user.id;

    if (!Array.isArray(changes) || changes.length === 0) {
      return res.json({ received: 0 });
    }

    if (changes.length > MAX_BATCH_SIZE) {
      return res.status(400).json({
        error: `Batch size exceeds limit of ${MAX_BATCH_SIZE}`,
        received: changes.length,
      });
    }

    // 使用连接池获取客户端（而不是新建独立连接）
    client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const change of changes) {
        const { entityType, entityId, operation, payload, clientTs } = change;

        // 冲突检测：检查是否有更新的 server_ts
        const conflictCheck = await client.query(
          `SELECT server_ts FROM sync_events
           WHERE couple_id = $1 AND entity_id = $2
           ORDER BY server_ts DESC LIMIT 1`,
          [coupleId, entityId]
        );

        if (conflictCheck.rows.length > 0) {
          const latestServerTs = conflictCheck.rows[0].server_ts;
          const clientTime = new Date(clientTs);

          // 如果客户端版本较旧，记录冲突但不阻塞（LWW 由服务端时间决定）
          if (latestServerTs > clientTime) {
            console.warn(`Conflict detected for ${entityType}:${entityId}`);
          }
        }

        // 插入事件
        await client.query(
          `INSERT INTO sync_events
             (couple_id, author_id, entity_type, entity_id, operation, payload, client_ts)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, server_ts`,
          [coupleId, userId, entityType, entityId, operation, payload, new Date(clientTs)]
        );
      }

      await client.query('COMMIT');

      res.json({ received: changes.length });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      if (client) client.release(); // 释放回连接池
    }
  } catch (err) {
    console.error('Sync POST error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * 获取全量快照（新设备首次安装时）
 * GET /api/couple/:coupleId/snapshot
 */
router.get('/:coupleId/snapshot', async (req, res) => {
  // TODO: 实现按实体类型查询最新数据
  res.status(501).json({ error: 'Not implemented yet' });
});

export default router;
