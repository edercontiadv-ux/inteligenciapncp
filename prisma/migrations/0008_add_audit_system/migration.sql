-- Migration: 0008_add_audit_system
-- Descrição: Adiciona tabelas de auditoria, login_attempts e token_version em users
-- Criado em: 2026-07-06

-- 1. Adicionar coluna token_version em users (default 0)
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

-- 2. Criar tabela audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT NOT NULL,
    user_id TEXT,
    action TEXT NOT NULL,
    email TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_email ON audit_logs(email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created_at ON audit_logs(action, created_at);

-- 3. Criar tabela login_attempts
CREATE TABLE IF NOT EXISTS login_attempts (
    id TEXT NOT NULL,
    email TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    timestamp TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN NOT NULL,
    CONSTRAINT login_attempts_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_timestamp ON login_attempts(email, timestamp);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_timestamp ON login_attempts(ip_address, timestamp);
CREATE INDEX IF NOT EXISTS idx_login_attempts_timestamp ON login_attempts(timestamp);
