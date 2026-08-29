import React, { useState, useEffect } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Sprout,
  Radio,
  Droplets,
  Thermometer,
  Beaker,
  Wind,
  Activity,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Database,
  Cpu,
  MapPin,
  Clock,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { telemetrySimulator, DEMO_TELEMETRY_INTERVAL_MS } from '../services/telemetrySimulator';
import { FIRESTORE_DATABASE_ID } from '../lib/firebase';
import { isSupabaseConfigured } from '../lib/supabase';

function secsAgo(ts: number | null): string {
  if (ts === null) return 'Pending…';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ${s % 60}s ago`;
}

type SensorStatus = 'optimal' | 'warning' | 'critical' | 'neutral';

const statusStyles: Record<SensorStatus, { dot: string; badge: string; text: string }> = {
  optimal: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Optimal' },
  warning: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200', text: 'Warning' },
  critical: { dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200', text: 'Critical' },
  neutral: { dot: 'bg-slate-400', badge: 'bg-slate-50 text-slate-600 border-slate-200', text: 'No Crop' },
};

interface SensorRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  status: SensorStatus;
  paramKey: string;
}

const SensorRow: React.FC<SensorRowProps> = ({ icon, label, value, unit, status, paramKey }) => {
  const s = statusStyles[status];
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
          {icon}
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-700">{label}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            key: <span className="text-purple-500">{paramKey}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-base font-black text-slate-900">
            {value}<span className="text-xs font-semibold text-slate-400 ml-0.5">{unit}</span>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${s.badge}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`} />
          {s.text}
        </div>
      </div>
    </div>
  );
};

interface SectionCardProps {
  section: any;
  crop: any | null;
  telemetry: any[];
  lastCycle: number | null;
  isExpanded: boolean;
  onToggle: () => void;
}

