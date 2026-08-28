import React, { useMemo, useState } from 'react';
import {
  Activity,
  Building2,
  ChevronDown,
  Clock,
  Cpu,
  Droplets,
  FlaskConical,
  Leaf,
  MapPin,
  Radio,
  Sprout,
  Thermometer,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { PrototypeModeBanner } from '../components/common/PrototypeModeBanner';
import { TelemetryObservation, PlotBed, Crop } from '../types';

// ─── Utilities ─────────────────────────────────────────────────────────────────

function fmtTs(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('en-IN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      });
}

function latestFor(
  obs: TelemetryObservation[],
  plotId: string,
  key: string
): TelemetryObservation | undefined {
  return obs
    .filter(o => o.plotId === plotId && o.parameterKey === key)
    .sort((a, b) => new Date(b.measurementTimestamp).getTime() - new Date(a.measurementTimestamp).getTime())[0];
}

/** Returns 'ok' | 'warn' | 'crit' | 'none' based on crop ideal range */
function rangeStatus(value: number | undefined, min: number, max: number): 'ok' | 'warn' | 'crit' | 'none' {
  if (value === undefined) return 'none';
  if (value >= min && value <= max) return 'ok';
  if (value < min * 0.85 || value > max * 1.15) return 'crit';
  return 'warn';
}

const STATUS_STYLES = {
  ok:   'text-emerald-600 font-extrabold',
  warn: 'text-amber-600 font-extrabold',
  crit: 'text-red-600 font-extrabold',
  none: 'text-slate-400 font-normal',
};

// ─── Sub-components ─────────────────────────────────────────────────────────────

interface MetricCellProps {
  icon: React.ReactNode;
  label: string;
  obs: TelemetryObservation | undefined;
  status: 'ok' | 'warn' | 'crit' | 'none';
}
const MetricCell: React.FC<MetricCellProps> = ({ icon, label, obs, status }) => (
  <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 px-3 py-3 gap-1 min-w-[80px]">
    <div className="text-slate-400">{icon}</div>
    <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{label}</div>
    <div className={`text-sm tabular-nums ${STATUS_STYLES[status]}`}>
      {obs ? `${obs.value}${obs.unit}` : '—'}
    </div>
  </div>
);

// ─── Main Row ───────────────────────────────────────────────────────────────────

interface SectionRowProps {
  plot: PlotBed;
  crop: Crop | null;
  farmName: string;
  observations: TelemetryObservation[];
  index: number;
}

const SectionRow: React.FC<SectionRowProps> = ({ plot, crop, farmName, observations, index }) => {
  const [expanded, setExpanded] = useState(false);
  const sensorId = plot.sensorNodeId || plot.sensorId || '—';

  const tempObs = latestFor(observations, plot.id, 'air_temperature');
  const humObs  = latestFor(observations, plot.id, 'humidity');
  const smObs   = latestFor(observations, plot.id, 'soil_moisture');
  const phObs   = latestFor(observations, plot.id, 'soil_ph');

  const timestamps = [tempObs, humObs, smObs, phObs]
    .filter(Boolean)
    .map(o => new Date(o!.measurementTimestamp).getTime());
  const lastUpdated = timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : null;
  const hasData = timestamps.length > 0;

  const tStatus  = crop ? rangeStatus(tempObs?.value, crop.idealTempMin,     crop.idealTempMax)     : 'none';
  const smStatus = crop ? rangeStatus(smObs?.value,  crop.idealMoistureMin,  crop.idealMoistureMax) : 'none';
  const phStatus = crop ? rangeStatus(phObs?.value,  crop.idealPhMin,        crop.idealPhMax)       : 'none';
  const humStatus: 'ok' | 'warn' | 'crit' | 'none' = hasData ? (humObs ? 'ok' : 'none') : 'none';

  // Worst status for the row indicator
  const overallBad = [tStatus, smStatus, phStatus].includes('crit')
    ? 'crit'
    : [tStatus, smStatus, phStatus].includes('warn')
    ? 'warn'
    : hasData ? 'ok' : 'none';

  const rowAccent = {
    ok:   'border-l-emerald-400',
    warn: 'border-l-amber-400',
    crit: 'border-l-red-400',
    none: 'border-l-slate-200',
  }[overallBad];

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${rowAccent} shadow-xs overflow-hidden transition-all`}>
      {/* ── Collapsed row (always visible) ── */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-slate-50/60 transition-colors"
      >
        {/* Index badge */}
        <div className="shrink-0 w-7 h-7 rounded-lg bg-slate-100 text-slate-500 text-xs font-black flex items-center justify-center">
          {index + 1}
        </div>

        {/* Section + Crop */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-semibold mb-0.5">
            <Building2 className="w-3 h-3" />
            <span>{farmName}</span>
            <span className="text-slate-300">›</span>
            <Leaf className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-600 font-bold">{plot.code}</span>
          </div>
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-sm font-black text-slate-900">{plot.code}</span>
            <span className="text-sm text-slate-500">{plot.name}</span>
          </div>
          {crop ? (
            <div className="flex items-center space-x-1 mt-0.5">
              <Sprout className="w-3 h-3 text-emerald-500" />
              <span className="text-[11px] text-emerald-700 font-bold">{crop.name}</span>
              <span className="text-[11px] text-slate-400">({crop.variety})</span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 italic">No crop assigned</span>
          )}
        </div>

        {/* Sensor */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-bold text-slate-700">{sensorId}</span>
        </div>

        {/* Quick metric pills */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <span className={`text-xs tabular-nums px-2 py-1 rounded-lg border ${
            tStatus === 'ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            tStatus === 'warn' ? 'bg-amber-50 text-amber-700 border-amber-200' :
            tStatus === 'crit' ? 'bg-red-50 text-red-700 border-red-200' :
            'bg-slate-50 text-slate-400 border-slate-100'
          } font-bold`}>
            🌡 {tempObs ? `${tempObs.value}${tempObs.unit}` : '—'}
          </span>
          <span className={`text-xs tabular-nums px-2 py-1 rounded-lg border ${
            smStatus === 'ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            smStatus === 'warn' ? 'bg-amber-50 text-amber-700 border-amber-200' :
            smStatus === 'crit' ? 'bg-red-50 text-red-700 border-red-200' :
            'bg-slate-50 text-slate-400 border-slate-100'
          } font-bold`}>
            💧 {smObs ? `${smObs.value}${smObs.unit}` : '—'}
          </span>
        </div>

        {/* Status chip + expand icon */}
        <div className="flex items-center space-x-2 shrink-0">
          {hasData ? (
            <span className="flex items-center space-x-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              <span>Live</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
              <AlertCircle className="w-3 h-3" />
              <span>No data</span>
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* ── Expanded detail panel ── */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 space-y-4">
          {/* Hierarchy trail */}
          <div className="flex items-center flex-wrap gap-1.5 text-[11px] font-bold text-slate-500">
            <span className="flex items-center space-x-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span>{farmName}</span>
            </span>
            <span className="text-slate-300">›</span>
            <span className="flex items-center space-x-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              <Leaf className="w-3 h-3 text-emerald-400" />
              <span>{plot.code} — {plot.name}</span>
            </span>
            <span className="text-slate-300">›</span>
            {crop && (
              <>
                <span className="flex items-center space-x-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <Sprout className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-700">{crop.name} ({crop.variety})</span>
                </span>
                <span className="text-slate-300">›</span>
              </>
            )}
            <span className="flex items-center space-x-1 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
              <Cpu className="w-3 h-3 text-indigo-400" />
              <span className="text-indigo-700">{sensorId}</span>
            </span>
          </div>

          {/* 4-metric grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCell
              icon={<Thermometer className="w-4 h-4" />}
              label="Temperature"
              obs={tempObs}
              status={tStatus}
            />
            <MetricCell
              icon={<Droplets className="w-4 h-4" />}
              label="Humidity"
              obs={humObs}
              status={humStatus}
            />
            <MetricCell
              icon={<Droplets className="w-4 h-4 text-blue-400" />}
              label="Soil Moisture"
              obs={smObs}
              status={smStatus}
            />
            <MetricCell
              icon={<FlaskConical className="w-4 h-4 text-violet-400" />}
              label="Soil pH"
              obs={phObs}
              status={phStatus}
            />
          </div>

          {/* Crop ideal ranges (if crop assigned) */}
          {crop && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="bg-white rounded-xl border border-slate-100 px-3 py-2">
                <div className="text-slate-400 font-semibold mb-0.5">Ideal Temp</div>
                <div className="font-bold text-slate-700">{crop.idealTempMin}–{crop.idealTempMax} °C</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 px-3 py-2">
                <div className="text-slate-400 font-semibold mb-0.5">Ideal Moisture</div>
                <div className="font-bold text-slate-700">{crop.idealMoistureMin}–{crop.idealMoistureMax} %</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 px-3 py-2">
                <div className="text-slate-400 font-semibold mb-0.5">Ideal pH</div>
                <div className="font-bold text-slate-700">{crop.idealPhMin}–{crop.idealPhMax}</div>
              </div>
            </div>
          )}

          {/* Footer: source traceability */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200 text-[11px]">
            <div className="flex items-center space-x-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-semibold">Last reading:</span>
              <span className="font-bold text-slate-700 tabular-nums">{fmtTs(lastUpdated)}</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-slate-400 font-semibold">farmId: <span className="text-slate-600 font-bold">{plot.farmId || '—'}</span></span>
              <span className="text-slate-400 font-semibold">plotId: <span className="text-slate-600 font-bold">{plot.id}</span></span>
              <span className={`font-extrabold uppercase ${
                hasData
                  ? (smObs?.dataSource === 'SIMULATED' ? 'text-emerald-700' : 'text-indigo-700')
                  : 'text-slate-400'
              }`}>
                {hasData ? (smObs?.dataSource || 'SIMULATED') : 'NO DATA'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Page ───────────────────────────────────────────────────────────────────────

export const FarmTelemetryExplorer: React.FC = () => {
  const {
    activeSections: plots,
    activeFarmland,
    crops,
    farmlands,
    telemetryObservations,
    isDemoTelemetryActive,
    selectFarmland,
  } = useAgriStore();

  const [farmFilter, setFarmFilter] = useState<string>('');

  // Summary counts
  const summary = useMemo(() => {
    let live = 0;
    let noData = 0;
    let critCount = 0;
    plots.forEach(plot => {
      const crop = crops.find(c => c.id === plot.cropId) || null;
      const hasAny = ['air_temperature', 'humidity', 'soil_moisture', 'soil_ph'].some(
        key => latestFor(telemetryObservations, plot.id, key)
      );
      if (hasAny) live++; else noData++;
      if (crop) {
        const sm = latestFor(telemetryObservations, plot.id, 'soil_moisture');
        if (rangeStatus(sm?.value, crop.idealMoistureMin, crop.idealMoistureMax) === 'crit') critCount++;
      }
    });
    return { live, noData, critCount, total: plots.length };
  }, [plots, crops, telemetryObservations]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-800 pb-10">
      <PrototypeModeBanner />

      {/* ── Page Header ── */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h1 className="text-xl font-bold text-slate-900">Farm Telemetry Explorer</h1>
                {isDemoTelemetryActive && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">
                    SIMULATED STREAM ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Every reading traced to its exact Farm → Section → Sensor source
              </p>
            </div>
          </div>

          {/* Farm selector */}
          {farmlands.length > 1 && (
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <select
                value={farmFilter || activeFarmland?.id || ''}
                onChange={e => { setFarmFilter(e.target.value); selectFarmland(e.target.value); }}
                className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                {farmlands.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── Active Farm banner ── */}
      {activeFarmland && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase font-extrabold tracking-wider">Active Farm</div>
              <div className="text-white font-black text-base">{activeFarmland.name}</div>
              <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
                <MapPin className="w-3 h-3" />
                <span>{activeFarmland.location}</span>
              </div>
            </div>
          </div>

          {/* Summary stats */}
          <div className="flex items-center gap-3">
            <div className="text-center bg-white/10 rounded-xl px-4 py-2">
              <div className="text-xs text-slate-400">Sections</div>
              <div className="text-lg font-black text-white">{summary.total}</div>
            </div>
            <div className="text-center bg-emerald-500/20 rounded-xl px-4 py-2">
              <div className="text-xs text-emerald-400">Live Data</div>
              <div className="text-lg font-black text-emerald-300">{summary.live}</div>
            </div>
            <div className="text-center bg-slate-500/20 rounded-xl px-4 py-2">
              <div className="text-xs text-slate-400">No Data</div>
              <div className="text-lg font-black text-slate-300">{summary.noData}</div>
            </div>
            {summary.critCount > 0 && (
              <div className="text-center bg-red-500/20 rounded-xl px-4 py-2">
                <div className="text-xs text-red-400">Critical</div>
                <div className="text-lg font-black text-red-300">{summary.critCount}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Section rows ── */}
      {plots.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Radio className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <div className="text-sm">No sections configured for this farm.</div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              {plots.length} section{plots.length !== 1 ? 's' : ''} — click any row to expand
            </div>
            <div className="flex items-center space-x-1 text-[10px] text-slate-400">
              <RefreshCw className="w-3 h-3" />
              <span>Auto-updated from Firestore</span>
            </div>
          </div>

          {plots.map((plot, i) => (
            <SectionRow
              key={plot.id}
              plot={plot}
              crop={crops.find(c => c.id === plot.cropId) || null}
              farmName={activeFarmland?.name || 'Farm'}
              observations={telemetryObservations}
              index={i}
            />
          ))}
        </div>
      )}

      {/* ── Legend ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-x-6 gap-y-2 text-[11px]">
        <div className="font-extrabold text-slate-500 uppercase tracking-wider self-center">Legend:</div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-600 font-semibold">Within ideal crop range</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-slate-600 font-semibold">Slightly outside ideal</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-slate-600 font-semibold">Critical — attention needed</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="text-slate-600 font-semibold">No reading yet</span>
        </div>
      </div>
    </div>
  );
};

export default FarmTelemetryExplorer;
