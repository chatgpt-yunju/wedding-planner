import express from 'express';
import { query } from '../db/index.js';
import { generateInviteCode } from '../services/tokenService.js';

const router = express.Router();

/**
 * 生成邀请码（针对当前用户的 active couple）
 * POST /api/couple/invite
 * Auth required
 */
router.post('/invite', async (req, res) => {
  try {
    const userId = req.user.id;

    // 查找用户所属的 active couple
    let coupleResult = await query(
      `SELECT id FROM couples
       WHERE (partner_a_id = $1 OR partner_b_id = $2)
         AND status = 'active'
       LIMIT 1`,
      [userId, userId]
    );

    let couple;

    if (coupleResult.rows.length === 0) {
      // 用户还没有 active couple，可能是刚注册，需要创建
      // 检查是否已有 pending couple 作为 partner_a
      const pending = await query(
        'SELECT id FROM couples WHERE partner_a_id = $1 AND status = \'pending\'',
        [userId]
      );

      if (pending.rows.length > 0) {
        couple = { id: pending.rows[0].id };
      } else {
        // 创建新的 pending couple（这通常应该在注册时完成，这里是兜底）
        const newCouple = await query(
          `INSERT INTO couples (partner_a_id, invite_code, status)
           VALUES ($1, $2, 'pending')
           RETURNING id`,
          [userId, generateInviteCode()]
        );
        couple = { id: newCouple.rows[0].id };
      }
    } else {
      couple = { id: coupleResult.rows[0].id };
    }

    // 生成新的邀请码（6位，10分钟有效）
    const inviteCode = generateInviteCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟

    await query(
      `UPDATE couples
       SET invite_code = $1, created_at = NOW()
       WHERE id = $2
       RETURNING invite_code`,
      [inviteCode, couple.id]
    );

    res.json({
      coupleId: couple.id,
      inviteCode,
      expiresIn: 600, // seconds
    });
  } catch (err) {
    console.error('Invite error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * 使用邀请码加入 couple
 * POST /api/couple/join
 * Body: { inviteCode }
 * Auth required
 */
router.post('/join', async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code required' });
    }

    // 查找有效的邀请
    const coupleResult = await query(
      `SELECT id, partner_a_id, status FROM couples
       WHERE invite_code = $1
         AND status = 'pending'
         AND created_at > NOW() - INTERVAL '10 minutes'`,
      [inviteCode]
    );

    if (coupleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired invite code' });
    }

    const couple = coupleResult.rows[0];

    // 确认邀请人是 partner_a
    if (couple.partner_a_id === userId) {
      return res.status(400).json({ error: 'Cannot join your own couple' });
    }

    // 检查用户是否已在其他 active couple
    const existingCouple = await query(
      `SELECT id FROM couples
       WHERE (partner_a_id = $1 OR partner_b_id = $2)
         AND status = 'active'`,
      [userId, userId]
    );

    if (existingCouple.rows.length > 0) {
      return res.status(400).json({ error: 'User already in an active couple' });
    }

    // 更新 couple，把当前用户设为 partner_b，激活 couple
    await query(
      `UPDATE couples
       SET partner_b_id = $1, status = 'active', activated_at = NOW(), invite_code = NULL
       WHERE id = $2
       RETURNING id`,
      [userId, couple.id]
    );

    res.json({
      coupleId: couple.id,
      status: 'active',
      message: 'Successfully joined couple',
    });
  } catch (err) {
    console.error('Join couple error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * 获取当前用户的 couple 信息
 * GET /api/couple
 * Auth required
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT c.id, c.status, c.activated_at,
              ua.name as partner_a_name, ub.name as partner_b_name,
              ua.id as partner_a_id, ub.id as partner_b_id
       FROM couples c
       LEFT JOIN users ua ON c.partner_a_id = ua.id
       LEFT JOIN users ub ON c.partner_b_id = ub.id
       WHERE (c.partner_a_id = $1 OR c.partner_b_id = $2)
         AND c.status = 'active'
       LIMIT 1`,
      [userId, userId]
    );

    if (result.rows.length === 0) {
      return res.json({ couple: null });
    }

    const couple = result.rows[0];
    res.json({ couple });
  } catch (err) {
    console.error('Get couple error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * 解除配对（软删除或标记为 dissolved）
 * DELETE /api/couple
 * Auth required
 */
router.delete('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `UPDATE couples
       SET status = 'dissolved', partner_b_id = NULL
       WHERE partner_a_id = $1 AND status = 'active'
       RETURNING id`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active couple found' });
    }

    res.json({ message: 'Couple dissolved' });
  } catch (err) {
    console.error('Dissolve couple error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
