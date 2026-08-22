import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Droplet, 
  Wind, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Flame, 
  Sun,
  Sprout,
  Check
} from 'lucide-react';
import { useUserMode } from '../../context/UserModeContext';
import { getPlots, getCrops, updatePlot, addTelemetryRecord } from '../../lib/farm-storage';
import { logFieldAction } from '../../lib/audit-log';
import { PlotBed, Crop } from '../../types';

export interface ActionItem {
  id: string;
  plotId: string;
  plotCode: string;
  crop: string;
  variety: string;
  status: 'optimal' | 'warning' | 'urgent';
  title: string;
  description: string;
  actionLabel?: string;
  deviceType?: 'irrigation' | 'hvac';
  durationMins?: number;
}

export const DailyActionBanner: React.FC = () => {
  const { isFarmer } = useUserMode();
  const [plots, setPlots] = useState<PlotBed[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = () => {
    setPlots(getPlots());
    setCrops(getCrops());
  };

  useEffect(() => {
    loadData();
    const handleStorageUpdate = () => loadData();
    window.addEventListener('agri_storage_updated', handleStorageUpdate);
    return () => window.removeEventListener('agri_storage_updated', handleStorageUpdate);
  }, []);

  // Timer countdown loop
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers(prev => {
        const next = { ...prev };
        let changed = false;
        Object.entries(next).forEach(([key, val]) => {
          const seconds = Number(val);
          if (seconds > 1) {
            next[key] = seconds - 1;
            changed = true;
          } else {
            delete next[key];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerAction = async (plotId: string, plotCode: string, deviceType: 'irrigation' | 'hvac', durationMins: number = 15) => {
    const timerKey = `${plotId}_${deviceType}`;
    setActiveTimers(prev => ({ ...prev, [timerKey]: durationMins * 60 }));

    const targetPlot = plots.find(p => p.id === plotId);
    if (!targetPlot) return;

    if (deviceType === 'irrigation') {
      const boostedMoisture = Math.min(88, Number((targetPlot.soilMoisture + 8.5).toFixed(1)));
      const updated = { ...targetPlot, soilMoisture: boostedMoisture, isWatering: true };
      updatePlot(updated);

      const targetCrop = crops.find(c => c.id === targetPlot.cropId);
      addTelemetryRecord({
        timestamp: new Date().toISOString(),
        plotCode: targetPlot.code,
        cropName: targetCrop ? `${targetCrop.name} (${targetCrop.variety})` : 'Fallow',
        soilMoisture: boostedMoisture,
        airTemp: targetPlot.airTemp,
        soilPh: targetPlot.soilPh,
        status: 'Optimal'
      });

      await logFieldAction(
        plotId,
        'irrigation',
        'manual',
        `Daily Action: Triggered ${durationMins}-min irrigation on ${plotCode}. Moisture raised to ${boostedMoisture}%.`,
        plotCode
      );

      setActionSuccess(`Irrigation activated for ${plotCode} (+8.5% Moisture boost recorded).`);
    } else {
      const nextHvac = !targetPlot.hvacActive;
      const updated = { ...targetPlot, hvacActive: nextHvac };
      updatePlot(updated);

      await logFieldAction(
        plotId,
        'hvac',
        'manual',
        `Daily Action: Switched canopy ventilation fan ${nextHvac ? 'ON' : 'OFF'} on ${plotCode}.`,
        plotCode
      );

      setActionSuccess(`Canopy fans toggled for ${plotCode}.`);
    }

    setTimeout(() => setActionSuccess(null), 4000);
  };

  const actionItems: ActionItem[] = useMemo(() => {
    if (plots.length === 0) return [];

    return plots.map(plot => {
      const crop = crops.find(c => c.id === plot.cropId);
      const cropName = crop?.name || 'Crop';
      const variety = crop?.variety || 'Cultivar';

      const minMoisture = crop?.idealMoistureMin || 50;
      const maxTemp = crop?.idealTempMax || 30;

      if (plot.airTemp > maxTemp) {
        return {
          id: `act_${plot.id}`,
          plotId: plot.id,
          plotCode: plot.code,
          crop: cropName,
          variety,
          status: 'urgent',
          title: `Thermal Stress Warning (${plot.airTemp}°C)`,
          description: `Canopy temperature exceeds ideal threshold (${maxTemp}°C). Activate cooling fan.`,
          actionLabel: 'Turn On Shade Fans',
          deviceType: 'hvac',
          durationMins: 30
        };
      }

      if (plot.soilMoisture < minMoisture) {
        return {
          id: `act_${plot.id}`,
          plotId: plot.id,
          plotCode: plot.code,
          crop: cropName,
          variety,
          status: 'warning',
          title: `Soil Moisture Low (${plot.soilMoisture}%)`,
          description: `Moisture below target baseline of ${minMoisture}%. Irrigation recommended.`,
          actionLabel: 'Water for 15 Mins',
          deviceType: 'irrigation',
          durationMins: 15
        };
      }

      return {
        id: `act_${plot.id}`,
        plotId: plot.id,
        plotCode: plot.code,
        crop: cropName,
        variety,
        status: 'optimal',
        title: 'Micro-Climate Optimal',
        description: `Soil moisture at ${plot.soilMoisture}%, Temp at ${plot.airTemp}°C. Normal healthy transpiration.`
      };
    });
  }, [plots, crops]);

  if (actionItems.length === 0) return null;

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 relative overflow-hidden transition-all">
      
      {/* Ambient background decoration */}
      <div className="absolute top-0 right-0 w-80 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shadow-2xs">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Smart Farm Precision Dispatcher</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                {isFarmer ? 'Farmer Priority Mode' : 'Agronomist Mode'}
              </span>
            </h3>
            <p className="text-xs text-slate-500">Live dynamic recommendations tailored to real-time sensor streams</p>
          </div>
        </div>

        {actionSuccess && (
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {actionItems.map((item) => {
          const timerKey = `${item.plotId}_${item.deviceType}`;
          const isTimerActive = !!activeTimers[timerKey];
          const remainingSecs = activeTimers[timerKey] || 0;
          const minsLeft = Math.floor(remainingSecs / 60);
          const secsLeft = remainingSecs % 60;

          return (
            <div 
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                item.status === 'urgent' 
                  ? 'bg-rose-50/60 border-rose-200/90 text-rose-950 shadow-2xs' 
                  : item.status === 'warning'
                  ? 'bg-amber-50/60 border-amber-200/90 text-amber-950 shadow-2xs'
                  : 'bg-emerald-50/40 border-emerald-200/80 text-emerald-950'
              }`}
            >
              {/* Card Header: Crop info & Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded-lg text-white font-bold text-xs ${
                    item.status === 'urgent' ? 'bg-rose-600' : item.status === 'warning' ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}>
                    <Sprout className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold tracking-tight">
                      {item.plotCode}: {item.crop}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">{item.variety}</p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  item.status === 'urgent'
                    ? 'bg-rose-100 text-rose-700 border-rose-300'
                    : item.status === 'warning'
                    ? 'bg-amber-100 text-amber-700 border-amber-300'
                    : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                }`}>
                  {item.status === 'urgent' ? 'Action Needed' : item.status === 'warning' ? 'Alert' : 'Optimal'}
                </span>
              </div>

              {/* Card Body: Description */}
              <div className="space-y-1">
                <p className="text-xs font-bold leading-snug">{item.title}</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">{item.description}</p>
              </div>

              {/* Card Footer: Dynamic Actuation Button */}
              {item.actionLabel && item.deviceType && (
                <div className="pt-1">
                  {isTimerActive ? (
                    <div className="w-full py-2 px-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>
                        Running ({minsLeft}:{secsLeft < 10 ? `0${secsLeft}` : secsLeft})
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleTriggerAction(item.plotId, item.plotCode, item.deviceType!, item.durationMins || 15)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
                        item.status === 'urgent'
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                          : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                      }`}
                    >
                      {item.deviceType === 'irrigation' ? (
                        <Droplet className="w-3.5 h-3.5" />
                      ) : (
                        <Wind className="w-3.5 h-3.5" />
                      )}
                      <span>{item.actionLabel}</span>
                    </button>
                  )}
                </div>
              )}

              {item.status === 'optimal' && (
                <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-700 pt-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>No intervention required</span>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default DailyActionBanner;
