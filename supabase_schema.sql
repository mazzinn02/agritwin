-- Complete AgriTwin Supabase PostgreSQL DDL Schema
-- Execute in Supabase SQL Editor (https://app.supabase.com -> SQL Editor)

-- 1. Farms Table
CREATE TABLE IF NOT EXISTS public.farms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  owner_name TEXT,
  contact_phone TEXT,
  contact_role TEXT DEFAULT 'Owner',
  total_area NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'acres',
  sections_count INTEGER DEFAULT 0,
  sensors_count INTEGER DEFAULT 0,
  health_score INTEGER DEFAULT 90,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Plots Table
CREATE TABLE IF NOT EXISTS public.plots (
  id TEXT PRIMARY KEY,
  farm_id TEXT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  area NUMERIC DEFAULT 0,
  area_unit TEXT DEFAULT 'acres',
  crop_id TEXT,
  crop_type TEXT,
  growth_stage TEXT,
  sensor_node_id TEXT,
  irrigation_status TEXT DEFAULT 'Scheduled',
  soil_health_score INTEGER DEFAULT 85,
  soil_moisture NUMERIC DEFAULT 45,
  air_temp NUMERIC DEFAULT 26.5,
  soil_ph NUMERIC DEFAULT 6.5,
  humidity NUMERIC DEFAULT 60,
  days_planted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sensors Table
CREATE TABLE IF NOT EXISTS public.sensors (
  id TEXT PRIMARY KEY,
  farm_id TEXT,
  plot_id TEXT,
  sensor_code TEXT NOT NULL,
  sensor_type TEXT NOT NULL,
  assigned_plot_code TEXT NOT NULL,
  battery_pct INTEGER DEFAULT 95,
  status TEXT DEFAULT 'Online',
  last_ping TIMESTAMPTZ DEFAULT NOW(),
  current_reading TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Telemetry Observations Table
CREATE TABLE IF NOT EXISTS public.telemetry_observations (
  id TEXT PRIMARY KEY,
  farm_id TEXT,
  plot_id TEXT,
  device_id TEXT,
  sensor_id TEXT,
  parameter_key TEXT NOT NULL,
  display_name TEXT,
  value NUMERIC NOT NULL,
  unit TEXT,
  measurement_timestamp TIMESTAMPTZ NOT NULL,
  received_timestamp TIMESTAMPTZ DEFAULT NOW(),
  quality_status TEXT DEFAULT 'VALID',
  data_source TEXT DEFAULT 'SIMULATED',
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Field Activity Log Table
CREATE TABLE IF NOT EXISTS public.field_activity_log (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  farm_id TEXT,
  plot_id TEXT,
  sensor_id TEXT,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'info',
  created_by TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Alerts Table
CREATE TABLE IF NOT EXISTS public.alerts (
  id TEXT PRIMARY KEY,
  farm_id TEXT,
  plot_id TEXT,
  sensor_id TEXT,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'warning',
  status TEXT DEFAULT 'active',
  parameter_key TEXT,
  value NUMERIC,
  threshold NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

-- 7. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  uid TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'farmer',
  assigned_farm_ids TEXT[] DEFAULT '{}',
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.farms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.plots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry_observations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.field_activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_telemetry_farm_id ON public.telemetry_observations(farm_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_plot_id ON public.telemetry_observations(plot_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON public.telemetry_observations(measurement_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_farm_id ON public.field_activity_log(farm_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON public.field_activity_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_farm_id ON public.alerts(farm_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(status);
