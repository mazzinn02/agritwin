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
  isSupabaseConfigured
    ? `Connected: ${SUPABASE_URL}`
    : 'Standby Mode (Set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY)'
);

// ── Column mapper: TelemetryObservation → Supabase row ──────────────────────
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

// ── Column mapper: Supabase row → TelemetryObservation ──────────────────────
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

// ── Toast Event Emitter ──────────────────────────────────────────────────────
type ToastCallback = (message: string, type: 'success' | 'warning' | 'error') => void;
const toastListeners: Set<ToastCallback> = new Set();

export function onSupabaseToast(callback: ToastCallback): () => void {
  toastListeners.add(callback);
  return () => toastListeners.delete(callback);
}

function emitToast(message: string, type: 'success' | 'warning' | 'error') {
  toastListeners.forEach((cb) => cb(message, type));
}

// ── Realtime Status Tracker ──────────────────────────────────────────────────
export type RealtimeStatusType = 'Connected' | 'Disconnected' | 'Reconnecting';
let currentRealtimeStatus: RealtimeStatusType = isSupabaseConfigured
  ? 'Connected'
  : 'Disconnected';
const statusListeners: Set<(status: RealtimeStatusType) => void> = new Set();

export function onRealtimeStatusChange(
  callback: (status: RealtimeStatusType) => void
): () => void {
  statusListeners.add(callback);
  callback(currentRealtimeStatus);
  return () => statusListeners.delete(callback);
}

export function setRealtimeStatus(status: RealtimeStatusType) {
  currentRealtimeStatus = status;
  statusListeners.forEach((cb) => cb(status));
}

// ── 1. Single Observation Insert ─────────────────────────────────────────────
export async function saveTelemetryObservationToSupabase(
  obs: TelemetryObservation
): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const row = mapObsToSupabaseRow(obs);
    const { error } = await supabase.from('telemetry_observations').upsert(row);
    if (error) {
      console.error('[SUPABASE WRITE ERROR]', error.message);
    } else {
      console.log(
        `[SUPABASE VERIFIED]\nRecord ID: ${obs.id}\nTimestamp: ${obs.measurementTimestamp}`
      );
      emitToast('Telemetry saved to Supabase successfully', 'success');
    }
  } catch (err: any) {
    console.error('[SUPABASE WRITE EXCEPTION]', err?.message);
  }
}

// ── 2. Batch Observation Insert ──────────────────────────────────────────────
export async function saveTelemetryBatchToSupabase(
  observations: TelemetryObservation[]
): Promise<void> {
  if (!isSupabaseConfigured || !observations || observations.length === 0) return;
  try {
    const rows = observations.map(mapObsToSupabaseRow);
    const { error } = await supabase.from('telemetry_observations').upsert(rows);
    if (error) {
      console.error('[SUPABASE BATCH WRITE ERROR]', error.message);
    } else {
      const last = observations[observations.length - 1];
      console.log(
        `[SUPABASE VERIFIED]\nRecord ID: ${last.id}\nTimestamp: ${last.measurementTimestamp}`
      );
      console.log(
        `%c[SUPABASE WRITE SUCCESS] Inserted ${observations.length} telemetry records`,
        'color: #3ecf8e; font-weight: bold;'
      );
      emitToast(
        `Telemetry saved to Supabase successfully (${observations.length} records)`,
        'success'
      );
    }
  } catch (err: any) {
    console.error('[SUPABASE BATCH EXCEPTION]', err?.message);
  }
}

