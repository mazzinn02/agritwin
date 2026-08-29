-- Supabase Migration: Initial Schema for AgriTwin Crop Digital Twin System
-- File: supabase/migrations/001_initial_schema.sql

CREATE TABLE IF NOT EXISTS telemetry_observations (
 id TEXT PRIMARY KEY,
 farm_id TEXT,
 plot_id TEXT,
 device_id TEXT,
 sensor_id TEXT,
 parameter_key TEXT,
 display_name TEXT,
 value NUMERIC,
 unit TEXT,
 measurement_timestamp TIMESTAMPTZ,
 received_timestamp TIMESTAMPTZ,
 quality_status TEXT,
 data_source TEXT,
 notes TEXT,
 metadata JSONB
);

CREATE TABLE IF NOT EXISTS farms (
 id TEXT PRIMARY KEY,
 name TEXT,
 location TEXT,
 total_area NUMERIC,
 unit TEXT,
 sections_count INTEGER
);

CREATE TABLE IF NOT EXISTS plots (
 id TEXT PRIMARY KEY,
 farm_id TEXT,
 code TEXT,
 name TEXT,
 area NUMERIC,
 area_unit TEXT,
 crop_id TEXT,
 sensor_node_id TEXT,
 soil_moisture NUMERIC,
 air_temp NUMERIC,
 soil_ph NUMERIC,
 days_planted INTEGER
);

-- Enable Supabase Realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE telemetry_observations;
ALTER PUBLICATION supabase_realtime ADD TABLE farms;
ALTER PUBLICATION supabase_realtime ADD TABLE plots;

-- Enable RLS Policies for public access (Demo / App prototype access)
ALTER TABLE telemetry_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read on telemetry_observations" ON telemetry_observations FOR SELECT USING (true);
CREATE POLICY "Public insert/update on telemetry_observations" ON telemetry_observations FOR ALL USING (true);

CREATE POLICY "Public read on farms" ON farms FOR SELECT USING (true);
CREATE POLICY "Public insert/update on farms" ON farms FOR ALL USING (true);

CREATE POLICY "Public read on plots" ON plots FOR SELECT USING (true);
CREATE POLICY "Public insert/update on plots" ON plots FOR ALL USING (true);
