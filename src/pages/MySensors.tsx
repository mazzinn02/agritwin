import React, { useMemo } from 'react';
import {
  Radio,
  Thermometer,
  Droplets,
  FlaskConical,
  Clock,
  Building2,
  Cpu,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sprout,
  Zap,
  Activity
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { PrototypeModeBanner } from '../components/common/PrototypeModeBanner';
import { IoTSensor } from '../types';

function fmtTimestamp(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

// Icon for sensor type
function getSensorIcon(typeStr: string) {
  const t = (typeStr || '').toLowerCase();
  if (t.includes('moisture') || t.includes('sm')) return <Droplets className="w-4 h-4 text-blue-500" />;
  if (t.includes('temp') || t.includes('at')) return <Thermometer className="w-4 h-4 text-orange-500" />;
  if (t.includes('hum')) return <Droplets className="w-4 h-4 text-teal-500" />;
  if (t.includes('ph')) return <FlaskConical className="w-4 h-4 text-purple-500" />;
  if (t.includes('nitrogen') || t.includes('n_') || t.endsWith('_n')) return <Zap className="w-4 h-4 text-emerald-500" />;
  if (t.includes('phosphor') || t.includes('p_') || t.endsWith('_p')) return <Activity className="w-4 h-4 text-amber-500" />;
  if (t.includes('potass') || t.includes('k_') || t.endsWith('_k')) return <Activity className="w-4 h-4 text-indigo-500" />;
  return <Cpu className="w-4 h-4 text-slate-500" />;
}

export const MySensors: React.FC = () => {
  const { activeSections: plots, activeFarmland, crops, sensors, isDemoTelemetryActive } = useAgriStore();

  const hierarchy = useMemo(() => {
    return plots.map(plot => {
      const crop = crops.find(c => c.id === plot.cropId) || null;
      const plotSensors = sensors.filter(s => s.plotId === plot.id || s.assignedPlotCode === plot.code);

      // Latest ping across plot sensors
      const pings = plotSensors.map(s => s.lastPing ? new Date(s.lastPing).getTime() : 0);
      const maxPing = pings.length > 0 ? Math.max(...pings) : 0;
      const lastUpdated = maxPing > 0 ? new Date(maxPing).toISOString() : null;

      return { plot, crop, plotSensors, lastUpdated };
    });
  }, [plots, crops, sensors]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-800 pb-10">
      <PrototypeModeBanner />

      {/* Page Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h1 className="text-xl font-bold text-slate-900">Live IoT Sensor Matrix</h1>
                {isDemoTelemetryActive && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">
                    ● Real-Time Feed (10s Cycle)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Hierarchy: <strong>Farm</strong> &rarr; <strong>Plot</strong> &rarr; <strong>Sensors</strong> &rarr; <strong>Real-Time <code className="font-mono text-emerald-700">public.sensors.current_reading</code></strong>
              </p>
            </div>
          </div>

          {activeFarmland && (
            <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 text-xs">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="font-extrabold text-slate-800">{activeFarmland.name}</div>
                <div className="text-slate-400 flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{activeFarmland.location}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hierarchy Cards */}
      {hierarchy.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          No plots found for active farm.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {hierarchy.map(({ plot, crop, plotSensors, lastUpdated }) => {
            return (
              <div
                key={plot.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col"
              >
                {/* Header: Dark banner with Plot Code + Crop */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-5 py-4">
                  <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                    <Building2 className="w-3 h-3" />
                    <span>{activeFarmland?.name || 'Farm'}</span>
                    <span className="text-slate-600 mx-0.5">›</span>
                    <span className="text-emerald-300 font-bold">{plot.code}</span>
                  </div>

                  <h2 className="text-base font-black text-white leading-tight">
                    {plot.name}
                  </h2>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-1.5">
                      <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs text-emerald-300 font-bold">
                        {plot.cropType || crop?.name || 'Crop'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                      {plotSensors.length} Sensors Active
                    </span>
                  </div>
                </div>

                {/* Sensors Table — direct reading from public.sensors */}
                <div className="px-5 py-4 space-y-2 flex-1">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-2 flex items-center justify-between">
                    <span>Active Sensor Readings</span>
                    <span className="text-[9px] font-mono text-emerald-700">Synced to public.sensors</span>
                  </div>

                  {plotSensors.length === 0 ? (
                    <div className="text-xs text-slate-400 py-4 text-center">No sensors linked to this plot.</div>
                  ) : (
                    <div className="space-y-1.5">
                      {plotSensors.map(sensor => (
                        <div
                          key={sensor.id}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors"
                        >
                          <div className="flex items-center space-x-2.5">
                            {getSensorIcon(sensor.type || sensor.nodeName)}
                            <div>
                              <div className="text-xs font-black text-slate-900">
                                {sensor.type || sensor.nodeName}
                              </div>
                              <div className="text-[9px] font-mono text-slate-400">
                                ID: {sensor.id} · {sensor.sensorCode}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-black font-mono text-emerald-600">
                              {sensor.currentReading || 'Updating...'}
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono">
                              Ping: {fmtTimestamp(sensor.lastPing)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/60 text-[10px]">
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Last Cycle: {lastUpdated ? fmtTimestamp(lastUpdated) : 'Live'}</span>
                  </div>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Supabase Feed
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MySensors;