// ── 3. Realtime Multi-Table Subscription ────────────────────────────────────
//
// FIX: "cannot add postgres_changes callbacks after subscribe()"
//
// Root cause: Supabase's JS client caches channels by name. If a channel with
// the same name is removed and re-created, `.channel(sameNname)` returns the
// OLD cached object that already had `.subscribe()` called — adding `.on()`
// to it afterwards throws the error.
//
// Solution: 
//   1. Always build the FULL chain  .channel().on().subscribe()  in one shot
//      before any status callback logic runs.
//   2. Each reconnect uses a unique channel name (suffixed with a counter) so
//      the client never returns a stale cached object.
//   3. Reconnect timers are cleared when the outer cleanup runs so there are
//      no dangling setTimeout calls after unmount.
//
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

  // Track active channels and pending reconnect timers so cleanup is complete
  const activeChannels: RealtimeChannel[] = [];
  const reconnectTimers: ReturnType<typeof setTimeout>[] = [];
  let destroyed = false; // set true on cleanup — stops reconnect attempts

  // Initial REST fetch to hydrate telemetry state
  supabase
    .from('telemetry_observations')
    .select('*')
    .order('measurement_timestamp', { ascending: false })
    .limit(100)
    .then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        onTelemetry(data.map(mapSupabaseRowToObs));
      }
    });

  // ── Core helper: builds a fresh channel with a UNIQUE name each call ───────
  // The counter suffix guarantees the Supabase client never returns a stale
  // cached channel object, eliminating the "after subscribe()" error entirely.
  let channelCounter = 0;

  function createChannel(
    baseName: string,
    table: string,
    handler: (payload: any) => void,
    logTag: string
  ): RealtimeChannel {
    // Unique name prevents cache collisions on reconnect
    const uniqueName = `${baseName}_${++channelCounter}`;

    // IMPORTANT: .on() MUST be called before .subscribe() — this is enforced
    // by building the full chain in a single expression with no gaps.
    const ch = supabase
      .channel(uniqueName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        handler
      )
      .subscribe((status) => {
        console.log(`[REALTIME ${logTag} CHANNEL] ${status}`);

        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('Connected');
        } else if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          if (destroyed) return; // component unmounted — stop
          setRealtimeStatus('Reconnecting');

          // Remove stale channel, then schedule a fresh one after 3 s
          supabase.removeChannel(ch);
          const idx = activeChannels.indexOf(ch);
          if (idx !== -1) activeChannels.splice(idx, 1);

          const timer = setTimeout(() => {
            if (destroyed) return;
            const newCh = createChannel(baseName, table, handler, logTag);
            activeChannels.push(newCh);
          }, 3000);

          reconnectTimers.push(timer);
        }
      });

    return ch;
  }

  // ── Subscribe: telemetry_observations ────────────────────────────────────
  activeChannels.push(
    createChannel(
      'telemetry_obs',
      'telemetry_observations',
      (payload) => {
        if (payload.new) {
          onTelemetry([mapSupabaseRowToObs(payload.new)]);
        }
      },
      'TELEMETRY'
    )
  );

  // ── Subscribe: farms ──────────────────────────────────────────────────────
  activeChannels.push(
    createChannel(
      'farms',
      'farms',
      () => {
        if (onFarmsUpdate) {
          supabase
            .from('farms')
            .select('*')
            .then(({ data }) => { if (data) onFarmsUpdate(data); });
        }
      },
      'FARMS'
    )
  );

  // ── Subscribe: plots ──────────────────────────────────────────────────────
  activeChannels.push(
    createChannel(
      'plots',
      'plots',
      () => {
        if (onPlotsUpdate) {
          supabase
            .from('plots')
            .select('*')
            .then(({ data }) => { if (data) onPlotsUpdate(data); });
        }
      },
      'PLOTS'
    )
  );

  // ── Subscribe: sensors ────────────────────────────────────────────────────
  activeChannels.push(
    createChannel(
      'sensors',
      'sensors',
      () => {
        if (onSensorsUpdate) {
          supabase
            .from('sensors')
            .select('*')
            .then(({ data }) => { if (data) onSensorsUpdate(data); });
        }
      },
      'SENSORS'
    )
  );

  // ── Cleanup: remove all channels and cancel pending reconnect timers ──────
  return () => {
    destroyed = true;
    reconnectTimers.forEach(clearTimeout);
    activeChannels.forEach((ch) => supabase.removeChannel(ch));
    activeChannels.length = 0;
    setRealtimeStatus('Disconnected');
  };
}

// ── 4. Save Farms to Supabase ────────────────────────────────────────────────
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

// ── 5. Save Plots to Supabase ────────────────────────────────────────────────
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
      crop_type: p.cropType || null,
      growth_stage: p.growthStage || null,
      sensor_node_id: p.sensorNodeId || null,
      irrigation_status: p.irrigationStatus || 'Scheduled',
      soil_health_score: p.soilHealthScore || 88,
      soil_moisture: p.soilMoisture || null,
      air_temp: p.airTemp || null,
      soil_ph: p.soilPh || null,
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

// ── 6. Save Sensors to Supabase ──────────────────────────────────────────────
// Uses a minimal column set that matches the migration schema so that the
// call succeeds even when optional columns are not yet present.
export async function saveSensorsToSupabase(sensors: any[]): Promise<void> {
  if (!isSupabaseConfigured || !sensors || sensors.length === 0) return;
  try {
    const rows = sensors.map((s) => ({
      id: s.id,
      farm_id: s.farmId || null,
      plot_id: s.plotId || null,
      sensor_code: s.sensorCode || s.id,
      sensor_type: s.type || 'Sensor',
      assigned_plot_code: s.assignedPlotCode || null,
      battery_pct: s.batteryPct ?? 95,
      status: s.status || 'Online',
      last_ping: s.lastPing || new Date().toISOString(),
      current_reading: s.currentReading || null,
    }));
    const { error } = await supabase.from('sensors').upsert(rows);
    if (!error) {
      console.log(`[SUPABASE] Synced ${sensors.length} sensor(s) → public.sensors`);
    } else {
      // Table may not exist yet — log as warning, not error, so app keeps running
      console.warn('[SUPABASE SENSORS NOTICE]', error.message);
    }
  } catch (err: any) {
    console.warn('[SUPABASE SENSORS EXCEPTION]', err?.message);
  }
}

// ── 6b. Update Single Sensor Current Reading in Supabase ──────────────────────
export async function updateSensorReadingInSupabase(
  sensorId: string,
  newValue: string
): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase
      .from('sensors')
      .update({
        current_reading: newValue,
        last_ping: new Date().toISOString()
      })
      .eq('id', sensorId);

    if (error) {
      console.warn(`[SUPABASE SENSOR UPDATE ERROR] ${sensorId}:`, error.message);
    }
  } catch (err: any) {
    console.warn(`[SUPABASE SENSOR UPDATE EXCEPTION] ${sensorId}:`, err?.message);
  }
}

// ── 7. Get All Table Row Counts ──────────────────────────────────────────────
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
    // Run all count queries in parallel; treat any individual 404 as 0 rows
    const [farmsRes, plotsRes, sensorsRes, telemetryRes] = await Promise.all([
      supabase.from('farms').select('*', { count: 'exact', head: true }),
      supabase.from('plots').select('*', { count: 'exact', head: true }),
      supabase.from('sensors').select('*', { count: 'exact', head: true }),
      supabase.from('telemetry_observations').select('*', { count: 'exact', head: true }),
    ]);

    return {
      farmsCount: farmsRes.count ?? 0,
      plotsCount: plotsRes.count ?? 0,
      sensorsCount: sensorsRes.count ?? 0,
      telemetryCount: telemetryRes.count ?? 0,
    };
  } catch {
    return { farmsCount: 0, plotsCount: 0, sensorsCount: 0, telemetryCount: 0 };
  }
}
