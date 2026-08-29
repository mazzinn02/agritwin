import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Thermometer, 
  Droplets, 
  Activity, 
  Zap, 
  Beaker, 
  Sprout, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  PlusCircle,
  MapPin,
  Clock,
  UserCheck,
  ArrowRight,
  Database,
  Cpu,
  Leaf,
  Building2,
  Radio,
  RefreshCw,
  ExternalLink,
  Wifi
} from 'lucide-react';
import { CropGrowthTracker } from '../components/dashboard/CropGrowthTracker';
import { DailyActionBanner } from '../components/common/DailyActionBanner';
import { SupabaseMonitorSection } from '../components/dashboard/SupabaseMonitorSection';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { PrototypeModeBanner } from '../components/common/PrototypeModeBanner';
import { SensorProvenance } from '../components/common/SensorProvenance';
import { useAgriStore } from '../context/AgriStore';
import { telemetrySimulator, DEMO_TELEMETRY_INTERVAL_MS } from '../services/telemetrySimulator';
import { isSupabaseConfigured } from '../lib/supabase';

function secsAgo(ts: string | number | null): string {
  if (!ts) return '—';
  const d = typeof ts === 'string' ? new Date(ts).getTime() : ts;
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

export const Dashboard = () => {
  const { activeSections, crops, activeFarmland, triggerActuator, telemetryObservations, isAdmin, isDemoTelemetryActive, toggleDemoTelemetry } = useAgriStore();
  const [selectedPlotId, setSelectedPlotId] = useState<string>(activeSections[0]?.id || '');
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Tick for live timers
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  void now;

  const activePlot = useMemo(() => {
    return activeSections.find(p => p.id === selectedPlotId) || activeSections[0] || null;
  }, [activeSections, selectedPlotId]);

  const assignedCrop = useMemo(() => {
    if (!activePlot || !activePlot.cropId) return null;
    return crops.find(c => c.id === activePlot.cropId) || null;
  }, [activePlot, crops]);

  const latestMoistureObs = useMemo(() => {
    if (!activePlot) return null;
    return telemetryObservations.find(o => (o.plotId === activePlot.id || o.plotId === activePlot.code) && o.parameterKey === 'soil_moisture') || null;
  }, [telemetryObservations, activePlot]);

  const latestTempObs = useMemo(() => {
    if (!activePlot) return null;
    return telemetryObservations.find(o => (o.plotId === activePlot.id || o.plotId === activePlot.code) && o.parameterKey === 'air_temperature') || null;
  }, [telemetryObservations, activePlot]);

  const latestPhObs = useMemo(() => {
    if (!activePlot) return null;
    return telemetryObservations.find(o => (o.plotId === activePlot.id || o.plotId === activePlot.code) && o.parameterKey === 'soil_ph') || null;
  }, [telemetryObservations, activePlot]);

  const plotStatus = useMemo(() => {
    if (!activePlot) return { label: 'Standby', color: 'text-slate-400', bg: 'bg-slate-800', icon: Activity };
    if (!assignedCrop) return { label: 'Fallow Land', color: 'text-slate-400', bg: 'bg-slate-800', icon: MapPin };
    if (activePlot.airTemp > assignedCrop.idealTempMax) {
      return { label: 'Thermal Stress', color: 'text-rose-400', bg: 'bg-rose-950/50', icon: Flame };
    }
    if (activePlot.soilMoisture < assignedCrop.idealMoistureMin) {
      return { label: 'Needs Water', color: 'text-amber-400', bg: 'bg-amber-950/50', icon: AlertCircle };
    }
    return { label: 'Optimal Micro-Climate', color: 'text-emerald-400', bg: 'bg-emerald-950/50', icon: CheckCircle2 };
  }, [activePlot, assignedCrop]);

  const StatusIcon = plotStatus.icon;
  const lastCycle = telemetrySimulator.getLastCycleTime();
  const sessionId = telemetrySimulator.getSessionId();

  // Recent Firestore observations (last 10, any plot)
  const recentObs = useMemo(() => {
    return [...telemetryObservations]
      .sort((a, b) => new Date(b.measurementTimestamp).getTime() - new Date(a.measurementTimestamp).getTime())
      .slice(0, 10);
  }, [telemetryObservations]);

  const handleActuatorIrrigation = async () => {
    if (!activePlot) return;
    await triggerActuator(activePlot.id, 'irrigation', 'manual');
    setNotice(`15-Min Precision Irrigation Pulse on ${activePlot.code}. Soil moisture boosted (+8.5%).`);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleActuatorFan = async () => {
    if (!activePlot) return;
    await triggerActuator(activePlot.id, 'hvac', 'manual');
    setNotice(`Canopy Ventilation Fan toggled on ${activePlot.code}. Temp adjusted (-2.0°C).`);
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="space-y-6 font-sans pb-10">

      {/* ── DARK HERO COMMAND CENTER ────────────────────────────────────── */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />

        <div className="relative z-10">
          {/* Top row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                  <Leaf className="w-5 h-5 text-emerald-400 fill-current" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white tracking-tight">
                    {activeFarmland?.name || 'iiit dharwad'} — Command Center
                  </h1>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3 h-3 text-emerald-500" />
                    {activeFarmland?.location || 'Dharwad, Karnataka'} · {activeFarmland?.totalArea || 20} {activeFarmland?.unit || 'acres'}
                    <span className="text-slate-600 mx-1">·</span>
                    <span className="text-emerald-500 font-bold">Digital Twin</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Simulator live indicator */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                isDemoTelemetryActive
                  ? 'bg-emerald-950/60 border-emerald-700 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isDemoTelemetryActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                {isDemoTelemetryActive ? `SIM ACTIVE · ${DEMO_TELEMETRY_INTERVAL_MS / 1000}s` : 'SIM PAUSED'}
              </div>

              {/* Plot selector */}
              <div className="bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-xl flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plot:</span>
                <select
                  value={selectedPlotId}
                  onChange={(e) => setSelectedPlotId(e.target.value)}
                  className="bg-transparent text-white text-xs font-bold rounded-lg px-1 focus:outline-none cursor-pointer"
                >
                  {activeSections.map(p => {
                    const c = crops.find(crop => crop.id === p.cropId);
                    return (
                      <option key={p.id} value={p.id} style={{ background: '#1e293b' }}>
                        {p.code}: {c ? `${c.name}` : p.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {isAdmin && (
                <Link to="/manual-telemetry" className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/80 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all border border-indigo-700">
                  <UserCheck className="w-3.5 h-3.5" />
                  + Observation
                </Link>
              )}
              {isAdmin && (
                <Link to="/add-farmland" className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all border border-emerald-700">
                  <PlusCircle className="w-3.5 h-3.5" />
                  + Farm
                </Link>
              )}
            </div>
          </div>

          {/* Telemetry status row */}
          {activePlot && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Soil Moisture */}
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4 backdrop-blur">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Soil Moisture</span>
                  <div className="p-1.5 bg-sky-500/20 rounded-lg"><Droplets className="w-4 h-4 text-sky-400" /></div>
                </div>
                <div className="text-3xl font-black text-white mb-1">{activePlot.soilMoisture}%</div>
                <DataSourceBadge source={latestMoistureObs?.dataSource || 'MANUAL_PROTOTYPE'} />
                <p className="text-[10px] text-slate-500 mt-1">Target: {assignedCrop ? `${assignedCrop.idealMoistureMin}–${assignedCrop.idealMoistureMax}%` : '50–75%'}</p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className={`h-full rounded-full transition-all duration-500 ${assignedCrop && activePlot.soilMoisture < assignedCrop.idealMoistureMin ? 'bg-amber-500' : 'bg-sky-500'}`}
                    style={{ width: `${Math.min(100, activePlot.soilMoisture)}%` }} />
                </div>
                {latestMoistureObs && (
                  <div className="text-[10px] text-slate-500 mt-1.5 font-mono flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />{secsAgo(latestMoistureObs.measurementTimestamp)}
                  </div>
                )}
                <SensorProvenance obs={latestMoistureObs} plots={activeSections} farmland={activeFarmland} />
              </div>

              {/* Air Temperature */}
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4 backdrop-blur">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Air Temp</span>
                  <div className="p-1.5 bg-amber-500/20 rounded-lg"><Thermometer className="w-4 h-4 text-amber-400" /></div>
                </div>
                <div className="text-3xl font-black text-white mb-1">{activePlot.airTemp}°C</div>
                <DataSourceBadge source={latestTempObs?.dataSource || 'MANUAL_PROTOTYPE'} />
                <p className="text-[10px] text-slate-500 mt-1">Target: {assignedCrop ? `${assignedCrop.idealTempMin}–${assignedCrop.idealTempMax}°C` : '20–30°C'}</p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className={`h-full rounded-full transition-all duration-500 ${assignedCrop && activePlot.airTemp > assignedCrop.idealTempMax ? 'bg-rose-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(100, (activePlot.airTemp / 45) * 100)}%` }} />
                </div>
                {latestTempObs && (
                  <div className="text-[10px] text-slate-500 mt-1.5 font-mono flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />{secsAgo(latestTempObs.measurementTimestamp)}
                  </div>
                )}
                <SensorProvenance obs={latestTempObs} plots={activeSections} farmland={activeFarmland} />
              </div>

              {/* Soil pH */}
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4 backdrop-blur">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Soil pH</span>
                  <div className="p-1.5 bg-emerald-500/20 rounded-lg"><Beaker className="w-4 h-4 text-emerald-400" /></div>
                </div>
                <div className="text-3xl font-black text-white mb-1">{activePlot.soilPh}</div>
                <DataSourceBadge source={latestPhObs?.dataSource || 'MANUAL_PROTOTYPE'} />
                <p className="text-[10px] text-slate-500 mt-1">Target: {assignedCrop ? `${assignedCrop.idealPhMin}–${assignedCrop.idealPhMax}` : '6.0–7.0'}</p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (activePlot.soilPh / 14) * 100)}%` }} />
                </div>
                <SensorProvenance obs={latestPhObs} plots={activeSections} farmland={activeFarmland} />
              </div>

              {/* Crop Status */}
              <div className={`${plotStatus.bg} border border-slate-700/60 rounded-2xl p-4 backdrop-blur`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Crop Status</span>
                  <div className="p-1.5 bg-white/10 rounded-lg">
                    <StatusIcon className={`w-4 h-4 ${plotStatus.color}`} />
                  </div>
                </div>
                <div className={`text-lg font-black ${plotStatus.color} mb-1`}>{plotStatus.label}</div>
                <p className="text-[10px] text-slate-400">Day {activePlot.daysPlanted} / {assignedCrop?.growthDurationDays || 100}</p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (activePlot.daysPlanted / (assignedCrop?.growthDurationDays || 100)) * 100)}%` }} />
                </div>
                <div className="mt-2 text-[10px] text-slate-400 font-mono">Node: {activePlot.sensorNodeId}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Notification ───────────────────────────────────────────────── */}
      {notice && (
        <div className="p-4 bg-slate-900 text-emerald-400 rounded-2xl border border-slate-800 text-xs font-bold flex items-center gap-2 animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* ── Daily Advisor ───────────────────────────────────────────────── */}
      <DailyActionBanner />

      {/* ── Growth Tracker ──────────────────────────────────────────────── */}
      {activePlot && (
        <CropGrowthTracker
          plotId={activePlot.id}
          cropName={assignedCrop ? `${assignedCrop.name} (${assignedCrop.variety})` : activePlot.name}
        />
      )}

      {/* ── Actuator Controls ───────────────────────────────────────────── */}
      {activePlot && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Edge Hardware Controls</span>
              <h3 className="text-base font-extrabold text-slate-900">Actuator Matrix · {activePlot.code}</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Node: {activePlot.sensorNodeId}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleActuatorIrrigation}
              className="p-5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white text-left transition-all shadow-lg flex items-center justify-between cursor-pointer group active:scale-95"
            >
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-200">1-Tap Precision Actuator</span>
                <h4 className="text-base font-black text-white mt-0.5">Irrigate 15-Min Pulse</h4>
                <p className="text-xs text-sky-100 mt-1">Boost soil moisture (+8.5%)</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                <Droplets className="w-6 h-6 text-white" />
              </div>
            </button>

            <button
              type="button"
              onClick={handleActuatorFan}
              className="p-5 rounded-2xl bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white text-left transition-all shadow-lg flex items-center justify-between border border-slate-500 cursor-pointer group active:scale-95"
            >
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">HVAC Canopy Ventilation</span>
                <h4 className="text-base font-black text-white mt-0.5">Toggle Canopy Fan</h4>
                <p className="text-xs text-slate-300 mt-1">Adjust air temperature (-2.0°C)</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-amber-400" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ── Supabase Database Status & Live Monitoring Section ───────────── */}
      <SupabaseMonitorSection telemetryObservations={telemetryObservations} />

      {/* ── Live DB Feed + Simulator Control ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Simulator Control Widget */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
            <div className="p-1.5 bg-emerald-500/20 rounded-lg"><Cpu className="w-4 h-4 text-emerald-400" /></div>
            <div>
              <div className="text-xs font-black text-white">Simulator Control</div>
              <div className="text-[10px] text-slate-500">Dummy data engine</div>
            </div>
            {isDemoTelemetryActive ? (
              <div className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-emerald-950 border border-emerald-800 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400">ACTIVE</span>
              </div>
            ) : (
              <div className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full">
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                <span className="text-[10px] font-bold text-slate-400">PAUSED</span>
              </div>
            )}
          </div>

          <div className="space-y-2 text-[11px] font-mono mb-4">
            <div className="flex justify-between"><span className="text-slate-500">Interval</span><span className="text-emerald-400 font-bold">{DEMO_TELEMETRY_INTERVAL_MS / 1000}s</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Last Cycle</span><span className="text-amber-400 font-bold">{lastCycle ? secsAgo(lastCycle) : 'Pending…'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">DB Target</span><span className="text-sky-400">telemetry_obs…</span></div>
            <div className="flex justify-between text-[10px]"><span className="text-slate-500">Session</span><span className="text-indigo-400 truncate ml-2">{sessionId.slice(12, 28)}…</span></div>
          </div>

          <button
            onClick={() => toggleDemoTelemetry(!isDemoTelemetryActive)}
            className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              isDemoTelemetryActive
                ? 'bg-rose-900/50 text-rose-400 border border-rose-800 hover:bg-rose-900'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {isDemoTelemetryActive ? '⏸ Pause Simulator' : '▶ Start Simulator'}
          </button>

          <Link to="/my-farms" className="mt-2 w-full py-2 flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-800 text-xs font-bold transition-all">
            <Building2 className="w-3.5 h-3.5" /> View Farm Hierarchy <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Live Supabase / Realtime Feed */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 rounded-lg"><Database className="w-4 h-4 text-emerald-600" /></div>
              <div>
                <div className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <span>Live Supabase Stream</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${isSupabaseConfigured ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-amber-100 text-amber-700 border border-amber-300'}`}>
                    {isSupabaseConfigured ? 'PostgreSQL Active' : 'Standby / Fallback'}
                  </span>
                </div>
                <div className="text-[10px] text-emerald-700 font-bold">table: public.telemetry_observations</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                <Wifi className="w-3 h-3 animate-pulse" /> Real-time WebSockets
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                {telemetryObservations.length} records
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="text-left pb-2 pr-3">Time</th>
                  <th className="text-left pb-2 pr-3">Plot</th>
                  <th className="text-left pb-2 pr-3">Parameter</th>
                  <th className="text-right pb-2 pr-3">Value</th>
                  <th className="text-left pb-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {recentObs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 text-[11px]">
                      No telemetry yet — simulator will populate this in ~{DEMO_TELEMETRY_INTERVAL_MS / 1000}s
                    </td>
                  </tr>
                ) : recentObs.map(obs => (
                  <tr key={obs.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 pr-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(obs.measurementTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2 pr-3">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-mono font-bold text-[10px]">
                        {activeSections.find(s => s.id === obs.plotId)?.code || obs.plotId.slice(0, 10)}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-slate-600 font-medium text-[11px]">
                      {obs.parameterKey.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2 pr-3 text-right font-black text-slate-900">
                      {obs.value.toFixed(1)}<span className="font-normal text-slate-400 ml-0.5 text-[10px]">{obs.unit}</span>
                    </td>
                    <td className="py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        obs.dataSource === 'SIMULATED' ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : obs.dataSource === 'SENSOR' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}>
                        {obs.dataSource}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span className="font-mono text-emerald-600 font-bold">Engine: Supabase PostgreSQL</span>
            <Link to="/my-farms" className="flex items-center gap-1 text-purple-600 hover:text-purple-800 font-bold">
              View full hierarchy <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Prototype Banner (bottom) ────────────────────────────────────── */}
      <PrototypeModeBanner />
    </div>
  );
};

export default Dashboard;
