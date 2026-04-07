-- 迁移：为 couples 表添加 expires_at 列
-- 日期：2026-04-07
-- 用途：存储邀请码的过期时间，替代原有的 created_at 计算

ALTER TABLE couples ADD COLUMN expires_at TIMESTAMPTZ;

-- 为现有 pending couples 设置默认过期时间（10分钟）
UPDATE couples 
SET expires_at = NOW() + INTERVAL '10 minutes'
WHERE invite_code IS NOT NULL AND status = 'pending' AND expires_at IS NULL;

-- 创建索引以加速过期查询
CREATE INDEX idx_couples_expires_at ON couples(expires_at) WHERE expires_at IS NOT NULL;

-- 添加注释
COMMENT ON COLUMN couples.expires_at IS '邀请码过期时间（如果为 NULL 则永不过期）';
