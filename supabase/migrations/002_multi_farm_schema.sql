-- Migration: 002_multi_farm_schema.sql
-- Description: Multi-Farm Agricultural Digital Twin Schema for Supabase PostgreSQL
-- Creates tables: farms, plots, sensors, telemetry_observations and enables Realtime

-- 1. Farms Table
CREATE TABLE IF NOT EXISTS public.farms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
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
  farm_id TEXT REFERENCES public.farms(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  area NUMERIC DEFAULT 0,
  area_unit TEXT DEFAULT 'acres',
  crop_type TEXT,
  growth_stage TEXT,
  sensor_node_id TEXT,
  irrigation_status TEXT DEFAULT 'Scheduled',
  soil_health_score INTEGER DEFAULT 85,
  soil_moisture NUMERIC DEFAULT 45,
  air_temp NUMERIC DEFAULT 26.5,
  soil_ph NUMERIC DEFAULT 6.5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sensors Table
CREATE TABLE IF NOT EXISTS public.sensors (
  id TEXT PRIMARY KEY,
  farm_id TEXT REFERENCES public.farms(id) ON DELETE CASCADE,
  plot_id TEXT REFERENCES public.plots(id) ON DELETE CASCADE,
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high-performance querying
CREATE INDEX IF NOT EXISTS idx_plots_farm_id ON public.plots(farm_id);
CREATE INDEX IF NOT EXISTS idx_sensors_farm_id ON public.sensors(farm_id);
CREATE INDEX IF NOT EXISTS idx_sensors_plot_id ON public.sensors(plot_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_farm_id ON public.telemetry_observations(farm_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_plot_id ON public.telemetry_observations(plot_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_sensor_id ON public.telemetry_observations(sensor_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_ts ON public.telemetry_observations(measurement_timestamp DESC);

-- Enable Supabase Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.farms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.plots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry_observations;
