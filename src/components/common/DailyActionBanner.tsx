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
import { useAuth } from '../../context/AuthContext';
import { useAgriStore } from '../../context/AgriStore';

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
  const { isFarmer } = useAuth();
  const { activeSections: plots, crops, triggerActuator } = useAgriStore();
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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

    await triggerActuator(plotId, deviceType, 'manual');

    if (deviceType === 'irrigation') {
      setActionSuccess(`15-min irrigation pulse activated for ${plotCode} (+8.5% Moisture boost).`);
    } else {
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
        description: `Soil moisture at ${plot.soilMoisture}%, Temp at ${plot.airTemp}°C. Normal healthy transpiration.`,
        actionLabel: undefined,
        deviceType: undefined
      };
    });
  }, [plots, crops]);

  if (actionItems.length === 0) return null;

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 relative overflow-hidden transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shadow-2xs">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Smart Farm Precision Dispatcher</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                {isFarmer ? 'Farmer Priority Mode' : 'Admin Mode'}
              </span>
            </h3>
            <p className="text-xs text-slate-500">Live dynamic recommendations tailored to real-time section observations</p>
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
              {/* Card Header */}
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

              {/* Title & Description */}
              <div className="space-y-1">
                <div className="text-xs font-black text-slate-900">{item.title}</div>
                <p className="text-[11px] text-slate-600 leading-snug">{item.description}</p>
              </div>

              {/* Card Footer Button */}
              {item.actionLabel && item.deviceType && (
                <button
                  onClick={() => handleTriggerAction(item.plotId, item.plotCode, item.deviceType!, item.durationMins)}
                  disabled={isTimerActive}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold shadow-2xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 ${
                    isTimerActive
                      ? 'bg-slate-700 text-slate-300 cursor-not-allowed'
                      : item.status === 'urgent'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  {isTimerActive ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>{minsLeft}:{secsLeft < 10 ? `0${secsLeft}` : secsLeft} Remaining</span>
                    </>
                  ) : (
                    <>
                      {item.deviceType === 'irrigation' ? <Droplet className="w-3.5 h-3.5" /> : <Wind className="w-3.5 h-3.5" />}
                      <span>{item.actionLabel}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyActionBanner;
