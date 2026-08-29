/// <reference types="vite/client" />
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { TelemetryObservation } from '../types';

const env = (import.meta as any).env || {};
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'public-anon-key-placeholder';

export const isSupabaseConfigured = Boolean(
  env.VITE_SUPABASE_URL && 
  env.VITE_SUPABASE_ANON_KEY &&
  !env.VITE_SUPABASE_URL.includes('xyzcompany')
);

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

console.log(
  `%c[SUPABASE CLIENT] Initialized`,
  'color: #3ecf8e; font-weight: bold;',
  isSupabaseConfigured ? `Connected: ${SUPABASE_URL}` : 'Standby Mode (Set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY)'
);

// Map TelemetryObservation object to Supabase column names
export const mapObsToSupabaseRow = (obs: TelemetryObservation) => ({
  id: obs.id,
  farm_id: obs.farmId,
  plot_id: obs.plotId,
  device_id: obs.deviceId,
  sensor_id: obs.sensorId,
  parameter_key: obs.parameterKey,
  display_name: obs.displayName,
  value: obs.value,
  unit: obs.unit,
  measurement_timestamp: obs.measurementTimestamp,
  received_timestamp: obs.receivedTimestamp || new Date().toISOString(),
  quality_status: obs.qualityStatus || 'VALID',
  data_source: obs.dataSource || 'SIMULATED',
  notes: obs.notes || null,
  metadata: obs.metadata || {},
});

// Map Supabase table row to TelemetryObservation object
export const mapSupabaseRowToObs = (row: any): TelemetryObservation => ({
  id: row.id,
  farmId: row.farm_id,
  plotId: row.plot_id,
  deviceId: row.device_id,
  sensorId: row.sensor_id,
  parameterKey: row.parameter_key,
  displayName: row.display_name,
  value: Number(row.value),
  unit: row.unit,
  measurementTimestamp: row.measurement_timestamp,
  receivedTimestamp: row.received_timestamp,
  qualityStatus: row.quality_status as any,
  dataSource: row.data_source as any,
  notes: row.notes || undefined,
  metadata: row.metadata || {},
});

// ── Notification / Toast Event Emitter ─────────────────────────────────────
type ToastCallback = (message: string, type: 'success' | 'warning' | 'error') => void;
const toastListeners: Set<ToastCallback> = new Set();

export function onSupabaseToast(callback: ToastCallback): () => void {
  toastListeners.add(callback);
  return () => toastListeners.delete(callback);
}

function emitToast(message: string, type: 'success' | 'warning' | 'error') {
  toastListeners.forEach(cb => cb(message, type));
}

// ── Realtime Channels Status Tracker ───────────────────────────────────────
export type RealtimeStatusType = 'Connected' | 'Disconnected' | 'Reconnecting';
let currentRealtimeStatus: RealtimeStatusType = isSupabaseConfigured ? 'Connected' : 'Disconnected';
const statusListeners: Set<(status: RealtimeStatusType) => void> = new Set();

export function onRealtimeStatusChange(callback: (status: RealtimeStatusType) => void): () => void {
  statusListeners.add(callback);
  callback(currentRealtimeStatus);
  return () => statusListeners.delete(callback);
}

export function setRealtimeStatus(status: RealtimeStatusType) {
  currentRealtimeStatus = status;
  statusListeners.forEach(cb => cb(status));
}

// 1. Single Observation Insert with Verification Logging
export async function saveTelemetryObservationToSupabase(obs: TelemetryObservation): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const row = mapObsToSupabaseRow(obs);
    const { error } = await supabase.from('telemetry_observations').upsert(row);
    if (error) {
      console.error('[SUPABASE WRITE ERROR]', error.message);
    } else {
      console.log(`[SUPABASE VERIFIED]\nRecord ID: ${obs.id}\nTimestamp: ${obs.measurementTimestamp}`);
      emitToast('Telemetry saved to Supabase successfully', 'success');
    }
  } catch (err: any) {
    console.error('[SUPABASE WRITE EXCEPTION]', err?.message);
  }
}

