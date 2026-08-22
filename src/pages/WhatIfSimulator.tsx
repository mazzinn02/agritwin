import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from '../lib/firebase';
import { db } from '../lib/firebase';
import { Sliders, Sparkles, TrendingUp, RotateCcw, Play, Sprout } from 'lucide-react';
import { getPlots, getCrops } from '../lib/farm-storage';
import { PlotBed, Crop } from '../types';

export const WhatIfSimulator: React.FC = () => {
  const [plots, setPlots] = useState<PlotBed[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState('');
  
  // Simulated Slider Controls
  const [simSoilMoisture, setSimSoilMoisture] = useState<number>(55);
  const [simAirTemp, setSimAirTemp] = useState<number>(24);
  const [simNitrogen, setSimNitrogen] = useState<number>(45);
  const [simHumidity, setSimHumidity] = useState<number>(60);
  const [simLight, setSimLight] = useState<number>(45000);
  const [simRunning, setSimRunning] = useState(false);

  useEffect(() => {
    const loadedPlots = getPlots();
    const loadedCrops = getCrops();
    setPlots(loadedPlots);
    setCrops(loadedCrops);
    if (loadedPlots.length > 0) {
      setSelectedPlotId(loadedPlots[0].id);
      setSimSoilMoisture(loadedPlots[0].soilMoisture || 55);
      setSimAirTemp(loadedPlots[0].airTemp || 24);
    }
  }, []);

  const activePlot = useMemo(() => {
    return plots.find(p => p.id === selectedPlotId) || plots[0] || null;
  }, [plots, selectedPlotId]);

  const assignedCrop = useMemo(() => {
    if (!activePlot || !activePlot.cropId) return null;
    return crops.find(c => c.id === activePlot.cropId) || null;
  }, [activePlot, crops]);

  // Dynamic simulation math using active crop thresholds
  const simulatedScores = useMemo(() => {
    let health = 96;
    let yieldPot = 94;

    const optMoistMin = assignedCrop?.idealMoistureMin || 50;
    const optMoistMax = assignedCrop?.idealMoistureMax || 75;
    const optTempMin = assignedCrop?.idealTempMin || 18;
    const optTempMax = assignedCrop?.idealTempMax || 30;

    // Soil Moisture
    if (simSoilMoisture < optMoistMin) {
      const deficit = optMoistMin - simSoilMoisture;
      health -= deficit * 1.5;
      yieldPot -= deficit * 1.2;
    } else if (simSoilMoisture > optMoistMax) {
      const excess = simSoilMoisture - optMoistMax;
      health -= excess * 1.2;
      yieldPot -= excess * 1.0;
    }

    // Air Temperature
    if (simAirTemp < optTempMin) {
      const deficit = optTempMin - simAirTemp;
      health -= deficit * 2.0;
      yieldPot -= deficit * 1.8;
    } else if (simAirTemp > optTempMax) {
      const excess = simAirTemp - optTempMax;
      health -= excess * 2.5;
      yieldPot -= excess * 2.2;
    }

    return {
      healthScore: Math.max(15, Math.min(100, Math.round(health))),
      yieldPotential: Math.max(10, Math.min(100, Math.round(yieldPot)))
    };
  }, [simSoilMoisture, simAirTemp, assignedCrop]);

  const handleReset = () => {
    if (activePlot) {
      setSimSoilMoisture(activePlot.soilMoisture);
      setSimAirTemp(activePlot.airTemp);
      setSimNitrogen(45);
      setSimHumidity(60);
      setSimLight(45000);
    }
  };

  if (plots.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <Sprout className="w-12 h-12 text-emerald-800 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Plots Configured</h2>
        <p className="text-sm text-slate-500">Configure plots in Onboarding or Virtual Farm to access What-If scenario simulations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 font-sans pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center">
            <Sliders className="mr-3 text-sky-600 w-8 h-8" />
            Biophysical What-If Simulator
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Simulate environmental stress, heatwaves, and irrigation deficits on {assignedCrop ? `${assignedCrop.name} (${assignedCrop.variety})` : activePlot?.name}
          </p>
        </div>

        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Plot:</span>
          <select 
            value={selectedPlotId} 
            onChange={(e) => setSelectedPlotId(e.target.value)}
            className="bg-slate-50 text-slate-900 text-xs font-bold rounded-xl px-3 py-1.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulation Controls Slider Panel */}
        <div className="lg:col-span-2 bg-white/95 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-slate-200/80 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900">Environmental & Soil Telemetry Variables</h3>
            <button
              onClick={handleReset}
              className="flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Live</span>
            </button>
          </div>

          {/* Soil Moisture Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600">Simulated Soil Moisture</span>
              <span className="text-sky-600">{simSoilMoisture}%</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="90" 
              value={simSoilMoisture}
              onChange={(e) => setSimSoilMoisture(Number(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>Severe Drought (10%)</span>
              <span>Ideal: {assignedCrop?.idealMoistureMin || 50}% - {assignedCrop?.idealMoistureMax || 75}%</span>
              <span>Waterlogged (90%)</span>
            </div>
          </div>

          {/* Air Temperature Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600">Simulated Canopy Temperature</span>
              <span className="text-rose-600">{simAirTemp}°C</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="45" 
              value={simAirTemp}
              onChange={(e) => setSimAirTemp(Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>Frost Zone (5°C)</span>
              <span>Optimal: {assignedCrop?.idealTempMin || 18}°C - {assignedCrop?.idealTempMax || 30}°C</span>
              <span>Heatwave (45°C)</span>
            </div>
          </div>

          {/* Nitrogen Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600">Substrate Nitrogen (N)</span>
              <span className="text-purple-600">{simNitrogen} mg/kg</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="100" 
              value={simNitrogen}
              onChange={(e) => setSimNitrogen(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Projected Outcomes Panel */}
        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Projected Biophysical Response
            </h3>
            
            <div className="mt-6 space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600">Simulated Crop Health Score</span>
                  <span className="text-emerald-800">{simulatedScores.healthScore}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-800 h-full rounded-full transition-all duration-300"
                    style={{ width: `${simulatedScores.healthScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600">Projected Yield Retention</span>
                  <span className="text-sky-600">{simulatedScores.yieldPotential}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-sky-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${simulatedScores.yieldPotential}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Yield Impact Analysis</span>
                <p className="text-xs text-slate-700 font-medium">
                  {simulatedScores.healthScore >= 85 
                    ? 'Parameters remain in safe agronomic bounds. Normal canopy expansion expected.'
                    : 'Stress deviation detected. Prolonged exposure will retard phenological development by 2-5 days.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatIfSimulator;
