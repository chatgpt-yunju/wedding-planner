--  wedding-planner 数据库 schema
--  执行: psql -U postgres -d wedding_planner -f schema.sql

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- 情侣配对表（数据隔离核心）
CREATE TABLE couples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_b_id UUID REFERENCES users(id) ON DELETE SET NULL,
    invite_code CHAR(6) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending', -- pending / active / dissolved
    created_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    CONSTRAINT unique_partner_a UNIQUE (partner_a_id),
    CONSTRAINT unique_partner_b UNIQUE (partner_b_id),
    CONSTRAINT partners_not_same CHECK (partner_a_id != partner_b_id)
);

CREATE INDEX idx_couples_invite_code ON couples(invite_code);
CREATE INDEX idx_couples_partner_a ON couples(partner_a_id);
CREATE INDEX idx_couples_partner_b ON couples(partner_b_id);
CREATE INDEX idx_couples_status ON couples(status);

-- 同步事件日志（实现增量同步的核心）
CREATE TABLE sync_events (
    id BIGSERIAL PRIMARY KEY,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    entity_type VARCHAR(50) NOT NULL,      -- 'task', 'mood', 'guest', 'budget', etc.
    entity_id UUID NOT NULL,               -- 对应实体的 UUID
    operation VARCHAR(10) NOT NULL,        -- 'CREATE', 'UPDATE', 'DELETE'
    payload JSONB NOT NULL,                -- 实际数据（包含 updatedAt）
    client_ts TIMESTAMPTZ NOT NULL,        -- 客户端时间戳（用于冲突检测）
    server_ts TIMESTAMPTZ DEFAULT NOW(),   -- 服务端时间（权威）
    version INTEGER DEFAULT 1
);

-- 按 couple_id + server_ts 建索引（增量拉取时快速筛选）
CREATE INDEX idx_sync_events_couple_ts ON sync_events (couple_id, server_ts);
CREATE INDEX idx_sync_events_couple_entity ON sync_events (couple_id, entity_type, entity_id);

-- 用于清理旧同步日志：按时间分区或定期归档，此处不建立额外索引

-- 刷新令牌黑名单（用于登出和 Token 轮换）
CREATE TABLE token_blacklist (
    id SERIAL PRIMARY KEY,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at);

-- 自动清理过期黑名单记录（可选：每天运行）
-- CREATE OR REPLACE FUNCTION cleanup_blacklist() RETURNS void AS $$
-- BEGIN
--   DELETE FROM token_blacklist WHERE expires_at < NOW();
-- END;
-- $$ LANGUAGE plpgsql;

-- 示例数据（测试用）
-- INSERT INTO users (id, email, password_hash, name) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'alice@test.com', '$2a$10$...', 'Alice'),
-- ('00000000-0000-0000-0000-000000000002', 'bob@test.com', '$2a$10$...', 'Bob');

-- INSERT INTO couples (id, partner_a_id, partner_b_id, invite_code, status, activated_at) VALUES
-- ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'ABCD12', 'active', NOW());
