-- ============================================================
-- Migration 004: Fix RLS + Column Mismatches + Conflict Issues
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── FIX 1: DISABLE RLS on all tables (401 Unauthorized fix) ──────────────────
-- This is required for the anon key to write data from the browser.
ALTER TABLE public.telemetry_observations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.plots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensors DISABLE ROW LEVEL SECURITY;

-- ── FIX 2: Drop & recreate farms table with all required columns ──────────────
-- (400 Bad Request fix — existing table is missing columns the app writes)
DROP TABLE IF EXISTS public.sensors CASCADE;
DROP TABLE IF EXISTS public.telemetry_observations CASCADE;
DROP TABLE IF EXISTS public.plots CASCADE;
DROP TABLE IF EXISTS public.farms CASCADE;

CREATE TABLE public.farms (
  id             TEXT        PRIMARY KEY,
  name           TEXT        NOT NULL,
  location       TEXT,
  total_area     NUMERIC     DEFAULT 0,
  unit           TEXT        DEFAULT 'acres',
  sections_count INTEGER     DEFAULT 0,
  sensors_count  INTEGER     DEFAULT 0,
  health_score   INTEGER     DEFAULT 90,
  last_update    TIMESTAMPTZ DEFAULT NOW(),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.plots (
  id                 TEXT        PRIMARY KEY,
  farm_id            TEXT        REFERENCES public.farms(id) ON DELETE CASCADE,
  code               TEXT        NOT NULL,
  name               TEXT        NOT NULL,
  area               NUMERIC     DEFAULT 0,
  area_unit          TEXT        DEFAULT 'acres',
  crop_type          TEXT,
  growth_stage       TEXT,
  sensor_node_id     TEXT,
  irrigation_status  TEXT        DEFAULT 'Scheduled',
  soil_health_score  INTEGER     DEFAULT 88,
  soil_moisture      NUMERIC,
  air_temp           NUMERIC,
  soil_ph            NUMERIC,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.sensors (
  id                 TEXT        PRIMARY KEY,
  farm_id            TEXT        REFERENCES public.farms(id)  ON DELETE SET NULL,
  plot_id            TEXT        REFERENCES public.plots(id)  ON DELETE SET NULL,
  sensor_code        TEXT        NOT NULL,
  sensor_type        TEXT        NOT NULL DEFAULT 'Sensor',
  assigned_plot_code TEXT,
  battery_pct        INTEGER     DEFAULT 95,
  status             TEXT        DEFAULT 'Online',
  last_ping          TIMESTAMPTZ DEFAULT NOW(),
  current_reading    TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.telemetry_observations (
  id                    TEXT        PRIMARY KEY,
  farm_id               TEXT,
  plot_id               TEXT,
  device_id             TEXT,
  sensor_id             TEXT,
  parameter_key         TEXT        NOT NULL,
  display_name          TEXT,
  value                 NUMERIC     NOT NULL,
  unit                  TEXT,
  measurement_timestamp TIMESTAMPTZ NOT NULL,
  received_timestamp    TIMESTAMPTZ DEFAULT NOW(),
  quality_status        TEXT        DEFAULT 'VALID',
  data_source           TEXT        DEFAULT 'SIMULATED',
  notes                 TEXT,
  metadata              JSONB,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── FIX 3: Indexes ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sensors_farm_id ON public.sensors (farm_id);
CREATE INDEX IF NOT EXISTS idx_sensors_plot_id ON public.sensors (plot_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_farm_id ON public.telemetry_observations (farm_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_plot_id ON public.telemetry_observations (plot_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON public.telemetry_observations (measurement_timestamp DESC);

-- ── FIX 4: Disable RLS on newly created tables ────────────────────────────────
ALTER TABLE public.farms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.plots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_observations DISABLE ROW LEVEL SECURITY;

-- ── FIX 5: Enable Realtime on all 4 tables ────────────────────────────────────
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.farms; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.plots; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.sensors; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry_observations; EXCEPTION WHEN others THEN NULL; END;
END $$;
