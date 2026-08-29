-- ============================================================
-- Migration 003: Fix Missing Columns & Create sensors Table
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Resolves:
--   ERROR 1 - GET /rest/v1/sensors 404 (table does not exist)
--   ERROR 2 - Missing crop_type, growth_stage on plots table
--   ERROR 3 - Realtime publication missing for sensors
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- STEP 1: Add missing columns to public.plots (idempotent)
-- ──────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plots' AND column_name = 'crop_type'
  ) THEN ALTER TABLE public.plots ADD COLUMN crop_type TEXT; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plots' AND column_name = 'growth_stage'
  ) THEN ALTER TABLE public.plots ADD COLUMN growth_stage TEXT; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plots' AND column_name = 'sensor_node_id'
  ) THEN ALTER TABLE public.plots ADD COLUMN sensor_node_id TEXT; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plots' AND column_name = 'irrigation_status'
  ) THEN ALTER TABLE public.plots ADD COLUMN irrigation_status TEXT DEFAULT 'Scheduled'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plots' AND column_name = 'soil_health_score'
  ) THEN ALTER TABLE public.plots ADD COLUMN soil_health_score INTEGER DEFAULT 88; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plots' AND column_name = 'area_unit'
  ) THEN ALTER TABLE public.plots ADD COLUMN area_unit TEXT DEFAULT 'acres'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plots' AND column_name = 'soil_moisture'
  ) THEN ALTER TABLE public.plots ADD COLUMN soil_moisture NUMERIC; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plots' AND column_name = 'air_temp'
  ) THEN ALTER TABLE public.plots ADD COLUMN air_temp NUMERIC; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plots' AND column_name = 'soil_ph'
  ) THEN ALTER TABLE public.plots ADD COLUMN soil_ph NUMERIC; END IF;
END $$;

-- ──────────────────────────────────────────────────────────────
-- STEP 2: Add missing columns to public.farms (idempotent)
-- ──────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'farms' AND column_name = 'health_score'
  ) THEN ALTER TABLE public.farms ADD COLUMN health_score INTEGER DEFAULT 90; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'farms' AND column_name = 'last_update'
  ) THEN ALTER TABLE public.farms ADD COLUMN last_update TIMESTAMPTZ DEFAULT NOW(); END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'farms' AND column_name = 'created_at'
  ) THEN ALTER TABLE public.farms ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); END IF;
END $$;

-- ──────────────────────────────────────────────────────────────
-- STEP 3: Create public.sensors table (ERROR 1 FIX)
--
-- Column layout matches exactly what saveSensorsToSupabase() sends:
--   id, farm_id, plot_id, sensor_code, sensor_type,
--   assigned_plot_code, battery_pct, status, last_ping,
--   current_reading, created_at
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sensors (
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

-- Indexes for fast lookup patterns used by the app
CREATE INDEX IF NOT EXISTS idx_sensors_farm_id ON public.sensors (farm_id);
CREATE INDEX IF NOT EXISTS idx_sensors_plot_id ON public.sensors (plot_id);
CREATE INDEX IF NOT EXISTS idx_sensors_status  ON public.sensors (status);

-- ──────────────────────────────────────────────────────────────
-- STEP 4: Enable Supabase Realtime on all 4 tables (ERROR 3 FIX)
-- The DO block swallows "already a member" errors so it is safe
-- to re-run this migration multiple times.
-- ──────────────────────────────────────────────────────────────

DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.farms;
  EXCEPTION WHEN others THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.plots;
  EXCEPTION WHEN others THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sensors;
  EXCEPTION WHEN others THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry_observations;
  EXCEPTION WHEN others THEN NULL; END;
END $$;
