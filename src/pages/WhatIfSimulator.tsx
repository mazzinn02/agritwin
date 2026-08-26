import React, { useState, useMemo } from 'react';
import { Sliders, Sparkles, TrendingUp, RotateCcw, Play, Sprout, ShieldCheck } from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';

export const WhatIfSimulator: React.FC = () => {
  const { activeSections, crops } = useAgriStore();
  const [selectedPlotId, setSelectedPlotId] = useState(activeSections[0]?.id || '');

  const activePlot = useMemo(() => {
    return activeSections.find(p => p.id === selectedPlotId) || activeSections[0] || null;
  }, [activeSections, selectedPlotId]);

  const assignedCrop = useMemo(() => {
    if (!activePlot || !activePlot.cropId) return null;
    return crops.find(c => c.id === activePlot.cropId) || null;
  }, [activePlot, crops]);

  // Simulation Sliders
  const [simSoilMoisture, setSimSoilMoisture] = useState<number>(activePlot?.soilMoisture || 60);
  const [simAirTemp, setSimAirTemp] = useState<number>(activePlot?.airTemp || 25);
  const [simNitrogen, setSimNitrogen] = useState<number>(45);

  // Dynamic Biophysical Math
  const simulatedScores = useMemo(() => {
    let health = 96;
    let yieldRetention = 94;

    const optMoistMin = assignedCrop?.idealMoistureMin || 55;
    const optMoistMax = assignedCrop?.idealMoistureMax || 75;
    const optTempMin = assignedCrop?.idealTempMin || 20;
    const optTempMax = assignedCrop?.idealTempMax || 28;

    // Soil Moisture Impact
    if (simSoilMoisture < optMoistMin) {
      const def = optMoistMin - simSoilMoisture;
      health -= def * 1.6;
      yieldRetention -= def * 1.4;
    } else if (simSoilMoisture > optMoistMax) {
      const exc = simSoilMoisture - optMoistMax;
      health -= exc * 1.2;
      yieldRetention -= exc * 1.0;
    }

    // Air Temperature Impact
    if (simAirTemp > optTempMax) {
      const exc = simAirTemp - optTempMax;
      health -= exc * 2.2;
      yieldRetention -= exc * 2.0;
    } else if (simAirTemp < optTempMin) {
      const def = optTempMin - simAirTemp;
      health -= def * 1.5;
      yieldRetention -= def * 1.2;
    }

    // Nitrogen Impact
    if (simNitrogen < 30) {
      health -= (30 - simNitrogen) * 0.8;
    }

    return {
      healthScore: Math.max(10, Math.min(100, Math.round(health))),
      yieldRetention: Math.max(10, Math.min(100, Math.round(yieldRetention)))
    };
  }, [simSoilMoisture, simAirTemp, simNitrogen, assignedCrop]);

  const handleReset = () => {
    if (activePlot) {
      setSimSoilMoisture(activePlot.soilMoisture);
      setSimAirTemp(activePlot.airTemp);
      setSimNitrogen(45);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-800 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Biophysical What-If Simulator</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate hypothetical climate stress, moisture deficits, and NPK shifts against agronomic limits.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Plot Bed:</span>
          <select
            value={selectedPlotId}
            onChange={(e) => setSelectedPlotId(e.target.value)}
            className="bg-white text-slate-900 text-xs font-bold rounded-lg px-3 py-1.5 border border-slate-200 outline-none cursor-pointer"
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
      </div>

      {/* Main Grid: Controls vs Simulated Output */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Sliders */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Environmental Stress Parameters</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Crop: <strong className="text-emerald-700">{assignedCrop ? `${assignedCrop.name} (${assignedCrop.variety})` : 'Fallow'}</strong>
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Values</span>
            </button>
          </div>

          {/* Slider 1: Soil Moisture */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700">Simulated Soil Moisture</span>
              <span className="text-sky-700 font-extrabold text-sm">{simSoilMoisture}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="95"
              value={simSoilMoisture}
              onChange={e => setSimSoilMoisture(parseInt(e.target.value))}
              className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />
            {assignedCrop && (
              <span className="text-[11px] text-slate-400 block">
                Target Optimal Range: {assignedCrop.idealMoistureMin}% – {assignedCrop.idealMoistureMax}%
              </span>
            )}
          </div>

          {/* Slider 2: Air Temperature */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700">Simulated Air Temperature</span>
              <span className="text-amber-700 font-extrabold text-sm">{simAirTemp}°C</span>
            </div>
            <input
              type="range"
              min="10"
              max="45"
              value={simAirTemp}
              onChange={e => setSimAirTemp(parseInt(e.target.value))}
              className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            {assignedCrop && (
              <span className="text-[11px] text-slate-400 block">
                Target Optimal Range: {assignedCrop.idealTempMin}°C – {assignedCrop.idealTempMax}°C
              </span>
            )}
          </div>

          {/* Slider 3: Nitrogen Soil Level */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700">Nitrogen Concentration (N)</span>
              <span className="text-emerald-700 font-extrabold text-sm">{simNitrogen} ppm</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={simNitrogen}
              onChange={e => setSimNitrogen(parseInt(e.target.value))}
              className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>
        </div>

        {/* Right Col: Real-Time Calculated Outcomes */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 flex flex-col justify-between space-y-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Calculated Biophysical Outcome</span>
            <h3 className="text-lg font-black text-white mt-1">Twin Predictive Yield</h3>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Simulated Crop Health Score</span>
              <div className="text-4xl font-black text-emerald-400">{simulatedScores.healthScore}%</div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${simulatedScores.healthScore}%` }} />
              </div>
            </div>

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Projected Yield Retention</span>
              <div className="text-4xl font-black text-sky-400">{simulatedScores.yieldRetention}%</div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full transition-all duration-300" style={{ width: `${simulatedScores.yieldRetention}%` }} />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-medium text-slate-300 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Real-time biophysical engine evaluation active.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatIfSimulator;
