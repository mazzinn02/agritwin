-- ============================================================
-- Migration 003: Fix Missing Columns & Create Sensors Table
-- Resolves:
--   ERROR 2 - Missing crop_type, growth_stage on plots table
--   ERROR 3 - Missing public.sensors table (404 on POST /rest/v1/sensors)
-- ============================================================

-- ── ERROR 2 FIX: Add missing columns to plots table ─────────────────────────
-- Using IF NOT EXISTS guards so migration is idempotent (safe to re-run)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'plots'
      AND column_name = 'crop_type'
  ) THEN
    ALTER TABLE public.plots ADD COLUMN crop_type TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'plots'
      AND column_name = 'growth_stage'
  ) THEN
    ALTER TABLE public.plots ADD COLUMN growth_stage TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'plots'
      AND column_name = 'sensor_node_id'
  ) THEN
    ALTER TABLE public.plots ADD COLUMN sensor_node_id TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'plots'
      AND column_name = 'irrigation_status'
  ) THEN
    ALTER TABLE public.plots ADD COLUMN irrigation_status TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'plots'
      AND column_name = 'soil_health_score'
  ) THEN
    ALTER TABLE public.plots ADD COLUMN soil_health_score INTEGER DEFAULT 88;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'plots'
      AND column_name = 'soil_moisture'
  ) THEN
    ALTER TABLE public.plots ADD COLUMN soil_moisture NUMERIC;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'plots'
      AND column_name = 'air_temp'
  ) THEN
    ALTER TABLE public.plots ADD COLUMN air_temp NUMERIC;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'plots'
      AND column_name = 'soil_ph'
  ) THEN
    ALTER TABLE public.plots ADD COLUMN soil_ph NUMERIC;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'plots'
      AND column_name = 'area_unit'
  ) THEN
    ALTER TABLE public.plots ADD COLUMN area_unit TEXT DEFAULT 'acres';
  END IF;
END $$;

-- ── ERROR 3 FIX: Create sensors table ────────────────────────────────────────
-- Required Hierarchy: Farm → Plot → Sensor → Telemetry

CREATE TABLE IF NOT EXISTS public.sensors (
  id              TEXT        PRIMARY KEY,
  farm_id         TEXT        REFERENCES public.farms(id) ON DELETE CASCADE,
  plot_id         TEXT        REFERENCES public.plots(id) ON DELETE CASCADE,
  sensor_code     TEXT        NOT NULL,
  sensor_type     TEXT        NOT NULL DEFAULT 'Sensor',
  assigned_plot_code TEXT,
  battery_pct     INTEGER     DEFAULT 95,
  status          TEXT        DEFAULT 'Online',
  last_ping       TIMESTAMPTZ DEFAULT NOW(),
  current_reading TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookup by farm and plot
CREATE INDEX IF NOT EXISTS idx_sensors_farm_id ON public.sensors (farm_id);
CREATE INDEX IF NOT EXISTS idx_sensors_plot_id ON public.sensors (plot_id);
CREATE INDEX IF NOT EXISTS idx_sensors_status  ON public.sensors (status);

-- ── ERROR 4 FIX: Enable Realtime on all 4 tables ────────────────────────────
-- Also ensure farms table has all required columns

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'farms'
      AND column_name = 'health_score'
  ) THEN
    ALTER TABLE public.farms ADD COLUMN health_score INTEGER DEFAULT 90;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'farms'
      AND column_name = 'last_update'
  ) THEN
    ALTER TABLE public.farms ADD COLUMN last_update TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'farms'
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.farms ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Enable Supabase Realtime on all 4 tables (idempotent ADD TABLE calls)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry_observations;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.farms;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.plots;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sensors;
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;
