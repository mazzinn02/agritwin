import React, { useState, useMemo } from 'react';
import { 
  Sprout, 
  Droplet, 
  Thermometer, 
  MapPin, 
  Download, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Activity, 
  Radio, 
  Sparkles, 
  Percent, 
  Calendar, 
  Settings, 
  Flame, 
  Zap, 
  TrendingUp, 
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { useAgriStore } from '../../context/AgriStore';
import { DataSourceBadge } from '../common/DataSourceBadge';
import { PrototypeModeBanner } from '../common/PrototypeModeBanner';
import { PlotBed, Crop } from '../../types';

// ================= PHOTOREALISTIC TOP-DOWN CANOPY SVG LAYERS =================

// 1. TOMATO (Glossy red tomatoes & green vines)
const TomatoCanopy = () => (
  <svg className="w-full h-full object-cover" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
    <defs>
      <radialGradient id="tomLeafGrad" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#40916c" /><stop offset="70%" stopColor="#1b4332" /><stop offset="100%" stopColor="#081c15" />
      </radialGradient>
      <radialGradient id="tomFruitGrad" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#ff758f" /><stop offset="25%" stopColor="#e63946" /><stop offset="85%" stopColor="#9e2a2b" /><stop offset="100%" stopColor="#540b0e" />
      </radialGradient>
    </defs>
    <rect width="400" height="240" fill="#132a13" />
    <g fill="url(#tomLeafGrad)" stroke="#081c15" strokeWidth="1">
      <path d="M-20,20 Q40,-10 80,40 Q30,90 -20,20 Z" />
      <path d="M70,20 Q140,0 160,60 Q100,100 70,20 Z" />
      <path d="M220,10 Q290,-20 330,40 Q260,80 220,10 Z" />
      <path d="M40,120 Q120,80 160,150 Q90,210 40,120 Z" />
      <path d="M120,90 Q200,60 240,130 Q170,180 120,90 Z" />
      <path d="M260,100 Q340,90 380,160 Q290,220 260,100 Z" />
    </g>
    {[
      { x: 60, y: 55, r: 18 }, { x: 135, y: 70, r: 22 }, { x: 270, y: 50, r: 19 },
      { x: 95, y: 155, r: 23 }, { x: 185, y: 130, r: 25 }, { x: 285, y: 160, r: 22 }
    ].map((t, i) => (
      <g key={i} transform={`translate(${t.x}, ${t.y})`}>
        <circle cx="2" cy="4" r={t.r} fill="#050e05" opacity="0.6" />
        <circle cx="0" cy="0" r={t.r} fill="url(#tomFruitGrad)" />
        <ellipse cx={-t.r * 0.3} cy={-t.r * 0.35} rx={t.r * 0.25} ry={t.r * 0.15} fill="#fff" opacity="0.4" />
      </g>
    ))}
  </svg>
);

// 2. CHILLI (Hanging red & green chillies)
const ChilliCanopy = () => (
  <svg className="w-full h-full object-cover" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
    <defs>
      <radialGradient id="chillyLeafGrad" cx="50%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#52b788" /><stop offset="60%" stopColor="#1b4332" /><stop offset="100%" stopColor="#081c15" />
      </radialGradient>
      <linearGradient id="chillyRed" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff4d6d" /><stop offset="50%" stopColor="#c9184a" /><stop offset="100%" stopColor="#590d22" />
      </linearGradient>
    </defs>
    <rect width="400" height="240" fill="#081c15" />
    <g fill="url(#chillyLeafGrad)" stroke="#081c15" strokeWidth="0.8">
      {Array.from({ length: 20 }).map((_, i) => (
        <g key={i} transform={`translate(${(i % 5) * 80 + 20}, ${Math.floor(i / 5) * 60 + 20}) rotate(${(i * 37) % 60 - 30})`}>
          <path d="M0,-35 C20,-15 25,15 0,35 C-25,15 -20,-15 0,-35 Z" />
        </g>
      ))}
    </g>
    {[
      { x: 50, y: 60, rot: 15 }, { x: 180, y: 70, rot: 25 }, { x: 320, y: 65, rot: 10 },
      { x: 120, y: 150, rot: -15 }, { x: 260, y: 140, rot: 20 }
    ].map((c, i) => (
      <g key={i} transform={`translate(${c.x}, ${c.y}) rotate(${c.rot})`}>
        <path d="M0,0 Q10,25 2,48 Q-5,25 -2,0 Z" fill="url(#chillyRed)" />
      </g>
    ))}
  </svg>
);

// 3. COTTON (Fluffy white cotton bolls & broad lobed leaves)
const CottonCanopy = () => (
  <svg className="w-full h-full object-cover" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
    <defs>
      <radialGradient id="cottonLeafGrad" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#2d6a4f" /><stop offset="70%" stopColor="#1b4332" /><stop offset="100%" stopColor="#081c15" />
      </radialGradient>
      <radialGradient id="cottonBoll" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#ffffff" /><stop offset="75%" stopColor="#e9ecef" /><stop offset="100%" stopColor="#ced4da" />
      </radialGradient>
    </defs>
    <rect width="400" height="240" fill="#0f2818" />
    <g fill="url(#cottonLeafGrad)" stroke="#081c15" strokeWidth="1">
      {Array.from({ length: 15 }).map((_, i) => (
        <circle key={i} cx={(i % 5) * 80 + 30} cy={Math.floor(i / 5) * 75 + 40} r="45" opacity="0.85" />
      ))}
    </g>
    {[
      { x: 70, y: 50 }, { x: 170, y: 65 }, { x: 270, y: 45 }, { x: 350, y: 70 },
      { x: 110, y: 150 }, { x: 220, y: 160 }, { x: 310, y: 145 }
    ].map((b, i) => (
      <g key={i} transform={`translate(${b.x}, ${b.y})`}>
        <circle cx="-6" cy="-6" r="10" fill="url(#cottonBoll)" />
        <circle cx="6" cy="-6" r="10" fill="url(#cottonBoll)" />
        <circle cx="-6" cy="6" r="10" fill="url(#cottonBoll)" />
        <circle cx="6" cy="6" r="10" fill="url(#cottonBoll)" />
        <circle cx="0" cy="0" r="12" fill="url(#cottonBoll)" />
      </g>
    ))}
  </svg>
);

// 4. SWEET CORN / MAIZE (Long green blade leaves with golden ears)
const CornCanopy = () => (
  <svg className="w-full h-full object-cover" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
    <defs>
      <radialGradient id="cornLeafGrad" cx="50%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#74c69d" /><stop offset="60%" stopColor="#2d6a4f" /><stop offset="100%" stopColor="#081c15" />
      </radialGradient>
      <linearGradient id="cornEar" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffea00" /><stop offset="50%" stopColor="#ffb703" /><stop offset="100%" stopColor="#fb8500" />
      </linearGradient>
    </defs>
    <rect width="400" height="240" fill="#0d1f12" />
    <g fill="url(#cornLeafGrad)" stroke="#081c15" strokeWidth="1">
      {Array.from({ length: 24 }).map((_, i) => (
        <path key={i} d={`M${(i % 6) * 70 + 20},${Math.floor(i / 6) * 60 + 10} Q${(i % 6) * 70 + 60},${Math.floor(i / 6) * 60 - 20} ${(i % 6) * 70 + 80},${Math.floor(i / 6) * 60 + 40} Q${(i % 6) * 70 + 40},${Math.floor(i / 6) * 60 + 30} ${(i % 6) * 70 + 20},${Math.floor(i / 6) * 60 + 10} Z`} />
      ))}
    </g>
    {[
      { x: 80, y: 60 }, { x: 220, y: 50 }, { x: 340, y: 70 },
      { x: 140, y: 160 }, { x: 280, y: 150 }
    ].map((c, i) => (
      <g key={i} transform={`translate(${c.x}, ${c.y}) rotate(25)`}>
        <rect x="-8" y="-20" width="16" height="40" rx="8" fill="url(#cornEar)" />
      </g>
    ))}
  </svg>
);

// 5. GROUNDNUT / PEANUT (Dense ground-hugging foliage with yellow flowers)
const GroundnutCanopy = () => (
  <svg className="w-full h-full object-cover" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
    <defs>
      <radialGradient id="gnutGrad" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#52b788" /><stop offset="80%" stopColor="#1b4332" /><stop offset="100%" stopColor="#081c15" />
      </radialGradient>
    </defs>
    <rect width="400" height="240" fill="#1b4332" />
    <g fill="url(#gnutGrad)" stroke="#081c15" strokeWidth="0.5">
      {Array.from({ length: 30 }).map((_, i) => (
        <circle key={i} cx={(i % 6) * 65 + 25} cy={Math.floor(i / 5) * 45 + 20} r="32" opacity="0.9" />
      ))}
    </g>
    {[
      { x: 50, y: 40 }, { x: 150, y: 60 }, { x: 250, y: 35 }, { x: 340, y: 55 },
      { x: 90, y: 140 }, { x: 200, y: 150 }, { x: 310, y: 135 }
    ].map((f, i) => (
      <circle key={i} cx={f.x} cy={f.y} r="5" fill="#ffea00" />
    ))}
  </svg>
);

const renderCanopyByCrop = (cropName?: string) => {
  const name = (cropName || '').toLowerCase();
  if (name.includes('tomato') || name.includes('sarpan')) return <TomatoCanopy />;
  if (name.includes('chill') || name.includes('byadgi')) return <ChilliCanopy />;
  if (name.includes('cotton') || name.includes('rch')) return <CottonCanopy />;
  if (name.includes('corn') || name.includes('maize') || name.includes('sugar')) return <CornCanopy />;
  if (name.includes('groundnut') || name.includes('peanut') || name.includes('tmv')) return <GroundnutCanopy />;
  return <TomatoCanopy />;
};

export const VirtualFarmView: React.FC = () => {
  const { 
    activeFarmland, 
    activeSections, 
    crops, 
    triggerActuator, 
    assignCropToSection, 
    exportFarmlandCsv,
    telemetryObservations
  } = useAgriStore();

  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const unit = activeFarmland?.unit || 'acres';
  const totalFarmLand = activeFarmland?.totalArea ?? 20;

  // Allocated Cultivation: sum of non-fallow plots
  const allocatedCultivation = useMemo(() => {
    return Number(activeSections.reduce((sum, p) => sum + (p.cropId ? p.area : 0), 0).toFixed(1));
  }, [activeSections]);

  const remainingUnallocated = useMemo(() => {
    return Math.max(0, +(totalFarmLand - allocatedCultivation).toFixed(1));
  }, [totalFarmLand, allocatedCultivation]);

  const cultivationPct = useMemo(() => {
    if (totalFarmLand <= 0) return 0;
    return Math.min(100, Math.round((allocatedCultivation / totalFarmLand) * 100));
  }, [totalFarmLand, allocatedCultivation]);

  // Farm Health Score
  const farmHealthScore = useMemo(() => {
    if (activeSections.length === 0) return 100;
    let total = 0;
    activeSections.forEach(s => {
      const c = crops.find(crop => crop.id === s.cropId);
      let score = 96;
      if (c) {
        if (s.soilMoisture < c.idealMoistureMin) score -= 16;
        if (s.airTemp > c.idealTempMax) score -= 14;
      }
      total += Math.max(20, Math.min(100, score));
    });
    return Math.round(total / activeSections.length);
  }, [activeSections, crops]);

  const selectedPlotObj = activeSections.find(p => p.id === selectedPlotId);
  const selectedCropObj = selectedPlotObj?.cropId ? crops.find(c => c.id === selectedPlotObj.cropId) : null;

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-10">
      {/* Prototype Banner */}
      <PrototypeModeBanner />

      {/* Top Header & CSV Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-800 text-white rounded-2xl shadow-sm">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-slate-900">{activeFarmland?.name || 'iiit dharwad'}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {activeSections.length} Sections Partitions
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>{activeFarmland?.location || 'Dharwad, Karnataka'} &bull; Digital Twin Matrix</span>
            </p>
          </div>
        </div>

        <button
          onClick={exportFarmlandCsv}
          className="flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Export Manifest CSV</span>
        </button>
      </div>

      {/* TOP METRIC RIBBON */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Farm Land</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalFarmLand} <span className="text-xs font-bold text-slate-500">{unit}</span></div>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Allocated Cultivation</span>
            <div className="text-2xl font-black text-emerald-950 mt-0.5">{allocatedCultivation} <span className="text-xs font-bold text-emerald-700">{unit}</span></div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Sprout className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">Remaining Unallocated</span>
            <div className="text-2xl font-black text-sky-950 mt-0.5">{remainingUnallocated} <span className="text-xs font-bold text-sky-700">{unit}</span></div>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-400 uppercase text-[10px]">Cultivation Index</span>
            <span className="text-emerald-700 font-extrabold">{cultivationPct}%</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
            <div className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-500" style={{ width: `${cultivationPct}%` }} />
          </div>
        </div>
      </div>

      {/* Action Notification Banner */}
      {notice && (
        <div className="p-4 bg-emerald-950 text-emerald-200 rounded-2xl border border-emerald-800 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* MAIN TOP-DOWN SOIL MATRIX CANVAS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Top-Down Photorealistic Soil Canvas</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {activeSections.length} Allocated Sections
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Click any section to inspect real-time biophysical telemetry and trigger actuators.</p>
          </div>

          {/* Center Summary Indicator */}
          <div className="flex items-center space-x-3 self-start sm:self-auto">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{farmHealthScore}% Overall Health</span>
            </div>
            <DataSourceBadge source="MANUAL_PROTOTYPE" />
          </div>
        </div>

        {/* Section Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeSections.map((sec) => {
            const crop = sec.cropId ? crops.find(c => c.id === sec.cropId) : null;
            const isSelected = selectedPlotId === sec.id;
            const isWatering = sec.isWatering;
            const latestObs = telemetryObservations.find(o => o.plotId === sec.id || o.plotId === sec.code);

            return (
              <div
                key={sec.id}
                onClick={() => setSelectedPlotId(sec.id)}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between h-72 group shadow-sm ${
                  isSelected ? 'border-emerald-600 ring-4 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* SVG Canopy Overlay or Fallow Container */}
                <div className="absolute inset-0 z-0">
                  {crop ? (
                    renderCanopyByCrop(crop.name)
                  ) : (
                    <div className="w-full h-full bg-amber-950/20 border-2 border-dashed border-amber-800/40 flex items-center justify-center p-6 text-center">
                      <div className="space-y-1">
                        <Layers className="w-8 h-8 text-amber-700 mx-auto opacity-70" />
                        <span className="text-xs font-bold text-amber-900 block">Fallow / Unplanted Land</span>
                        <span className="text-[10px] text-amber-700 block">{sec.area} {unit} Pool</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Top Section Header Overlay */}
                <div className="relative z-10 p-4 flex items-start justify-between bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent">
                  <div>
                    <span className="font-mono text-xs font-bold text-white bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700">
                      {sec.code}
                    </span>
                    <h4 className="text-sm font-extrabold text-white mt-1 drop-shadow-md">
                      {sec.name}
                    </h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/95 text-slate-900 shadow-md">
                    {sec.area} {unit}
                  </span>
                </div>

                {/* Bottom Section Health & Actuator Overlay */}
                <div className="relative z-10 p-4 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent space-y-2 text-white">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-300">
                      {crop ? `${crop.name} (${crop.variety})` : '🌱 Fallow Bed'}
                    </span>
                    <DataSourceBadge source={latestObs?.dataSource || 'MANUAL_PROTOTYPE'} />
                  </div>

                  {crop ? (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                      <span className="flex items-center space-x-1 text-slate-300">
                        <Droplet className="w-3.5 h-3.5 text-sky-400" />
                        <span>{sec.soilMoisture}%</span>
                      </span>
                      <span className="flex items-center space-x-1 text-slate-300">
                        <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                        <span>{sec.airTemp}°C</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                        Optimal
                      </span>
                    </div>
                  ) : (
                    <div className="pt-1 border-t border-slate-800">
                      <select
                        onClick={e => e.stopPropagation()}
                        onChange={e => {
                          e.stopPropagation();
                          assignCropToSection(sec.id, e.target.value || null);
                        }}
                        className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg outline-none cursor-pointer"
                      >
                        <option value="">+ Quick Allot Crop...</option>
                        {crops.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.variety})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TELEMETRY DRAWER FOR SELECTED SECTION */}
      {selectedPlotObj && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Section Telemetry Drawer</span>
              <h3 className="text-xl font-extrabold text-white">{selectedPlotObj.name}</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  triggerActuator(selectedPlotObj.id, 'irrigation');
                  setNotice(`15-min irrigation pulse triggered on ${selectedPlotObj.code}. Moisture boosted.`);
                  setTimeout(() => setNotice(null), 3000);
                }}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Droplet className="w-3.5 h-3.5" />
                <span>Trigger 15-Min Irrigation Pulse</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerActuator(selectedPlotObj.id, 'hvac');
                  setNotice(`Canopy Ventilation Fan toggled on ${selectedPlotObj.code}.`);
                  setTimeout(() => setNotice(null), 3000);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Toggle Fan</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Crop</span>
              <p className="text-sm font-extrabold text-emerald-400 mt-1">
                {selectedCropObj ? `${selectedCropObj.name} (${selectedCropObj.variety})` : '🌱 Fallow Land'}
              </p>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Soil Moisture</span>
              <p className="text-sm font-extrabold text-white mt-1">{selectedPlotObj.soilMoisture}%</p>
              {selectedCropObj && (
                <span className="text-[10px] text-slate-400">Target: {selectedCropObj.idealMoistureMin}%–{selectedCropObj.idealMoistureMax}%</span>
              )}
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Air Temperature</span>
              <p className="text-sm font-extrabold text-white mt-1">{selectedPlotObj.airTemp}°C</p>
              {selectedCropObj && (
                <span className="text-[10px] text-slate-400">Target: {selectedCropObj.idealTempMin}°C–{selectedCropObj.idealTempMax}°C</span>
              )}
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Sensor Edge Node</span>
              <p className="text-sm font-extrabold text-indigo-400 mt-1">{selectedPlotObj.sensorNodeId}</p>
              <span className="text-[10px] text-emerald-400">Online &bull; Prototype Observation Data</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualFarmView;