// 2. Batch Observation Insert (12-second simulator cycles)
export async function saveTelemetryBatchToSupabase(observations: TelemetryObservation[]): Promise<void> {
  if (!isSupabaseConfigured || !observations || observations.length === 0) return;
  try {
    const rows = observations.map(mapObsToSupabaseRow);
    const { error } = await supabase.from('telemetry_observations').upsert(rows);
    if (error) {
      console.error('[SUPABASE BATCH WRITE ERROR]', error.message);
    } else {
      const lastRecord = observations[observations.length - 1];
      console.log(`[SUPABASE VERIFIED]\nRecord ID: ${lastRecord.id}\nTimestamp: ${lastRecord.measurementTimestamp}`);
      console.log(
        `%c[SUPABASE WRITE SUCCESS] Inserted ${observations.length} telemetry records into public.telemetry_observations`,
        'color: #3ecf8e; font-weight: bold;'
      );
      emitToast(`Telemetry saved to Supabase successfully (${observations.length} records)`, 'success');
    }
  } catch (err: any) {
    console.error('[SUPABASE BATCH EXCEPTION]', err?.message);
  }
}

// 3. Real-Time Multi-Table Telemetry Subscription (telemetry_observations, farms, plots, sensors)
export function subscribeToSupabaseMultiTable(
  onTelemetry: (obs: TelemetryObservation[]) => void,
  onFarmsUpdate?: (farms: any[]) => void,
  onPlotsUpdate?: (plots: any[]) => void,
  onSensorsUpdate?: (sensors: any[]) => void
): () => void {
  if (!isSupabaseConfigured) {
    setRealtimeStatus('Disconnected');
    return () => {};
  }

  setRealtimeStatus('Connected');

  // Initial fetch for telemetry (last 100 records)
  supabase
    .from('telemetry_observations')
    .select('*')
    .order('measurement_timestamp', { ascending: false })
    .limit(100)
    .then(({ data, error }) => {
      if (!error && data) {
        onTelemetry(data.map(mapSupabaseRowToObs));
      }
    });

  // ── ERROR 4 FIX: Auto-reconnect helper ─────────────────────────────────────
  // Supabase channels report CLOSED status — we re-subscribe automatically
  const withAutoReconnect = (
    channelName: string,
    table: string,
    handler: (payload: any) => void,
    statusTag: string
  ): RealtimeChannel => {
    const ch = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        handler
      )
      .subscribe((status) => {
        console.log(`[REALTIME ${statusTag} CHANNEL] ${status}`);
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('Connected');
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('Reconnecting');
          // Remove and resubscribe after 3s
          setTimeout(() => {
            supabase.removeChannel(ch);
            withAutoReconnect(channelName, table, handler, statusTag);
          }, 3000);
        } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
          setRealtimeStatus('Reconnecting');
          setTimeout(() => {
            supabase.removeChannel(ch);
            withAutoReconnect(channelName, table, handler, statusTag);
          }, 3000);
        }
      });
    return ch;
  };

  // Subscribe to telemetry_observations
  const telemetryChannel = withAutoReconnect(
    'telemetry_observations_stream',
    'telemetry_observations',
    (payload) => {
      if (payload.new) {
        const newObs = mapSupabaseRowToObs(payload.new);
        onTelemetry([newObs]);
      }
    },
    'TELEMETRY'
  );

  // Subscribe to farms
  const farmsChannel = withAutoReconnect(
    'farms_stream',
    'farms',
    () => {
      if (onFarmsUpdate) {
        supabase.from('farms').select('*').then(({ data }) => {
          if (data) onFarmsUpdate(data);
        });
      }
    },
    'FARMS'
  );

  // Subscribe to plots
  const plotsChannel = withAutoReconnect(
    'plots_stream',
    'plots',
    () => {
      if (onPlotsUpdate) {
        supabase.from('plots').select('*').then(({ data }) => {
          if (data) onPlotsUpdate(data);
        });
      }
    },
    'PLOTS'
  );

  // ERROR 3 / 4 FIX: Subscribe to sensors (new table)
  const sensorsChannel = withAutoReconnect(
    'sensors_stream',
    'sensors',
    () => {
      if (onSensorsUpdate) {
        supabase.from('sensors').select('*').then(({ data }) => {
          if (data) onSensorsUpdate(data);
        });
      }
    },
    'SENSORS'
  );

  return () => {
    supabase.removeChannel(telemetryChannel);
    supabase.removeChannel(farmsChannel);
    supabase.removeChannel(plotsChannel);
    supabase.removeChannel(sensorsChannel);
    setRealtimeStatus('Disconnected');
  };
}

