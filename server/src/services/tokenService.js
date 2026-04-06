import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const JWT_CONFIG = {
  access: {
    secret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    expiresIn: '15m',
    issuer: 'wedding-planner',
    audience: 'wedding-planner-client',
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    expiresIn: '30d',
  },
};

/**
 * 生成 JWT 对（access + refresh）
 */
export function generateTokens(user, coupleId) {
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    coupleId,
    type: 'access',
  };

  const accessToken = jwt.sign(payload, JWT_CONFIG.access.secret, {
    expiresIn: JWT_CONFIG.access.expiresIn,
    issuer: JWT_CONFIG.access.issuer,
    audience: JWT_CONFIG.access.audience,
  });

  const refreshToken = jwt.sign(
    { sub: user.id, type: 'refresh' },
    JWT_CONFIG.refresh.secret,
    { expiresIn: JWT_CONFIG.refresh.expiresIn }
  );

  return { accessToken, refreshToken };
}

/**
 * 验证 Access Token
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_CONFIG.access.secret, {
      issuer: JWT_CONFIG.access.issuer,
      audience: JWT_CONFIG.access.audience,
    });
  } catch (err) {
    return null;
  }
}

/**
 * 验证 Refresh Token
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_CONFIG.refresh.secret);
  } catch (err) {
    return null;
  }
}

/**
 * 生成随机邀请码（6位大写字母数字）
 */
export function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除易混字符
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * 哈希 Refresh Token 用于黑名单存储
 */
export function hashToken(token) {
  return require('crypto').createHash('sha256').update(token).digest('hex');
}
