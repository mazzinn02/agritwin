import React, { useState } from 'react';
import { DigitalTwinCropState } from '../types';
import { PARAMETER_METADATA } from '../data/sampleCrops';
import { 
  Ruler, 
  Maximize, 
  TrendingUp, 
  ShieldAlert, 
  Apple, 
  Sprout, 
  Thermometer, 
  Droplets, 
  Sun, 
  CloudRain, 
  Activity, 
  Layers,
  Radio,
  Sparkles
} from 'lucide-react';

interface DigitalTwinCanvasProps {
  twinState: DigitalTwinCropState;
  onStateChange: (updated: Partial<DigitalTwinCropState>) => void;
}

export const DigitalTwinCanvas: React.FC<DigitalTwinCanvasProps> = ({
  twinState,
  onStateChange,
}) => {
  const [activeOverlay, setActiveOverlay] = useState<'all' | 'height' | 'canopy' | 'disease' | 'ripeness'>('all');
  const [isSimulatingIrrigation, setIsSimulatingIrrigation] = useState(false);

  const handleSimulateIrrigation = () => {
    setIsSimulatingIrrigation(true);
    setTimeout(() => {
      onStateChange({
        sensors: {
          ...twinState.sensors,
          soilMoisture: Math.min(100, twinState.sensors.soilMoisture + 15),
        },
        healthScore: Math.min(100, twinState.healthScore + 3),
        diseaseRiskPercent: Math.max(0, twinState.diseaseRiskPercent - 2),
      });
      setIsSimulatingIrrigation(false);
    }, 1200);
  };

  // Color calculation for fruit ripeness
  const getRipenessColor = (pct: number) => {
    if (pct < 30) return '#22c55e'; // Green
    if (pct < 70) return '#eab308'; // Amber/Yellow
    return '#ef4444'; // Red/Ripe
  };

  return (
    <div className="space-y-4">
      {/* Top Twin Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {PARAMETER_METADATA.map((param) => {
          let val = 0;
          let format = '';
          if (param.id === 'height') { val = twinState.plantHeightCm; format = `${val.toFixed(1)} cm`; }
          else if (param.id === 'canopy') { val = twinState.canopyCoveragePercent; format = `${val.toFixed(1)}%`; }
          else if (param.id === 'growth') { val = twinState.growthRateCmPerDay; format = `+${val.toFixed(1)} cm/d`; }
          else if (param.id === 'disease') { val = twinState.diseaseRiskPercent; format = `${val.toFixed(1)}% risk`; }
          else if (param.id === 'ripeness') { val = twinState.fruitRipenessPercent; format = `${val.toFixed(1)}% ripe`; }
          else if (param.id === 'yield') { val = twinState.estimatedYieldKgPerM2; format = `${val.toFixed(1)} kg/m²`; }

          return (
            <div
              key={param.id}
              onClick={() => setActiveOverlay(param.id as any)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                activeOverlay === param.id
                  ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                  : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">{param.name.replace(' Detection', '')}</span>
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: param.color }}
                />
              </div>
              <div className="text-xl font-bold text-slate-900 tracking-tight">{format}</div>
            </div>
          );
        })}
      </div>

      {/* Main Canvas & Live Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Interactive Digital Twin Render Stage (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-slate-100 p-4 relative overflow-hidden">
          {/* Header Controls for Canvas */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Twin Simulation Stage
              </h2>
              <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-md font-medium">
                {twinState.cropType} • Stage: {twinState.stage}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <span className="text-slate-500 font-medium">Overlay:</span>
              {(['all', 'height', 'canopy', 'disease', 'ripeness'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setActiveOverlay(mode)}
                  className={`px-3 py-1.5 rounded-lg border transition-colors capitalize font-medium ${
                    activeOverlay === mode
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Graphical Crop Field Visualization Stage */}
          <div className="relative w-full h-[400px] bg-slate-50 rounded-xl border border-slate-100 overflow-hidden flex items-center justify-center">
            {/* Field Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#64748b 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            />

            {/* IoT Sensor Pulse Node */}
            <div className="absolute top-4 left-4 flex items-center space-x-2 bg-white/90 backdrop-blur border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              <div>
                <div className="font-bold text-slate-900 text-xs">{twinState.sensors.id}</div>
                <div className="text-[10px] text-slate-500 font-medium">{twinState.sensors.name}</div>
              </div>
            </div>

            {/* Health Index Meter Overlay */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg border border-slate-200 p-3 shadow-sm text-right">
              <div className="text-xs text-slate-500 font-medium">Twin Health Index</div>
              <div className="text-2xl font-bold text-emerald-600">{twinState.healthScore}%</div>
            </div>

            {/* Simulated Plants Row in Canvas */}
            <div className="relative z-10 flex items-end justify-center space-x-8 w-full max-w-xl px-4">
              {[0, 1, 2, 3, 4].map((idx) => {
                // Height calculation scaled for visualization
                const plantHeightPx = Math.min(260, Math.max(60, twinState.plantHeightCm * 1.8));
                const canopyWidthPx = Math.min(140, Math.max(50, twinState.canopyCoveragePercent * 1.4));
                const ripenessColor = getRipenessColor(twinState.fruitRipenessPercent);

                return (
                  <div key={idx} className="flex flex-col items-center group relative">
                    {/* Plant Height Annotation */}
                    {(activeOverlay === 'all' || activeOverlay === 'height') && idx === 2 && (
                      <div className="absolute -top-10 bg-white shadow-md rounded-lg text-slate-900 px-2 py-1 text-xs font-bold animate-bounce z-20 border border-slate-100">
                        Height: {twinState.plantHeightCm.toFixed(1)} cm
                      </div>
                    )}

                    {/* Disease Alert Highlight */}
                    {(activeOverlay === 'all' || activeOverlay === 'disease') && twinState.diseaseRiskPercent > 12 && idx === 1 && (
                      <div className="absolute -top-12 bg-red-50 border border-red-200 text-red-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 animate-pulse z-20 shadow-sm">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Spot Risk ({twinState.diseaseRiskPercent}%)</span>
                      </div>
                    )}

                    {/* Plant SVG Structure */}
                    <div 
                      className="relative flex items-end justify-center transition-all duration-500"
                      style={{ height: `${plantHeightPx}px` }}
                    >
                      {/* Main Stem */}
                      <div className="w-3 bg-gradient-to-t from-emerald-800 to-emerald-500 rounded-full h-full shadow-inner" />

                      {/* Leaves Canopy Layer */}
                      <div 
                        className="absolute bottom-1/3 rounded-full bg-emerald-500/90 shadow-lg backdrop-blur-sm transition-all duration-500 border border-emerald-400"
                        style={{
                          width: `${canopyWidthPx}px`,
                          height: `${canopyWidthPx * 0.7}px`,
                          opacity: activeOverlay === 'disease' && twinState.diseaseRiskPercent > 20 ? 0.6 : 0.9,
                        }}
                      />

                      {/* Leaves Detail */}
                      <div className="absolute top-1/4 -left-6 w-8 h-4 rounded-full bg-emerald-600 transform -rotate-12 shadow-sm" />
                      <div className="absolute top-1/4 -right-6 w-8 h-4 rounded-full bg-emerald-600 transform rotate-12 shadow-sm" />
                      <div className="absolute top-2/4 -left-8 w-10 h-5 rounded-full bg-emerald-500 transform -rotate-12 shadow-sm" />
                      <div className="absolute top-2/4 -right-8 w-10 h-5 rounded-full bg-emerald-500 transform rotate-12 shadow-sm" />

                      {/* Fruit/Grain Pods with Ripeness Indicator */}
                      <div 
                        className="absolute top-1/6 w-5 h-5 rounded-full shadow-md transition-all duration-500 flex items-center justify-center border-2 border-white/50 z-10"
                        style={{ backgroundColor: ripenessColor }}
                      >
                        <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                      </div>
                    </div>

                    {/* Ground Root Base & Soil Marker */}
                    <div className="w-16 h-1.5 rounded-full bg-slate-800/20 mt-2 blur-[1px]" />
                  </div>
                );
              })}
            </div>

            {/* Bottom Parameter Legend bar on Canvas */}
            <div className="absolute bottom-4 inset-x-4 bg-white/90 backdrop-blur rounded-xl border border-slate-200 p-3 flex flex-wrap items-center justify-between text-xs font-medium text-slate-600 shadow-sm">
              <div className="flex items-center space-x-6">
                <span className="flex items-center space-x-1.5">
                  <Ruler className="w-4 h-4 text-blue-500" />
                  <span>Height: {twinState.plantHeightCm.toFixed(1)}cm</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <Maximize className="w-4 h-4 text-emerald-500" />
                  <span>Canopy: {twinState.canopyCoveragePercent.toFixed(1)}%</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <Apple className="w-4 h-4 text-amber-500" />
                  <span>Ripeness: {twinState.fruitRipenessPercent.toFixed(1)}%</span>
                </span>
              </div>
              <div className="font-bold text-purple-600">
                Yield Est: {twinState.estimatedYieldKgPerM2.toFixed(1)} kg/m²
              </div>
            </div>
          </div>
        </div>

        {/* Live Environmental Control & Sensor Suite (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Environment Actuator Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-slate-700" />
                <h3 className="text-lg font-bold text-slate-900">Climate Control</h3>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md font-medium">
                Interactive
              </span>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex justify-between font-medium">
                <span className="flex items-center space-x-1.5 text-orange-600">
                  <Thermometer className="w-4 h-4" />
                  <span>Air Temp</span>
                </span>
                <span className="font-bold text-slate-900">{twinState.sensors.temperature}°C</span>
              </div>
              <input
                type="range"
                min="10"
                max="42"
                value={twinState.sensors.temperature}
                onChange={(e) =>
                  onStateChange({
                    sensors: { ...twinState.sensors, temperature: parseFloat(e.target.value) },
                  })
                }
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            {/* Humidity Slider */}
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex justify-between font-medium">
                <span className="flex items-center space-x-1.5 text-blue-500">
                  <Droplets className="w-4 h-4" />
                  <span>Humidity</span>
                </span>
                <span className="font-bold text-slate-900">{twinState.sensors.humidity}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="95"
                value={twinState.sensors.humidity}
                onChange={(e) =>
                  onStateChange({
                    sensors: { ...twinState.sensors, humidity: parseInt(e.target.value, 10) },
                  })
                }
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Soil Moisture Slider */}
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex justify-between font-medium">
                <span className="flex items-center space-x-1.5 text-cyan-500">
                  <CloudRain className="w-4 h-4" />
                  <span>Moisture</span>
                </span>
                <span className="font-bold text-slate-900">{twinState.sensors.soilMoisture}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={twinState.sensors.soilMoisture}
                onChange={(e) =>
                  onStateChange({
                    sensors: { ...twinState.sensors, soilMoisture: parseInt(e.target.value, 10) },
                  })
                }
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Quick Action Button: Simulate Smart Irrigation */}
            <button
              onClick={handleSimulateIrrigation}
              disabled={isSimulatingIrrigation}
              className="w-full py-2.5 mt-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-70 shadow-sm"
            >
              {isSimulatingIrrigation ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Triggering Irrigation...</span>
                </>
              ) : (
                <>
                  <CloudRain className="w-4 h-4" />
                  <span>Trigger Drip Irrigation</span>
                </>
              )}
            </button>
          </div>

          {/* College Project Architecture Quick Callout */}
          <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>Project Core</span>
            </h4>
            <p className="text-sm text-emerald-700 leading-relaxed font-medium">
              This Digital Twin synchronizes physical IoT sensor streams with virtual crop state machines. The parameters drive real-time farm decision support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
