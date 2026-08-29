/// <reference types="vite/client" />
import { supabase, isSupabaseConfigured } from './supabase';
import { TelemetryObservation } from '../types';

export interface SupabaseConnectionStatus {
  connected: boolean;
  url: string;
  message: string;
  error?: string;
  pingMs?: number;
}

export interface SupabaseTelemetryMetrics {
  totalCount: number;
  countToday: number;
  latestTimestamp: string | null;
  error?: string;
}

export interface InsertRecordResult {
  success: boolean;
  recordId?: string;
  timestamp?: string;
  error?: string;
  fallbackUsed?: boolean;
}

/**
 * B. Check Supabase database connectivity and return detailed status.
 */
export async function checkSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  const env = (import.meta as any).env || {};
  const dbUrl = env.VITE_SUPABASE_URL || 'Not configured';

  if (!isSupabaseConfigured) {
    return {
      connected: false,
      url: dbUrl,
      message: 'Supabase environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) missing or invalid.',
    };
  }

  const startTime = Date.now();
  try {
    const { data, error, status } = await supabase.from('telemetry_observations').select('id').limit(1);
    const pingMs = Date.now() - startTime;

    if (error && status !== 200 && status !== 406) {
      return {
        connected: false,
        url: dbUrl,
        message: `Query failed: ${error.message}`,
        error: error.message,
        pingMs,
      };
    }

    return {
      connected: true,
      url: dbUrl,
      message: 'Connected successfully to Supabase PostgreSQL database',
      pingMs,
    };
  } catch (err: any) {
    return {
      connected: false,
      url: dbUrl,
      message: `Connection exception: ${err?.message || 'Unknown error'}`,
      error: err?.message,
    };
  }
}

/**
 * B. Insert a test observation record to verify write permissions.
 */
export async function insertTestRecord(): Promise<InsertRecordResult> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: 'Supabase is not configured',
    };
  }

  const testId = `test_obs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nowIso = new Date().toISOString();

  const testRow = {
    id: testId,
    farm_id: 'farm_iiit_dharwad',
    plot_id: 'sec_a_tomato',
    device_id: 'NODE-TEST',
    sensor_id: 'NODE-TEST',
    parameter_key: 'soil_moisture',
    display_name: 'Test Soil Moisture',
    value: 65.4,
    unit: '%',
    measurement_timestamp: nowIso,
    received_timestamp: nowIso,
    quality_status: 'VALID',
    data_source: 'SIMULATED',
    notes: 'Supabase health check verification record',
    metadata: { isTest: true },
  };

  try {
    const { error } = await supabase.from('telemetry_observations').insert(testRow);
    if (error) {
      console.error('[SUPABASE HEALTH TEST FAILED]', error.message);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log(`[SUPABASE VERIFIED]\nRecord ID: ${testId}\nTimestamp: ${nowIso}`);
    return {
      success: true,
      recordId: testId,
      timestamp: nowIso,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to insert test record',
    };
  }
}

/**
 * B. Retrieve total telemetry records count and today's record count.
 */
export async function getTelemetryCount(): Promise<SupabaseTelemetryMetrics> {
  if (!isSupabaseConfigured) {
    return {
      totalCount: 0,
      countToday: 0,
      latestTimestamp: null,
      error: 'Supabase not configured',
    };
  }

  try {
    // 1. Total records count
    const { count: totalCount, error: countErr } = await supabase
      .from('telemetry_observations')
      .select('*', { count: 'exact', head: true });

    if (countErr) {
      throw countErr;
    }

    // 2. Records count today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count: countToday, error: todayErr } = await supabase
      .from('telemetry_observations')
      .select('*', { count: 'exact', head: true })
      .gte('measurement_timestamp', startOfDay.toISOString());

    // 3. Latest record timestamp
    const { data: latestData } = await supabase
      .from('telemetry_observations')
      .select('measurement_timestamp')
      .order('measurement_timestamp', { ascending: false })
      .limit(1);

    const latestTimestamp = latestData && latestData.length > 0 ? latestData[0].measurement_timestamp : null;

    return {
      totalCount: totalCount || 0,
      countToday: todayErr ? 0 : (countToday || 0),
      latestTimestamp,
    };
  } catch (err: any) {
    return {
      totalCount: 0,
      countToday: 0,
      latestTimestamp: null,
      error: err?.message || 'Failed to fetch metrics',
    };
  }
}
