import { query } from '../db/index.js';

/**
 * 情侣数据隔离中间件
 * 验证当前用户是否属于指定的 couple，并且 couple status 为 active
 * 使用方式：app.use('/api/couple/:coupleId/*', coupleGuard);
 */
export async function coupleGuard(req, res, next) {
  const { coupleId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await query(
      `SELECT id, status FROM couples
       WHERE id = $1
         AND (partner_a_id = $2 OR partner_b_id = $2)
         AND status = 'active'`,
      [coupleId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    req.couple = result.rows[0];
    next();
  } catch (err) {
    console.error('coupleGuard error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