const SectionCard: React.FC<SectionCardProps> = ({ section, crop, telemetry, lastCycle, isExpanded, onToggle }) => {
  const latestSm  = telemetry.find(o => o.plotId === section.id && o.parameterKey === 'soil_moisture');
  const latestTemp = telemetry.find(o => o.plotId === section.id && o.parameterKey === 'air_temperature');
  const latestPh  = telemetry.find(o => o.plotId === section.id && o.parameterKey === 'soil_ph');
  const latestHum = telemetry.find(o => o.plotId === section.id && o.parameterKey === 'humidity');

  const smVal   = latestSm?.value   ?? section.soilMoisture;
  const tempVal = latestTemp?.value ?? section.airTemp;
  const phVal   = latestPh?.value   ?? section.soilPh;
  const humVal  = latestHum?.value  ?? 72;

  const smStatus: SensorStatus = !crop ? 'neutral'
    : smVal < crop.idealMoistureMin - 10 ? 'critical'
    : smVal < crop.idealMoistureMin ? 'warning'
    : 'optimal';
  const tempStatus: SensorStatus = !crop ? 'neutral'
    : tempVal > crop.idealTempMax + 4 ? 'critical'
    : tempVal > crop.idealTempMax ? 'warning'
    : 'optimal';
  const phStatus: SensorStatus = !crop ? 'neutral'
    : phVal < crop.idealPhMin - 0.5 ? 'critical'
    : (phVal < crop.idealPhMin || phVal > crop.idealPhMax) ? 'warning'
    : 'optimal';

  const overallStatus: SensorStatus =
    [smStatus, tempStatus, phStatus].includes('critical') ? 'critical'
    : [smStatus, tempStatus, phStatus].includes('warning') ? 'warning'
    : crop ? 'optimal' : 'neutral';

  const statusRing = overallStatus === 'critical' ? 'border-rose-300'
    : overallStatus === 'warning' ? 'border-amber-300'
    : overallStatus === 'optimal' ? 'border-emerald-200'
    : 'border-slate-200';

  const lastUpdated = latestSm?.measurementTimestamp
    ? new Date(latestSm.measurementTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <div className={`border-2 rounded-2xl overflow-hidden transition-all duration-200 ${statusRing}`}>
      <button
        onClick={onToggle}
        className="w-full text-left bg-white px-5 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
            overallStatus === 'critical' ? 'bg-rose-100 text-rose-700'
            : overallStatus === 'warning' ? 'bg-amber-100 text-amber-700'
            : overallStatus === 'optimal' ? 'bg-emerald-100 text-emerald-700'
            : 'bg-slate-100 text-slate-500'
          }`}>
            {section.code.replace('SEC-', '')}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-slate-900">{section.code}</span>
              <span className="text-xs text-slate-400">—</span>
              <span className="text-sm font-bold text-slate-700">{section.name.replace(`${section.code} - `, '')}</span>
              {overallStatus === 'critical' && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold border border-rose-200">
                  <XCircle className="w-3 h-3" /> Critical
                </span>
              )}
              {overallStatus === 'warning' && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold border border-amber-200">
                  <AlertCircle className="w-3 h-3" /> Warning
                </span>
              )}
              {overallStatus === 'optimal' && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Optimal
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Sprout className="w-3 h-3 text-emerald-500" />
                {crop ? `${crop.name} · ${crop.variety}` : 'Fallow — No Crop'}
              </span>
              <span className="text-slate-200">·</span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Radio className="w-3 h-3 text-sky-500" />
                {section.sensorNodeId}
              </span>
              <span className="text-slate-200">·</span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lastUpdated}
              </span>
            </div>
          </div>
        </div>

        {/* Quick metrics */}
        <div className="hidden lg:flex items-center gap-4 mr-4">
          {[
            { val: `${smVal.toFixed(1)}%`, label: 'Moisture', color: 'text-sky-600' },
            { val: `${tempVal.toFixed(1)}°C`, label: 'Temp', color: 'text-amber-600' },
            { val: `${phVal.toFixed(2)}`, label: 'pH', color: 'text-emerald-600' },
          ].map(m => (
            <div key={m.label} className="text-center">
              <div className={`text-xs font-black ${m.color}`}>{m.val}</div>
              <div className="text-[9px] text-slate-400 uppercase tracking-wide">{m.label}</div>
            </div>
          ))}
        </div>

        {isExpanded
          ? <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
          : <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />}
      </button>

      {isExpanded && (
        <div className="bg-slate-50/60 border-t border-slate-100 p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Crop */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-3">
              <div className="p-1.5 bg-emerald-100 rounded-lg"><Sprout className="w-4 h-4 text-emerald-600" /></div>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">🌱 Crop</div>
                <div className="text-xs font-black text-slate-900">{crop ? crop.name : 'Fallow'}</div>
              </div>
            </div>
            {crop ? (
              <div className="space-y-2 text-xs">
                {[
                  ['Variety', crop.variety],
                  ['Duration', `${crop.growthDurationDays} days`],
                  ['Days Planted', `${section.daysPlanted} days`],
                  ['Ideal Moisture', `${crop.idealMoistureMin}–${crop.idealMoistureMax}%`],
                  ['Ideal Temp', `${crop.idealTempMin}–${crop.idealTempMax}°C`],
                  ['Ideal pH', `${crop.idealPhMin}–${crop.idealPhMax}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-bold text-slate-800">{v}</span>
                  </div>
                ))}
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <div className="text-[10px] text-slate-400 mb-1">Growth Progress</div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (section.daysPlanted / crop.growthDurationDays) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 text-right">
                    {Math.round((section.daysPlanted / crop.growthDurationDays) * 100)}% complete
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Fallow — no crop assigned.</p>
            )}
          </div>

          {/* Sensor Node */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-3">
              <div className="p-1.5 bg-sky-100 rounded-lg"><Radio className="w-4 h-4 text-sky-600" /></div>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">📡 Sensor Node</div>
                <div className="text-xs font-black text-slate-900">{section.sensorNodeId}</div>
              </div>
              <div className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-700">ONLINE</span>
              </div>
            </div>
            <div className="space-y-2 text-xs mb-3">
              {[
                ['Node ID', section.sensorNodeId],
                ['Plot ID', section.id],
                ['Farm ID', section.farmId],
                ['Data Source', 'SIMULATED'],
                ['Interval', `${DEMO_TELEMETRY_INTERVAL_MS / 1000}s`],
                ['Last Cycle', secsAgo(lastCycle)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-500">{k}</span>
                  <span className={`font-bold font-mono text-xs ${k === 'Data Source' ? 'text-purple-600' : 'text-slate-800'}`}>{v}</span>
                </div>
              ))}
            </div>
            <div className="p-2.5 bg-slate-900 rounded-xl text-[10px] font-mono">
              <div className="text-emerald-400 font-bold mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1"><Database className="w-3 h-3 text-emerald-400" /> Supabase DB</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${isSupabaseConfigured ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                  {isSupabaseConfigured ? 'CONNECTED' : 'STANDBY'}
                </span>
              </div>
              <div className="text-slate-300">table: <span className="text-sky-400">public.telemetry_observations</span></div>
              <div className="text-slate-300">filter: <span className="text-purple-400">plot_id="{section.id}"</span></div>
              <div className="text-slate-400 text-[9px] mt-1 border-t border-slate-800 pt-1">
                Schema: <span className="text-amber-400 font-bold">supabase_schema.sql</span> ready
              </div>
            </div>
          </div>

          {/* Live Readings */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-lg"><Activity className="w-4 h-4 text-purple-600" /></div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">📊 Live Readings</div>
                  <div className="text-[10px] text-purple-600 font-bold">SIMULATED → Firestore</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                <RefreshCw className="w-3 h-3" style={{ animation: 'spin 3s linear infinite' }} />
                {secsAgo(lastCycle)}
              </div>
            </div>

            <SensorRow icon={<Droplets className="w-4 h-4" />} label="Soil Moisture" value={smVal.toFixed(1)} unit="%" status={smStatus} paramKey="soil_moisture" />
            <SensorRow icon={<Thermometer className="w-4 h-4" />} label="Air Temperature" value={tempVal.toFixed(1)} unit="°C" status={tempStatus} paramKey="air_temperature" />
            <SensorRow icon={<Beaker className="w-4 h-4" />} label="Soil pH" value={phVal.toFixed(2)} unit="pH" status={phStatus} paramKey="soil_ph" />
            <SensorRow icon={<Wind className="w-4 h-4" />} label="Humidity" value={humVal.toFixed(1)} unit="%" status="neutral" paramKey="humidity" />

            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-400">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
              <span className="font-bold text-purple-600">SIMULATED</span>
              <span className="text-slate-300 mx-1">·</span>
              Every <span className="font-bold text-slate-600 mx-1">{DEMO_TELEMETRY_INTERVAL_MS / 1000}s</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────
const MyFarms: React.FC = () => {
  const { farmlands, activeSections, crops, telemetryObservations, isDemoTelemetryActive, toggleDemoTelemetry } = useAgriStore();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(activeSections.map(s => s.id)));
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // force re-render to keep ticker fresh
  void now;

  const lastCycle = telemetrySimulator.getLastCycleTime();
  const sessionId = telemetrySimulator.getSessionId();
  const secsSinceLastCycle = lastCycle ? Math.floor((Date.now() - lastCycle) / 1000) : null;

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-10">

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <Building2 className="w-5 h-5 text-emerald-700" />
              </div>
              <h1 className="text-2xl font-black text-slate-900">My Farms</h1>
              <span className="px-2.5 py-0.5 bg-sky-50 border border-sky-200 text-sky-700 rounded-full text-[11px] font-bold">
                {farmlands.length} Farm{farmlands.length !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-purple-500" />
              Hierarchy: <strong className="text-slate-700 ml-1">Farm → Section → Crop → Sensor</strong>
            </p>
          </div>

          <div className="bg-slate-950 text-white rounded-xl p-3.5 text-[10px] font-mono min-w-72 border border-slate-800">
            <div className="text-emerald-400 font-black text-[11px] mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
                SUPABASE POSTGRESQL ENGINE
              </span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${isSupabaseConfigured ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                {isSupabaseConfigured ? 'CONNECTED' : 'STANDBY MODE'}
              </span>
            </div>
            <div className="space-y-1 text-slate-400">
              <div><span className="text-sky-400">📂 public.farms</span> — farm metadata</div>
              <div><span className="text-sky-400">📂 public.plots</span> — section metadata</div>
              <div><span className="text-sky-400">📂 public.telemetry_observations</span> — 12s live readings</div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800 text-slate-400 flex items-center justify-between">
              <span>SQL DDL: <span className="text-amber-400 font-bold">supabase_schema.sql</span></span>
              <span className="text-purple-400 font-bold">Realtime WebSockets</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Status Banner */}
      <div className={`rounded-2xl border-2 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isDemoTelemetryActive ? 'bg-emerald-950/10 border-emerald-300' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isDemoTelemetryActive ? 'bg-emerald-100' : 'bg-slate-100'}`}>
            <Cpu className={`w-5 h-5 ${isDemoTelemetryActive ? 'text-emerald-700' : 'text-slate-500'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-slate-900">Telemetry Simulator</span>
              {isDemoTelemetryActive ? (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-700 rounded-full text-[10px] font-bold">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> ACTIVE
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-600 rounded-full text-[10px] font-bold">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" /> PAUSED
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Interval: <strong className="text-slate-700 ml-1">{DEMO_TELEMETRY_INTERVAL_MS / 1000}s</strong></span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1"><Database className="w-3 h-3 text-purple-500" /> Writing to: <strong className="text-purple-600 ml-1">Firestore → telemetry_observations</strong></span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Last cycle: <strong className="text-slate-700 ml-1">{secsSinceLastCycle !== null ? `${secsSinceLastCycle}s ago` : 'Pending…'}</strong></span>
              <span className="text-slate-300">|</span>
              <span className="font-mono text-[10px] text-slate-400">Session: <span className="text-indigo-500">{sessionId.slice(0, 22)}…</span></span>
            </div>
          </div>
        </div>
        <button
          onClick={() => toggleDemoTelemetry(!isDemoTelemetryActive)}
          className={`shrink-0 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            isDemoTelemetryActive
              ? 'bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200'
              : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md'
          }`}
        >
          {isDemoTelemetryActive ? '⏸ Pause Simulation' : '▶ Start Simulation'}
        </button>
      </div>

      {/* Farm → Section → Crop → Sensor */}
      {farmlands.map(farm => {
        const farmSections = activeSections.filter(s => s.farmId === farm.id);
        return (
          <div key={farm.id} className="space-y-3">
            <div className="flex items-center gap-3 px-1 flex-wrap">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-black text-slate-900">{farm.name}</h2>
              </div>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-semibold border border-slate-200">
                <MapPin className="w-3 h-3 inline mr-1" />{farm.location}
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-semibold border border-slate-200">
                {farm.totalArea} {farm.unit}
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold border border-emerald-200">
                {farmSections.length} Sections
              </span>
              <span className="px-2 py-0.5 bg-slate-800 text-emerald-400 rounded-full text-[11px] font-mono font-bold">
                ID: {farm.id}
              </span>
            </div>

            {farmSections.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No sections found for this farm.
              </div>
            ) : (
              <div className="space-y-3">
                {farmSections.map(section => {
                  const crop = crops.find(c => c.id === section.cropId) || null;
                  return (
                    <SectionCard
                      key={section.id}
                      section={section}
                      crop={crop}
                      telemetry={telemetryObservations}
                      lastCycle={lastCycle}
                      isExpanded={expandedSections.has(section.id)}
                      onToggle={() => toggleSection(section.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Data Pipeline Explainer */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-500" />
          Data Pipeline — How dummy data flows
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs flex-wrap">
          {[
            { icon: <Cpu className="w-4 h-4" />, label: 'Simulator', sub: 'Generates readings', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
            { arrow: true },
            { icon: <RefreshCw className="w-4 h-4" />, label: 'Every 12 seconds', sub: 'Auto interval', color: 'bg-amber-100 text-amber-700 border-amber-200' },
            { arrow: true },
            { icon: <Database className="w-4 h-4" />, label: 'Firestore', sub: 'telemetry_observations', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
            { arrow: true },
            { icon: <Activity className="w-4 h-4" />, label: 'Dashboard', sub: 'Real-time subscription', color: 'bg-sky-100 text-sky-700 border-sky-200' },
          ].map((item, i) =>
            (item as any).arrow ? (
              <div key={i} className="text-slate-300 text-lg font-black hidden sm:block">→</div>
            ) : (
              <div key={i} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border font-semibold ${(item as any).color}`}>
                {(item as any).icon}
                <div>
                  <div className="font-black">{(item as any).label}</div>
                  <div className="text-[10px] opacity-70">{(item as any).sub}</div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default MyFarms;
