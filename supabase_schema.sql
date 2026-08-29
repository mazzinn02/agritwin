-- ============================================================================
-- AGRITWIN CROP DIGITAL TWIN SYSTEM — SUPABASE POSTGRESQL SCHEMA
-- Copy and paste this script into your Supabase Dashboard -> SQL Editor and click RUN
-- ============================================================================

-- 1. Create Farmlands Table
CREATE TABLE IF NOT EXISTS public.farms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    total_area NUMERIC NOT NULL,
    unit TEXT NOT NULL DEFAULT 'acres',
    sections_count INT NOT NULL DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Plot Beds / Sections Table
CREATE TABLE IF NOT EXISTS public.plots (
    id TEXT PRIMARY KEY,
    farm_id TEXT REFERENCES public.farms(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    area NUMERIC NOT NULL,
    area_unit TEXT DEFAULT 'acres',
    crop_id TEXT,
    sensor_node_id TEXT NOT NULL,
    soil_moisture NUMERIC DEFAULT 62.0,
    air_temp NUMERIC DEFAULT 25.0,
    soil_ph NUMERIC DEFAULT 6.5,
    days_planted INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Telemetry Observations Table (Main 12s real-time table)
CREATE TABLE IF NOT EXISTS public.telemetry_observations (
    id TEXT PRIMARY KEY,
    farm_id TEXT NOT NULL,
    plot_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    sensor_id TEXT NOT NULL,
    parameter_key TEXT NOT NULL,
    display_name TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    measurement_timestamp TIMESTAMPTZ NOT NULL,
    received_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    quality_status TEXT NOT NULL DEFAULT 'VALID',
    data_source TEXT NOT NULL DEFAULT 'SIMULATED',
    notes TEXT,
    metadata JSONB
);

-- Create High-Performance Indexes for Real-Time Querying
CREATE INDEX IF NOT EXISTS idx_telemetry_plot_time ON public.telemetry_observations (plot_id, measurement_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_param_time ON public.telemetry_observations (parameter_key, measurement_timestamp DESC);

-- 4. Create User Profiles Table
CREATE TABLE IF NOT EXISTS public.users (
    uid TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'farmer',
    assigned_farm_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    plot_id TEXT NOT NULL,
    plot_code TEXT NOT NULL,
    action_type TEXT NOT NULL,
    triggered_by TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Supabase Realtime Publication on telemetry_observations
ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry_observations;

-- Enable Public RLS Policies (Allow read/write for prototype demo)
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on farms" ON public.farms FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on farms" ON public.farms FOR ALL USING (true);

CREATE POLICY "Allow public read on plots" ON public.plots FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on plots" ON public.plots FOR ALL USING (true);

CREATE POLICY "Allow public read on telemetry" ON public.telemetry_observations FOR SELECT USING (true);
CREATE POLICY "Allow public insert on telemetry" ON public.telemetry_observations FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on users" ON public.users FOR ALL USING (true);

CREATE POLICY "Allow public read on audit_logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Seed IIIT Dharwad Default Farm
INSERT INTO public.farms (id, name, location, total_area, unit, sections_count)
VALUES ('farm_iiit_dharwad', 'iiit dharwad', 'Dharwad, Karnataka', 20, 'acres', 4)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Sections
INSERT INTO public.plots (id, farm_id, code, name, area, area_unit, crop_id, sensor_node_id, soil_moisture, air_temp, soil_ph, days_planted)
VALUES 
('sec_a_tomato', 'farm_iiit_dharwad', 'SEC-A', 'Section A - Tomato (Sarpan F1)', 5, 'acres', 'crop_tomato_sarpan', 'NODE-01', 66.9, 24.2, 6.5, 45),
('sec_b_chilli', 'farm_iiit_dharwad', 'SEC-B', 'Section B - Chilli (Byadgi Dabbi)', 5, 'acres', 'crop_chilli_byadgi', 'NODE-02', 54.2, 26.5, 6.8, 60),
('sec_c_cotton', 'farm_iiit_dharwad', 'SEC-C', 'Section C - Bt-Cotton (RCH-2)', 5, 'acres', 'crop_cotton_rch', 'NODE-03', 48.0, 28.1, 7.0, 75),
('sec_d_corn', 'farm_iiit_dharwad', 'SEC-D', 'Section D - Sweet Corn (Sugar-75)', 5, 'acres', 'crop_corn_sugar', 'NODE-04', 62.5, 23.8, 6.2, 30)
ON CONFLICT (id) DO NOTHING;
