import React, { useMemo } from 'react';
import {
  Radio,
  Thermometer,
  Droplets,
  Leaf,
  FlaskConical,
  Clock,
  Building2,
  Cpu,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sprout,
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { PrototypeModeBanner } from '../components/common/PrototypeModeBanner';
import { TelemetryObservation } from '../types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtTimestamp(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function latestObs(
  observations: TelemetryObservation[],
  plotId: string,
  paramKey: string
): TelemetryObservation | undefined {
  return observations
    .filter(o => (o.plotId === plotId) && o.parameterKey === paramKey)
    .sort((a, b) => new Date(b.measurementTimestamp).getTime() - new Date(a.measurementTimestamp).getTime())[0];
}

function statusColor(value: number | undefined, min: number, max: number): string {
  if (value === undefined) return 'text-slate-400';
  if (value >= min && value <= max) return 'text-emerald-600';
  if (value < min * 0.85 || value > max * 1.15) return 'text-red-600';
  return 'text-amber-600';
}

// ─── ReadingRow ────────────────────────────────────────────────────────────────

interface ReadingRowProps {
  icon: React.ReactNode;
  label: string;
  obs: TelemetryObservation | undefined;
  valueColor: string;
}
const ReadingRow: React.FC<ReadingRowProps> = ({ icon, label, obs, valueColor }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
    <div className="flex items-center space-x-2 text-slate-500">
      {icon}
      <span className="text-[11px] font-semibold">{label}</span>
    </div>
    <span className={`text-xs font-extrabold tabular-nums ${valueColor}`}>
      {obs ? `${obs.value} ${obs.unit}` : <span className="text-slate-300 font-normal">No data</span>}
    </span>
  </div>
);

// ─── MySensors ────────────────────────────────────────────────────────────────

export const MySensors: React.FC = () => {
  const { activeSections: plots, activeFarmland, crops, telemetryObservations, isDemoTelemetryActive } = useAgriStore();

  const hierarchy = useMemo(() => {
    return plots.map(plot => {
      const crop = crops.find(c => c.id === plot.cropId) || null;

      const smObs   = latestObs(telemetryObservations, plot.id, 'soil_moisture');
      const tempObs = latestObs(telemetryObservations, plot.id, 'air_temperature');
      const phObs   = latestObs(telemetryObservations, plot.id, 'soil_ph');
      const humObs  = latestObs(telemetryObservations, plot.id, 'humidity');

      const timestamps = [smObs, tempObs, phObs, humObs]
        .filter(Boolean)
        .map(o => new Date(o!.measurementTimestamp).getTime());
      const lastUpdated = timestamps.length > 0
        ? new Date(Math.max(...timestamps)).toISOString()
        : null;

      const hasLiveTelemetry = timestamps.length > 0;

      return { plot, crop, smObs, tempObs, phObs, humObs, lastUpdated, hasLiveTelemetry };
    });
  }, [plots, crops, telemetryObservations]);

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
                <h1 className="text-xl font-bold text-slate-900">Sensor Telemetry</h1>
                {isDemoTelemetryActive && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">
                    LIVE SIMULATED STREAM
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Full traceability: Farmland &rarr; Section &rarr; Crop &rarr; Sensor &rarr; Reading
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
          No sections configured yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {hierarchy.map(({ plot, crop, smObs, tempObs, phObs, humObs, lastUpdated, hasLiveTelemetry }) => {
            const sensorId = plot.sensorNodeId || plot.sensorId || '—';

            return (
              <div
                key={plot.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col"
              >
                {/* Card Header: dark band with breadcrumb + section name + crop */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-5 py-4">
                  <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">
                    <Building2 className="w-3 h-3" />
                    <span>{activeFarmland?.name || 'Farm'}</span>
                    <span className="text-slate-600 mx-0.5">›</span>
                    <Leaf className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-300">{plot.code}</span>
                  </div>

                  <h2 className="text-lg font-black text-white leading-tight">
                    {plot.code}
                    <span className="text-slate-400 font-normal text-sm ml-2">{plot.name}</span>
                  </h2>

                  <div className="flex items-center space-x-2 mt-2">
                    <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                    {crop ? (
                      <span className="text-xs text-emerald-300 font-bold">
                        {crop.name}
                        <span className="text-slate-400 font-normal ml-1">({crop.variety})</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 italic">No crop assigned</span>
                    )}
                  </div>
                </div>

                {/* Sensor row */}
                <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-indigo-500" />
                    <div>
                      <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Sensor Node</div>
                      <div className="text-sm font-black text-slate-900">{sensorId}</div>
                    </div>
                  </div>
                  {hasLiveTelemetry ? (
                    <span className="flex items-center space-x-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Live Data</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                      <AlertCircle className="w-3 h-3" />
                      <span>Awaiting</span>
                    </span>
                  )}
                </div>

                {/* Telemetry readings */}
                <div className="px-5 py-4 space-y-0.5 flex-1">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-2">
                    Latest Readings
                  </div>
                  <ReadingRow
                    icon={<Thermometer className="w-3.5 h-3.5" />}
                    label="Temperature"
                    obs={tempObs}
                    valueColor={crop ? statusColor(tempObs?.value, crop.idealTempMin, crop.idealTempMax) : 'text-slate-700'}
                  />
                  <ReadingRow
                    icon={<Droplets className="w-3.5 h-3.5" />}
                    label="Humidity"
                    obs={humObs}
                    valueColor="text-slate-700"
                  />
                  <ReadingRow
                    icon={<Droplets className="w-3.5 h-3.5 text-blue-400" />}
                    label="Soil Moisture"
                    obs={smObs}
                    valueColor={crop ? statusColor(smObs?.value, crop.idealMoistureMin, crop.idealMoistureMax) : 'text-slate-700'}
                  />
                  <ReadingRow
                    icon={<FlaskConical className="w-3.5 h-3.5 text-violet-400" />}
                    label="Soil pH"
                    obs={phObs}
                    valueColor={crop ? statusColor(phObs?.value, crop.idealPhMin, crop.idealPhMax) : 'text-slate-700'}
                  />
                </div>

                {/* Last updated footer */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/60">
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold">Last Updated</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 tabular-nums">
                    {lastUpdated ? fmtTimestamp(lastUpdated) : '—'}
                  </span>
                </div>

                {/* Data source */}
                <div className="px-5 pb-4">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold">Data Source</span>
                    <span className={`font-extrabold uppercase ${
                      hasLiveTelemetry
                        ? (smObs?.dataSource === 'SIMULATED' ? 'text-emerald-700' : 'text-indigo-700')
                        : 'text-slate-400'
                    }`}>
                      {hasLiveTelemetry ? (smObs?.dataSource || 'SIMULATED') : 'NONE YET'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-x-6 gap-y-2 text-[11px]">
        <div className="font-extrabold text-slate-500 uppercase tracking-wider self-center">Value Status:</div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-600 font-semibold">Within ideal crop range</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-slate-600 font-semibold">Slightly outside range</span>
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

export default MySensors;
