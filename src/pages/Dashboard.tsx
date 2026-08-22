import React, { useEffect, useState, useMemo } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Sun, 
  Activity, 
  Zap, 
  Beaker, 
  Sprout, 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Wind, 
  Clock, 
  Sparkles,
  Layers,
  ShieldCheck,
  Cpu,
  MapPin
} from 'lucide-react';
import { CropGrowthTracker } from '../components/dashboard/CropGrowthTracker';
import { DailyActionBanner } from '../components/common/DailyActionBanner';
import { useUserMode } from '../context/UserModeContext';
import { getFarmProfile, getPlots, getCrops, updatePlot, addTelemetryRecord } from '../lib/farm-storage';
import { logFieldAction } from '../lib/audit-log';
import { FarmProfile, PlotBed, Crop } from '../types';

export const Dashboard = () => {
  const { isFarmer } = useUserMode();
  const [farmProfile, setFarmProfile] = useState<FarmProfile | null>(null);
  const [plots, setPlots] = useState<PlotBed[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string>('');
  const [wateringTimer, setWateringTimer] = useState<number>(0);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const reloadData = () => {
    const profile = getFarmProfile() || {
      name: 'AgriTwin Smart Farm',
      location: 'Precision Agriculture Campus',
      totalArea: 25,
      unit: 'acres' as any,
      onboardingCompleted: true
    };
    const loadedPlots = getPlots();
    const loadedCrops = getCrops();

    setFarmProfile(profile);
    setPlots(loadedPlots);
    setCrops(loadedCrops);

    if (loadedPlots.length > 0) {
      setSelectedPlotId(prev => {
        if (prev && loadedPlots.some(p => p.id === prev)) return prev;
        return loadedPlots[0].id;
      });
    }
  };

  useEffect(() => {
    reloadData();

    const handleStorageUpdate = () => {
      reloadData();
    };

    window.addEventListener('agri_storage_updated', handleStorageUpdate);
    return () => window.removeEventListener('agri_storage_updated', handleStorageUpdate);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (wateringTimer > 0) {
      const t = setTimeout(() => setWateringTimer(wateringTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [wateringTimer]);

  const activePlot = useMemo(() => {
    return plots.find(p => p.id === selectedPlotId) || plots[0] || null;
  }, [plots, selectedPlotId]);

  const assignedCrop = useMemo(() => {
    if (!activePlot || !activePlot.cropId) return null;
    return crops.find(c => c.id === activePlot.cropId) || null;
  }, [activePlot, crops]);

  // Dynamic Status Evaluation
  const plotStatus = useMemo(() => {
    if (!activePlot) return { label: 'Standby', color: 'text-slate-500', bg: 'bg-slate-100', icon: Activity };
    if (!assignedCrop) return { label: 'Fallow Land', color: 'text-slate-600', bg: 'bg-slate-100', icon: Layers };
    
    if (activePlot.airTemp > (assignedCrop.idealTempMax || 32)) {
      return { label: 'Thermal Stress', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200', icon: Flame };
    }
    if (activePlot.soilMoisture < (assignedCrop.idealMoistureMin || 50)) {
      return { label: 'Water Needed', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: AlertCircle };
    }
    return { label: 'Optimal Micro-Climate', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 };
  }, [activePlot, assignedCrop]);

  // 1-Tap Quick Action: Water 15 mins
  const handleQuickWater = async () => {
    if (!activePlot) return;
    setWateringTimer(15 * 60);
    const boostedMoisture = Math.min(88, Number((activePlot.soilMoisture + 8.5).toFixed(1)));
    
    const updated = {
      ...activePlot,
      soilMoisture: boostedMoisture,
      isWatering: true
    };
    updatePlot(updated);

    // Record Telemetry
    addTelemetryRecord({
      timestamp: new Date().toISOString(),
      plotCode: activePlot.code,
      cropName: assignedCrop ? `${assignedCrop.name} (${assignedCrop.variety})` : 'Fallow',
      soilMoisture: boostedMoisture,
      airTemp: activePlot.airTemp,
      soilPh: activePlot.soilPh,
      status: 'Optimal'
    });

    // Record Field Audit Log
    await logFieldAction(
      activePlot.id,
      'irrigation',
      'manual',
      `Dashboard 1-Tap Actuator: Executed 15-min precision irrigation pulse on ${activePlot.code}. Moisture boosted to ${boostedMoisture}%.`,
      activePlot.code
    );

    setActionNotice(`Irrigation solenoid actuated on ${activePlot.code}. Moisture increased (+8.5%).`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // 1-Tap Quick Action: Toggle Fan
  const handleToggleFan = async () => {
    if (!activePlot) return;
    const nextHvac = !activePlot.hvacActive;
    const updated = {
      ...activePlot,
      hvacActive: nextHvac
    };
    updatePlot(updated);

    await logFieldAction(
      activePlot.id,
      'hvac',
      'manual',
      `Dashboard Actuator: Toggled Canopy Ventilation Fan ${nextHvac ? 'ON' : 'OFF'} on ${activePlot.code}.`,
      activePlot.code
    );

    setActionNotice(`Ventilation Fan on ${activePlot.code} turned ${nextHvac ? 'ON' : 'OFF'}.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  if (plots.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <Sprout className="w-12 h-12 text-emerald-800 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Plots Configured Yet</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Your digital twin farm currently has no active soil beds. Complete the Onboarding Wizard or add a plot in Virtual Farm.
        </p>
      </div>
    );
  }

  const StatusIcon = plotStatus.icon;

  return (
    <div className="space-y-6 text-slate-800 font-sans pb-10">
      
      {/* ================= TOP FARM HEADER & DYNAMIC PLOT SELECTOR ================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Dynamic Farm Name */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-600/20 shrink-0">
            <Sprout className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {farmProfile?.name || 'AgriTwin Smart Farm'}
              </h1>
              <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {plots.length} Active Farm {plots.length === 1 ? 'Bed' : 'Beds'}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium mt-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>{farmProfile?.location || 'Central Valley Agri-Hub'}</span>
            </div>
          </div>
        </div>

        {/* Right: Dynamic Plot Selector & Live Edge Indicator */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Bed:</span>
            <select
              value={selectedPlotId}
              onChange={(e) => setSelectedPlotId(e.target.value)}
              className="bg-white text-slate-900 text-xs font-bold rounded-lg px-3 py-1 border border-slate-200 focus:outline-none focus:border-emerald-800 cursor-pointer"
            >
              {plots.map(p => {
                const c = crops.find(crop => crop.id === p.cropId);
                return (
                  <option key={p.id} value={p.id}>
                    {p.code}: {c ? `${c.name} (${c.variety})` : p.name}
                  </option>
                );
              })}
            </select>
          </div>

          <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center space-x-1.5 ${plotStatus.bg}`}>
            <StatusIcon className={`w-3.5 h-3.5 ${plotStatus.color}`} />
            <span className={plotStatus.color}>{plotStatus.label}</span>
          </div>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center space-x-2 animate-in fade-in">
          <Activity className="w-4 h-4 text-emerald-700 animate-spin" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Daily Action Banner */}
      <DailyActionBanner />

      {/* ================= 4-UP TELEMETRY METRIC TILES ================= */}
      {activePlot && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Soil Moisture */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Soil Moisture</span>
              <Droplets className="w-4 h-4 text-sky-600" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{activePlot.soilMoisture}%</span>
              <span className="text-xs text-slate-400 font-medium">Root Zone</span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
              {assignedCrop ? `Target: ${assignedCrop.idealMoistureMin}% - ${assignedCrop.idealMoistureMax}%` : 'Optimal Baseline'}
            </div>
          </div>

          {/* Ambient Temp */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Air Temperature</span>
              <Thermometer className="w-4 h-4 text-rose-500" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{activePlot.airTemp}°C</span>
              <span className="text-xs text-slate-400 font-medium">Canopy Level</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
              {assignedCrop ? `Range: ${assignedCrop.idealTempMin}°C - ${assignedCrop.idealTempMax}°C` : 'Optimal Comfort'}
            </div>
          </div>

          {/* Soil pH */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Substrate Soil pH</span>
              <Beaker className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{activePlot.soilPh}</span>
              <span className="text-xs text-slate-400 font-medium">pH Acidity</span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
              {assignedCrop ? `Target: ${assignedCrop.idealPhMin} - ${assignedCrop.idealPhMax}` : 'Balanced Substrate'}
            </div>
          </div>

          {/* Phenology / Days Planted */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Growth Cycle</span>
              <Sprout className="w-4 h-4 text-emerald-800" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">Day {activePlot.daysPlanted}</span>
              <span className="text-xs text-slate-400 font-medium">
                {assignedCrop ? `of ${assignedCrop.growthDurationDays}d` : 'Planted'}
              </span>
            </div>
            <div className="text-[11px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md inline-block">
              Node: {activePlot.sensorNodeId || activePlot.sensorId || 'NODE-01'}
            </div>
          </div>

        </div>
      )}

      {/* ================= 1-TAP CLOSED-LOOP ACTUATOR CONTROLS ================= */}
      {activePlot && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Zap className="w-5 h-5 text-emerald-800" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Precision Actuators for {activePlot.code} ({assignedCrop ? assignedCrop.name : activePlot.name})
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-400">Verifiable Field Audit Logging Active</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleQuickWater}
              disabled={wateringTimer > 0 || activePlot.isWatering}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                wateringTimer > 0 || activePlot.isWatering
                  ? 'bg-sky-600 text-white animate-pulse'
                  : 'bg-emerald-800 hover:bg-emerald-700 text-white shadow-xs'
              }`}
            >
              <Droplets className="w-4 h-4" />
              <span>
                {wateringTimer > 0 
                  ? `Irrigating Bed... (${Math.floor(wateringTimer / 60)}m ${wateringTimer % 60}s)` 
                  : 'Trigger 15-Min Precision Pulse (+8.5%)'}
              </span>
            </button>

            <button
              onClick={handleToggleFan}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 border transition-all cursor-pointer ${
                activePlot.hvacActive
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Wind className="w-4 h-4" />
              <span>{activePlot.hvacActive ? 'Canopy Fan Running (ON)' : 'Turn Canopy Fan ON'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= GDD GROWTH TRACKER ================= */}
      {activePlot && (
        <CropGrowthTracker plotId={activePlot.id} />
      )}

    </div>
  );
};

export default Dashboard;
