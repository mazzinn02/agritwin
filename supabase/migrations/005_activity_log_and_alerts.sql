-- Migration 005: Add Field Activity Log & Automated Alerts Tables
-- Enables Realtime PostgreSQL Streaming for Activity Audits and Sensor Threshold Warnings

-- 1. Field Activity Log Table
CREATE TABLE IF NOT EXISTS public.field_activity_log (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  farm_id TEXT,
  plot_id TEXT,
  sensor_id TEXT,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical', 'success')),
  created_by TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Alerts Table
CREATE TABLE IF NOT EXISTS public.alerts (
  id TEXT PRIMARY KEY,
  farm_id TEXT,
  plot_id TEXT,
  sensor_id TEXT,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  parameter_key TEXT,
  value NUMERIC,
  threshold NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

-- 3. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.field_activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

-- 4. Fast Query Indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_farm_id ON public.field_activity_log(farm_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON public.field_activity_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_farm_id ON public.alerts(farm_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(status);
