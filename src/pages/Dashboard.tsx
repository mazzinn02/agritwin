import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Thermometer, 
  Droplets, 
  Sun, 
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
  UserCheck
} from 'lucide-react';
import { CropGrowthTracker } from '../components/dashboard/CropGrowthTracker';
import { DailyActionBanner } from '../components/common/DailyActionBanner';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { PrototypeModeBanner } from '../components/common/PrototypeModeBanner';
import { useAgriStore } from '../context/AgriStore';

export const Dashboard = () => {
  const { activeSections, crops, activeFarmland, triggerActuator, telemetryObservations, isAdmin } = useAgriStore();
  const [selectedPlotId, setSelectedPlotId] = useState<string>(activeSections[0]?.id || '');
  const [notice, setNotice] = useState<string | null>(null);

  const activePlot = useMemo(() => {
    return activeSections.find(p => p.id === selectedPlotId) || activeSections[0] || null;
  }, [activeSections, selectedPlotId]);

  const assignedCrop = useMemo(() => {
    if (!activePlot || !activePlot.cropId) return null;
    return crops.find(c => c.id === activePlot.cropId) || null;
  }, [activePlot, crops]);

  // Find latest telemetry observations for active plot
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

  // Dynamic Biophysical Status Engine
  const plotStatus = useMemo(() => {
    if (!activePlot) return { label: 'Standby', color: 'text-slate-500', bg: 'bg-slate-100', icon: Activity };
    if (!assignedCrop) return { label: 'Fallow Land', color: 'text-slate-600', bg: 'bg-slate-100', icon: MapPin };
    
    if (activePlot.airTemp > assignedCrop.idealTempMax) {
      return { label: 'Thermal Stress', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200', icon: Flame };
    }
    if (activePlot.soilMoisture < assignedCrop.idealMoistureMin) {
      return { label: 'Needs Water', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: AlertCircle };
    }
    return { label: 'Optimal Micro-Climate', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 };
  }, [activePlot, assignedCrop]);

  const StatusIcon = plotStatus.icon;

  const handleActuatorIrrigation = async () => {
    if (!activePlot) return;
    await triggerActuator(activePlot.id, 'irrigation', 'manual');
    setNotice(`15-Min Precision Irrigation Pulse executed on ${activePlot.code}. Soil moisture boosted (+8.5%). Telemetry & Audit Log updated.`);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleActuatorFan = async () => {
    if (!activePlot) return;
    await triggerActuator(activePlot.id, 'hvac', 'manual');
    setNotice(`Canopy Ventilation Fan toggled on ${activePlot.code}. Air temperature adjusted (-2.0°C).`);
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans pb-10">
      {/* Prototype Banner */}
      <PrototypeModeBanner />

      {/* Top Header & Bed Selector Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900">{activeFarmland?.name || 'iiit dharwad'}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Prototype Mode Digital Twin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            <span>{activeFarmland?.location || 'Dharwad, Karnataka'} &bull; {activeFarmland?.totalArea || 20} {activeFarmland?.unit || 'Acres'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Active Bed Selector Dropdown */}
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Plot:</span>
            <select
              value={selectedPlotId}
              onChange={(e) => setSelectedPlotId(e.target.value)}
              className="bg-white text-slate-900 text-xs font-bold rounded-lg px-3 py-1 border border-slate-200 focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              {activeSections.map(p => {
                const c = crops.find(crop => crop.id === p.cropId);
                return (
                  <option key={p.id} value={p.id}>
                    {p.code}: {c ? `${c.name} (${c.variety})` : p.name}
                  </option>
                );
              })}
            </select>
          </div>

          {isAdmin && (
            <Link
              to="/manual-telemetry"
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all"
            >
              <UserCheck className="w-4 h-4" />
              <span>+ Manual Observation</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/add-farmland"
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Farmland</span>
            </Link>
          )}
        </div>
      </div>

      {/* Action Notification Banner */}
      {notice && (
        <div className="p-4 bg-slate-900 text-emerald-400 rounded-2xl border border-slate-800 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Daily Action Advisor Banner */}
      <DailyActionBanner />

      {/* Phenological Stage Stepper & GDD Meter Component */}
      {activePlot && (
        <CropGrowthTracker
          plotId={activePlot.id}
          cropName={assignedCrop ? `${assignedCrop.name} (${assignedCrop.variety})` : activePlot.name}
        />
      )}

      {/* 4 DYNAMIC TELEMETRY CARDS WITH DATA SOURCE BADGES */}
      {activePlot && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Soil Moisture */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Soil Moisture</span>
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                <Droplets className="w-5 h-5" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-black text-slate-900">{activePlot.soilMoisture}%</div>
                <DataSourceBadge source={latestMoistureObs?.dataSource || 'MANUAL_PROTOTYPE'} />
              </div>

              <p className="text-[11px] font-semibold text-slate-500 mt-1">
                Optimal Target: {assignedCrop ? `${assignedCrop.idealMoistureMin}%–${assignedCrop.idealMoistureMax}%` : '50%–75%'}
              </p>

              {latestMoistureObs && (
                <span className="text-[10px] text-slate-400 block mt-1 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Observed {new Date(latestMoistureObs.measurementTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
              )}
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  assignedCrop && activePlot.soilMoisture < assignedCrop.idealMoistureMin ? 'bg-amber-500' : 'bg-sky-500'
                }`}
                style={{ width: `${Math.min(100, activePlot.soilMoisture)}%` }}
              />
            </div>
          </div>

          {/* Card 2: Air Temperature */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Air Temperature</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Thermometer className="w-5 h-5" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-black text-slate-900">{activePlot.airTemp}°C</div>
                <DataSourceBadge source={latestTempObs?.dataSource || 'MANUAL_PROTOTYPE'} />
              </div>

              <p className="text-[11px] font-semibold text-slate-500 mt-1">
                Optimal Target: {assignedCrop ? `${assignedCrop.idealTempMin}°C–${assignedCrop.idealTempMax}°C` : '20°C–30°C'}
              </p>

              {latestTempObs && (
                <span className="text-[10px] text-slate-400 block mt-1 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Observed {new Date(latestTempObs.measurementTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
              )}
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  assignedCrop && activePlot.airTemp > assignedCrop.idealTempMax ? 'bg-rose-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, (activePlot.airTemp / 45) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card 3: Soil pH */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Soil pH Level</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Beaker className="w-5 h-5" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-black text-slate-900">{activePlot.soilPh}</div>
                <DataSourceBadge source={latestPhObs?.dataSource || 'MANUAL_PROTOTYPE'} />
              </div>

              <p className="text-[11px] font-semibold text-slate-500 mt-1">
                Optimal Target: {assignedCrop ? `${assignedCrop.idealPhMin}–${assignedCrop.idealPhMax}` : '6.0–7.0'}
              </p>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (activePlot.soilPh / 14) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card 4: Crop Cycle & Status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Crop Status</span>
              <div className={`p-2 rounded-xl ${plotStatus.bg}`}>
                <StatusIcon className={`w-5 h-5 ${plotStatus.color}`} />
              </div>
            </div>

            <div>
              <div className={`text-lg font-black ${plotStatus.color}`}>{plotStatus.label}</div>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">
                Planted: Day {activePlot.daysPlanted} of {assignedCrop?.growthDurationDays || 100} Days
              </p>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (activePlot.daysPlanted / (assignedCrop?.growthDurationDays || 100)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 1-TAP EDGE HARDWARE ACTUATOR CONTROLS */}
      {activePlot && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Edge Hardware Actuation Matrix</span>
              <h3 className="text-lg font-extrabold text-white">Relay Control & Field Audit Trigger &bull; {activePlot.code}</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Node: {activePlot.sensorNodeId}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleActuatorIrrigation}
              className="p-5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white text-left transition-all shadow-xl flex items-center justify-between cursor-pointer group active:scale-95"
            >
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-200">1-Tap Precision Actuator</span>
                <h4 className="text-base font-black text-white mt-0.5">Irrigate 15-Min Pulse</h4>
                <p className="text-xs text-sky-100 mt-1">Boost soil moisture (+8.5%) & log audit entry</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                <Droplets className="w-6 h-6 text-white" />
              </div>
            </button>

            <button
              type="button"
              onClick={handleActuatorFan}
              className="p-5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white text-left transition-all shadow-xl flex items-center justify-between border border-slate-700 cursor-pointer group active:scale-95"
            >
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">HVAC Canopy Ventilation</span>
                <h4 className="text-base font-black text-white mt-0.5">Toggle Canopy Fan</h4>
                <p className="text-xs text-slate-300 mt-1">Adjust air temperature (-2.0°C) & balance airflow</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-amber-400" />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