// 4. Save Farms to Supabase
export async function saveFarmsToSupabase(farms: any[]): Promise<void> {
  if (!isSupabaseConfigured || !farms || farms.length === 0) return;
  try {
    const rows = farms.map((f) => ({
      id: f.id,
      name: f.name,
      location: f.location,
      total_area: f.totalArea,
      unit: f.unit || 'acres',
      sections_count: f.sectionsCount || 4,
    }));
    const { error } = await supabase.from('farms').upsert(rows);
    if (!error) {
      console.log(`[SUPABASE] Synced ${farms.length} farm(s) → public.farms`);
    } else {
      console.warn('[SUPABASE FARMS NOTICE]', error.message);
    }
  } catch (err: any) {
    console.warn('[SUPABASE FARMS EXCEPTION]', err?.message);
  }
}

// 5. Save Plots to Supabase
export async function savePlotsToSupabase(plots: any[]): Promise<void> {
  if (!isSupabaseConfigured || !plots || plots.length === 0) return;
  try {
    const rows = plots.map((p) => ({
      id: p.id,
      farm_id: p.farmId,
      code: p.code,
      name: p.name,
      area: p.area,
      area_unit: p.areaUnit || 'acres',
      crop_type: p.cropType || p.name,
      growth_stage: p.growthStage || 'Vegetative',
      sensor_node_id: p.sensorNodeId,
      irrigation_status: p.irrigationStatus || 'Scheduled',
      soil_health_score: p.soilHealthScore || 88,
      soil_moisture: p.soilMoisture,
      air_temp: p.airTemp,
      soil_ph: p.soilPh,
    }));
    const { error } = await supabase.from('plots').upsert(rows);
    if (!error) {
      console.log(`[SUPABASE] Synced ${plots.length} plot(s) → public.plots`);
    } else {
      console.warn('[SUPABASE PLOTS NOTICE]', error.message);
    }
  } catch (err: any) {
    console.warn('[SUPABASE PLOTS EXCEPTION]', err?.message);
  }
}

// 6. Save Sensors to Supabase
export async function saveSensorsToSupabase(sensors: any[]): Promise<void> {
  if (!isSupabaseConfigured || !sensors || sensors.length === 0) return;
  try {
    const rows = sensors.map((s) => ({
      id: s.id,
      farm_id: s.farmId,
      plot_id: s.plotId,
      sensor_code: s.sensorCode || s.id,
      sensor_type: s.type || 'Sensor',
      assigned_plot_code: s.assignedPlotCode,
      battery_pct: s.batteryPct,
      status: s.status,
      last_ping: s.lastPing,
      current_reading: s.currentReading,
    }));
    const { error } = await supabase.from('sensors').upsert(rows);
    if (!error) {
      console.log(`[SUPABASE] Synced ${sensors.length} sensor(s) → public.sensors`);
    }
  } catch (err: any) {
    console.warn('[SUPABASE SENSORS EXCEPTION]', err?.message);
  }
}

// 7. Get All Table Counts for Verification Dashboard
export async function getSupabaseTableCounts(): Promise<{
  farmsCount: number;
  plotsCount: number;
  sensorsCount: number;
  telemetryCount: number;
}> {
  if (!isSupabaseConfigured) {
    return { farmsCount: 0, plotsCount: 0, sensorsCount: 0, telemetryCount: 0 };
  }
  try {
    const [farmsRes, plotsRes, sensorsRes, telemetryRes] = await Promise.all([
      supabase.from('farms').select('*', { count: 'exact', head: true }),
      supabase.from('plots').select('*', { count: 'exact', head: true }),
      supabase.from('sensors').select('*', { count: 'exact', head: true }),
      supabase.from('telemetry_observations').select('*', { count: 'exact', head: true }),
    ]);

    return {
      farmsCount: farmsRes.count || 0,
      plotsCount: plotsRes.count || 0,
      sensorsCount: sensorsRes.count || 0,
      telemetryCount: telemetryRes.count || 0,
    };
  } catch (e) {
    return { farmsCount: 0, plotsCount: 0, sensorsCount: 0, telemetryCount: 0 };
  }
}
