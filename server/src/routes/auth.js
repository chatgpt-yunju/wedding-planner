import express from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { query } from '../db/index.js';
import { generateTokens, generateInviteCode, hashToken } from '../services/tokenService.js';

const router = express.Router();

/**
 * 用户注册
 * POST /api/auth/register
 * Body: { email, password, name }
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // 检查是否已存在
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // 哈希密码
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 创建用户
    const result = await query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at`,
      [email, passwordHash, name]
    );

    const user = result.rows[0];

    // 自动创建 pending couple（用户自己成为 partner_a）
    const inviteCode = generateInviteCode();
    const coupleResult = await query(
      `INSERT INTO couples (partner_a_id, invite_code, status)
       VALUES ($1, $2, 'pending')
       RETURNING id`,
      [user.id, inviteCode]
    );
    const couple = coupleResult.rows[0];

    // 生成 tokens
    const tokens = generateTokens(user, couple.id);

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      couple: { id: couple.id, inviteCode, status: 'pending' },
      tokens,
    });
  } catch (err) {
    console.error('Register error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * 用户登录
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 查找用户
    const result = await query(
      'SELECT id, email, password_hash, name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // 验证密码
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 查找用户的 active couple
    const coupleResult = await query(
      `SELECT id, status FROM couples
       WHERE (partner_a_id = $1 OR partner_b_id = $2)
         AND status = 'active'
       LIMIT 1`,
      [user.id, user.id]
    );

    const couple = coupleResult.rows[0];

    // 生成 tokens
    const tokens = generateTokens(user, couple?.id);

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      couple: couple ? { id: couple.id, status: couple.status } : null,
      tokens,
    });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * 刷新 Token
 * POST /api/auth/refresh
 * Body: { refreshToken }
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // 检查黑名单（如果需要更复杂的黑名单管理，可用 Redis）
    // 这里简化处理：只验证签名

    // 获取用户信息和 couple
    const userResult = await query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [payload.sub]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    const coupleResult = await query(
      `SELECT id FROM couples
       WHERE (partner_a_id = $1 OR partner_b_id = $2)
         AND status = 'active'
       LIMIT 1`,
      [user.id, user.id]
    );

    const couple = coupleResult.rows[0];

    const tokens = generateTokens(user, couple?.id);

    res.json({ tokens });
  } catch (err) {
    console.error('Refresh error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * 登出
 * POST /api/auth/logout
 * Header: Authorization: Bearer <accessToken>
 * Body: { refreshToken }
 */
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // 将 refreshToken 加入黑名单
      const tokenHash = hashToken(refreshToken);
      const payload = verifyRefreshToken(refreshToken);
      const expiresAt = new Date(payload.exp * 1000);

      await query(
        `INSERT INTO token_blacklist (token_hash, expires_at)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [tokenHash, expiresAt]
      );
    }

    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
