import React, { useState } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Sprout,
  Droplets,
  Thermometer,
  Beaker,
  Activity,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
  MapPin,
  BarChart3,
  Leaf,
  Sun,
  Wind,
  Zap,
  HeartPulse,
  RefreshCw
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { isSupabaseConfigured } from '../lib/supabase';

// Crop emoji and color map for visual richness
const CROP_META: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  'Wheat':       { emoji: '🌾', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  'Rice':        { emoji: '🌾', color: 'text-green-700',   bg: 'bg-green-50',   border: 'border-green-200' },
  'Maize':       { emoji: '🌽', color: 'text-yellow-700',  bg: 'bg-yellow-50',  border: 'border-yellow-200' },
  'Sugarcane':   { emoji: '🎋', color: 'text-lime-700',    bg: 'bg-lime-50',    border: 'border-lime-200' },
  'Cotton':      { emoji: '🌿', color: 'text-slate-700',   bg: 'bg-slate-50',   border: 'border-slate-200' },
  'Lettuce':     { emoji: '🥬', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'Bell Pepper': { emoji: '🫑', color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200' },
  'Tomato':      { emoji: '🍅', color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200' },
  'Strawberry':  { emoji: '🍓', color: 'text-pink-700',    bg: 'bg-pink-50',    border: 'border-pink-200' },
  'Cucumber':    { emoji: '🥒', color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200' },
  'Soybean':     { emoji: '🫘', color: 'text-green-700',   bg: 'bg-green-50',   border: 'border-green-200' },
  'Chilli':      { emoji: '🌶️', color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200' },
  'Brinjal':     { emoji: '🍆', color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200' },
  'Okra':        { emoji: '🌿', color: 'text-green-700',   bg: 'bg-green-50',   border: 'border-green-200' },
  'Groundnut':   { emoji: '🥜', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  'Spices':      { emoji: '🌶️', color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200' },
  'Pulses':      { emoji: '🫘', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  'Mustard':     { emoji: '🌼', color: 'text-yellow-700',  bg: 'bg-yellow-50',  border: 'border-yellow-200' },
  'Turmeric':    { emoji: '🟡', color: 'text-yellow-700',  bg: 'bg-yellow-50',  border: 'border-yellow-200' },
  'Saffron':     { emoji: '🌸', color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200' },
  'Quinoa':      { emoji: '🌾', color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200' },
};

function getCropMeta(crop: string) {
  return CROP_META[crop] || { emoji: '🌱', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
}

const STAGE_COLOR: Record<string, string> = {
  'Germination': 'bg-slate-100 text-slate-700 border-slate-300',
  'Vegetative':  'bg-lime-100 text-lime-800 border-lime-300',
  'Flowering':   'bg-pink-100 text-pink-800 border-pink-300',
  'Fruiting':    'bg-orange-100 text-orange-800 border-orange-300',
  'Maturation':  'bg-amber-100 text-amber-800 border-amber-300',
  'Harvesting':  'bg-emerald-100 text-emerald-800 border-emerald-300',
};

const FARM_ACCENTS = [
  { border: 'border-l-emerald-500', badge: 'bg-emerald-500', light: 'bg-emerald-50' },
  { border: 'border-l-blue-500',    badge: 'bg-blue-500',    light: 'bg-blue-50' },
  { border: 'border-l-purple-500',  badge: 'bg-purple-500',  light: 'bg-purple-50' },
  { border: 'border-l-amber-500',   badge: 'bg-amber-500',   light: 'bg-amber-50' },
  { border: 'border-l-rose-500',    badge: 'bg-rose-500',    light: 'bg-rose-50' },
];

export const MyFarms: React.FC = () => {
  const { 
    farmlands, 
    plots, 
    sensors, 
    telemetryObservations, 
    seedMultiFarmSystem,
    isDemoTelemetryActive,
    toggleDemoTelemetry,
    triggerTelemetrySimulationNow
  } = useAgriStore();

  const [expandedFarm, setExpandedFarm] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    await seedMultiFarmSystem();
    setSeeding(false);
  };

  const handleSimulate = async () => {
    setSimulating(true);
    await triggerTelemetrySimulationNow();
    setTimeout(() => setSimulating(false), 800);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 border border-emerald-900/60 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-emerald-500/30">
              🌾 Digital Twin Farm Network
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${isSupabaseConfigured ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
              {isSupabaseConfigured ? '● Supabase Connected' : '○ Local Mode'}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isDemoTelemetryActive ? 'bg-emerald-950 text-emerald-300 border-emerald-700 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
              {isDemoTelemetryActive ? '● Realtime Simulator (Every 12s)' : '○ Simulator Paused'}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">My Farm Digital Twins</h1>
          <p className="text-xs text-slate-300 mt-1">
            {farmlands.length} farms · {plots.length} plots · {sensors.length} sensors · {telemetryObservations.length.toLocaleString()} telemetry records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            title="Generates live sensor readings immediately for all 25 plots and updates Supabase"
          >
            <Zap className={`w-4 h-4 fill-slate-950 ${simulating ? 'animate-bounce' : ''}`} />
            {simulating ? 'Updating Sensors...' : '⚡ SIMULATE LIVE READINGS'}
          </button>

          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-xl border border-slate-700 shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
          >
            {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4 text-emerald-400" />}
            {seeding ? 'Seeding...' : 'Reset Seed Data'}
          </button>
        </div>
      </div>

      {/* ── Farm Cards ─────────────────────────────────────────────────────────── */}
      <div className="space-y-5">
        {farmlands.map((farm, farmIdx) => {
          const accent = FARM_ACCENTS[farmIdx % FARM_ACCENTS.length];
          const farmPlots = plots.filter(p => p.farmId === farm.id);
          const farmSensors = sensors.filter(s => s.farmId === farm.id);
          const onlineSensors = farmSensors.filter(s => s.status === 'Online').length;
          const isOpen = expandedFarm === farm.id;

          // Unique crops this farm grows
          const uniqueCrops: string[] = Array.from(new Set(farmPlots.map(p => p.cropType || 'N/A').filter((c): c is string => Boolean(c))));

          return (
            <div
              key={farm.id}
              className={`bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden border-l-4 ${accent.border}`}
            >
              {/* ── Farm Header ──────────────────────────────────────────────────── */}
              <div
                onClick={() => setExpandedFarm(isOpen ? null : farm.id)}
                className="p-5 cursor-pointer hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-11 h-11 rounded-2xl ${accent.badge} flex items-center justify-center text-white font-black text-lg shadow-md shrink-0`}>
                      {farmIdx + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="font-black text-base text-slate-900">{farm.name}</h2>
                        <span className={`w-2 h-2 rounded-full animate-pulse ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{farm.location}</span>
                        <span>·</span>
                        <span>{farm.totalArea} {farm.unit}</span>
                      </div>

                      {/* Crop Badges Row */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {uniqueCrops.map((crop: string) => {
                          const meta = getCropMeta(crop);
                          return (
                            <span
                              key={crop}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${meta.bg} ${meta.color} ${meta.border}`}
                            >
                              {meta.emoji} {crop}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Health Score */}
                    <div className="text-right hidden md:block">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Health</div>
                      <div className="text-xl font-black text-emerald-600">{farm.healthScore || 92}<span className="text-xs text-slate-400">/100</span></div>
                    </div>
                    {/* Stats */}
                    <div className="hidden md:flex flex-col gap-1 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1"><Sprout className="w-3 h-3 text-emerald-500" />{farmPlots.length} Plots</span>
                      <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-indigo-500" />{onlineSensors}/{farmSensors.length} Online</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-500">
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Quick stat strip */}
                <div className="grid grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100">
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Plots</div>
                    <div className="text-lg font-black text-slate-900">{farmPlots.length}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Sensors</div>
                    <div className="text-lg font-black text-slate-900">{farmSensors.length}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Crops</div>
                    <div className="text-lg font-black text-slate-900">{uniqueCrops.length}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Area</div>
                    <div className="text-lg font-black text-slate-900">{farm.totalArea}<span className="text-xs font-normal text-slate-400"> ac</span></div>
                  </div>
                </div>
              </div>

              {/* ── Expanded Plots View ───────────────────────────────────────────── */}
              {isOpen && (
                <div className={`${accent.light} border-t border-slate-100 p-5`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {farmPlots.map(plot => {
                      const cropMeta = getCropMeta(plot.cropType || '');
                      const stageClass = STAGE_COLOR[plot.growthStage || ''] || 'bg-slate-100 text-slate-700 border-slate-200';
                      const plotSensors = sensors.filter(s => s.plotId === plot.id);
                      const latestObs = telemetryObservations.filter(o => o.plotId === plot.id);
                      const latestMoisture = latestObs.find(o => o.parameterKey === 'soil_moisture')?.value ?? plot.soilMoisture;
                      const latestTemp = latestObs.find(o => o.parameterKey === 'air_temperature')?.value ?? plot.airTemp;
                      const latestPh = latestObs.find(o => o.parameterKey === 'soil_ph')?.value ?? plot.soilPh;

                      return (
                        <div key={plot.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          {/* Plot Header */}
                          <div className={`px-4 py-3 ${cropMeta.bg} border-b ${cropMeta.border} flex items-center justify-between`}>
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{cropMeta.emoji}</span>
                              <div>
                                <div className="font-black text-sm text-slate-900">{plot.cropType || 'Unassigned'}</div>
                                <div className="text-[10px] font-mono text-slate-500">{plot.code} · {plot.area} ac</div>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${stageClass}`}>
                              {plot.growthStage}
                            </span>
                          </div>

                          {/* Plot Body — Sensor Readings */}
                          <div className="p-4 space-y-3">
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Live Sensor Readings</div>

                            <div className="grid grid-cols-3 gap-2">
                              {/* Soil Moisture */}
                              <div className="bg-blue-50 rounded-xl p-2.5 border border-blue-100 text-center">
                                <Droplets className="w-4 h-4 text-blue-500 mx-auto mb-0.5" />
                                <div className="font-black text-sm text-slate-900">{Number(latestMoisture || 0).toFixed(1)}<span className="text-[9px] text-slate-400">%</span></div>
                                <div className="text-[9px] text-slate-400 font-bold">Moisture</div>
                              </div>

                              {/* Air Temp */}
                              <div className="bg-orange-50 rounded-xl p-2.5 border border-orange-100 text-center">
                                <Thermometer className="w-4 h-4 text-orange-500 mx-auto mb-0.5" />
                                <div className="font-black text-sm text-slate-900">{Number(latestTemp || 0).toFixed(1)}<span className="text-[9px] text-slate-400">°C</span></div>
                                <div className="text-[9px] text-slate-400 font-bold">Air Temp</div>
                              </div>

                              {/* Soil pH */}
                              <div className="bg-purple-50 rounded-xl p-2.5 border border-purple-100 text-center">
                                <Beaker className="w-4 h-4 text-purple-500 mx-auto mb-0.5" />
                                <div className="font-black text-sm text-slate-900">{Number(latestPh || 0).toFixed(1)}</div>
                                <div className="text-[9px] text-slate-400 font-bold">Soil pH</div>
                              </div>
                            </div>

                            {/* Soil Health Score Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-slate-500">Soil Health Index</span>
                                <span className="text-emerald-700">{plot.soilHealthScore}/100</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
                                  style={{ width: `${plot.soilHealthScore || 88}%` }}
                                />
                              </div>
                            </div>

                            {/* Bottom Info Row */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                              <span className={`flex items-center gap-1 font-bold ${plot.irrigationStatus === 'Active Drip' || plot.irrigationStatus === 'Automated Sprinkler' ? 'text-blue-600' : 'text-slate-400'}`}>
                                <Droplets className="w-3 h-3" />
                                {plot.irrigationStatus}
                              </span>
                              <span className="text-slate-400 flex items-center gap-1">
                                <Cpu className="w-3 h-3 text-indigo-400" />
                                {plotSensors.length} sensors
                              </span>
                              <span className="font-mono text-slate-400">{plot.sensorNodeId}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Farm Footer — Supabase Status */}
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <Database className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Farm ID: <strong>{farm.id}</strong></span>
                    <span>·</span>
                    <span className={`font-bold ${isSupabaseConfigured ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {isSupabaseConfigured ? '● Supabase: CONNECTED' : '○ Local State Only'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyFarms;
