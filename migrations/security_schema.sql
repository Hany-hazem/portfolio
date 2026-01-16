-- Security Schema Migration
-- Create tables for audit logging, page view analytics, and admin sessions

-- 1. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  action VARCHAR(255) NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 2. Page Views Table
CREATE TABLE IF NOT EXISTS page_views (
  id BIGSERIAL PRIMARY KEY,
  path VARCHAR(255) NOT NULL,
  is_bot BOOLEAN DEFAULT false,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for page_views
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_is_bot ON page_views(is_bot);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);

-- 3. Admin Sessions Table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id BIGSERIAL PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Create indexes for admin_sessions
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at DESC);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (service role can insert/read)
CREATE POLICY "Enable insert for service role" ON audit_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for service role" ON audit_logs
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role" ON page_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for service role" ON page_views
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role" ON admin_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for service role" ON admin_sessions
  FOR SELECT USING (true);
