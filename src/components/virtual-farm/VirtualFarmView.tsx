import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ShieldCheck 
} from 'lucide-react';
import { 
  getFarmProfile, 
  getCrops, 
  getPlots, 
  setPlotCrop, 
  addPlot, 
  updatePlot, 
  deletePlot, 
  triggerPlotIrrigation, 
  convertSqmToUnit, 
  convertAreaToSqm, 
  addSensor 
} from '../../lib/farm-storage';
import { FarmProfile, Crop, PlotBed, AreaUnit } from '../../types';
import PlotModal, { formatCropOption } from './PlotModal';

// ================= EMBEDDED PHOTOREALISTIC TOP-DOWN CANOPY SVG LAYERS =================

// --- 1. TOMATO (Dense leaves with glossy red tomatoes & star calyx caps) ---
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
      <path d="M80,160 Q160,150 190,220 Q110,260 80,160 Z" />
      <path d="M210,150 Q290,140 330,220 Q240,260 210,150 Z" />
    </g>
    {[
      { x: 60, y: 55, r: 18 }, { x: 135, y: 70, r: 22 }, { x: 270, y: 50, r: 19 },
      { x: 355, y: 75, r: 21 }, { x: 95, y: 155, r: 23 }, { x: 185, y: 130, r: 25 },
      { x: 285, y: 160, r: 22 }, { x: 370, y: 175, r: 18 }, { x: 225, y: 210, r: 20 }
    ].map((t, i) => (
      <g key={i} transform={`translate(${t.x}, ${t.y})`}>
        <circle cx="2" cy="4" r={t.r} fill="#050e05" opacity="0.6" />
        <circle cx="0" cy="0" r={t.r} fill="url(#tomFruitGrad)" />
        <ellipse cx={-t.r * 0.3} cy={-t.r * 0.35} rx={t.r * 0.25} ry={t.r * 0.15} fill="#fff" opacity="0.4" transform={`rotate(-25, ${-t.r * 0.3}, ${-t.r * 0.35})`} />
        <path d="M0,0 L-4,-7 L-1,-2 L-8,-2 L-2,1 L-6,6 L0,2 L4,7 L2,1 L7,3 L2,-2 L6,-5 Z" fill="#2d6a4f" />
      </g>
    ))}
  </svg>
);

// --- 2. CHILLY (Pointed foliage with hanging green & red chillies) ---
const ChillyCanopy = () => (
  <svg className="w-full h-full object-cover" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
    <defs>
      <radialGradient id="chillyLeafGrad" cx="50%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#52b788" /><stop offset="60%" stopColor="#1b4332" /><stop offset="100%" stopColor="#081c15" />
      </radialGradient>
      <linearGradient id="chillyGreen" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9ef01a" /><stop offset="50%" stopColor="#38b000" /><stop offset="100%" stopColor="#004b23" />
      </linearGradient>
      <linearGradient id="chillyRed" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff4d6d" /><stop offset="50%" stopColor="#c9184a" /><stop offset="100%" stopColor="#590d22" />
      </linearGradient>
    </defs>
    <rect width="400" height="240" fill="#081c15" />
    <g fill="url(#chillyLeafGrad)" stroke="#081c15" strokeWidth="0.8">
      {Array.from({ length: 24 }).map((_, i) => (
        <g key={i} transform={`translate(${(i % 6) * 70 + 20}, ${Math.floor(i / 6) * 60 + 20}) rotate(${(i * 37) % 60 - 30})`}>
          <path d="M0,-35 C20,-15 25,15 0,35 C-25,15 -20,-15 0,-35 Z" />
        </g>
      ))}
    </g>
    {[
      { x: 50, y: 60, rot: 15, type: 'green' }, { x: 120, y: 40, rot: -10, type: 'green' },
      { x: 180, y: 70, rot: 25, type: 'red' }, { x: 250, y: 45, rot: -15, type: 'green' },
      { x: 320, y: 65, rot: 10, type: 'green' }, { x: 80, y: 150, rot: -15, type: 'green' },
      { x: 150, y: 140, rot: 12, type: 'green' }, { x: 220, y: 160, rot: -8, type: 'green' },
      { x: 290, y: 140, rot: 20, type: 'red' }, { x: 360, y: 155, rot: -12, type: 'green' }
    ].map((c, i) => (
      <g key={i} transform={`translate(${c.x}, ${c.y}) rotate(${c.rot})`}>
        <path d="M2,2 Q10,25 2,48 Q-4,25 0,2 Z" fill="#040c04" opacity="0.5" />
        <path d="M0,0 Q10,25 2,48 Q-5,25 -2,0 Z" fill={c.type === 'red' ? 'url(#chillyRed)' : 'url(#chillyGreen)'} />
        <path d="M0,0 Q-2,-8 2,-12" stroke="#2d6a4f" strokeWidth="2" fill="none" />
      </g>
    ))}
  </svg>
);

// --- 3. BRINJAL (Broad textured leaves with deep glossy purple eggplants) ---
const BrinjalCanopy = () => (
  <svg className="w-full h-full object-cover" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
    <defs>
      <radialGradient id="brinjalLeaf" cx="50%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#2d6a4f" /><stop offset="70%" stopColor="#1b4332" /><stop offset="100%" stopColor="#081c15" />
      </radialGradient>
      <radialGradient id="eggplantFruit" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#c77dff" /><stop offset="35%" stopColor="#7b2cbf" /><stop offset="85%" stopColor="#3c096c" /><stop offset="100%" stopColor="#10002b" />
      </radialGradient>
    </defs>
    <rect width="400" height="240" fill="#0d1f12" />
    <g fill="url(#brinjalLeaf)" stroke="#081c15" strokeWidth="1.2">
      <path d="M-20,40 Q60,-20 140,50 Q60,130 -20,40 Z" />
      <path d="M100,10 Q200,-30 280,60 Q180,140 100,10 Z" />
      <path d="M240,20 Q340,-10 420,70 Q320,150 240,20 Z" />
      <path d="M-10,130 Q80,70 170,160 Q80,240 -10,130 Z" />
      <path d="M130,110 Q230,60 310,170 Q210,250 130,110 Z" />
      <path d="M270,120 Q360,70 430,180 Q330,260 270,120 Z" />
    </g>
    {[
      { x: 75, y: 65, rot: -20, rx: 18, ry: 28 },
      { x: 210, y: 55, rot: 15, rx: 20, ry: 30 },
      { x: 345, y: 75, rot: -15, rx: 19, ry: 29 },
      { x: 135, y: 155, rot: 25, rx: 21, ry: 32 },
      { x: 280, y: 165, rot: -18, rx: 20, ry: 30 }
    ].map((b, i) => (
      <g key={i} transform={`translate(${b.x}, ${b.y}) rotate(${b.rot})`}>
        <ellipse cx="3" cy="5" rx={b.rx} ry={b.ry} fill="#040c04" opacity="0.6" />
        <ellipse cx="0" cy="0" rx={b.rx} ry={b.ry} fill="url(#eggplantFruit)" />
        <ellipse cx="-5" cy="-8" rx="4" ry="12" fill="#fff" opacity="0.35" transform="rotate(-15, -5, -8)" />
        <path d="M-12,-20 Q0,-12 12,-20 Q8,-30 0,-32 Q-8,-30 -12,-20 Z" fill="#40916c" />
        <path d="M0,-32 Q-2,-40 3,-43" stroke="#2d6a4f" strokeWidth="2.5" fill="none" />
      </g>
    ))}
  </svg>
);

// --- 4. SUNFLOWER (Golden flower heads with dark seed disks) ---
const SunflowerCanopy = () => (
  <svg className="w-full h-full object-cover" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
    <defs>
      <radialGradient id="sunLeaf" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#52b788" /><stop offset="80%" stopColor="#1b4332" /><stop offset="100%" stopColor="#081c15" />
      </radialGradient>
      <radialGradient id="sunPetals" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffea00" /><stop offset="85%" stopColor="#ffaa00" /><stop offset="100%" stopColor="#d48b00" />
      </radialGradient>
      <radialGradient id="sunCenter" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#582f0e" /><stop offset="80%" stopColor="#331800" /><stop offset="100%" stopColor="#1b0c02" />
      </radialGradient>
    </defs>
    <rect width="400" height="240" fill="#0f2818" />
    <g fill="url(#sunLeaf)" stroke="#081c15" strokeWidth="1">
      {Array.from({ length: 18 }).map((_, i) => (
        <circle key={i} cx={(i % 6) * 75 + 15} cy={Math.floor(i / 6) * 80 + 35} r="48" opacity="0.9" />
      ))}
    </g>
    {[
      { x: 65, y: 55, r: 24 }, { x: 195, y: 45, r: 26 }, { x: 335, y: 65, r: 25 },
      { x: 110, y: 155, r: 25 }, { x: 265, y: 165, r: 27 }
    ].map((s, i) => (
      <g key={i} transform={`translate(${s.x}, ${s.y})`}>
        <circle cx="0" cy="0" r={s.r} fill="url(#sunPetals)" />
        {Array.from({ length: 12 }).map((_, p) => (
          <path key={p} d={`M0,0 L${s.r * 1.35},0 L${s.r},5 Z`} fill="#ffb703" transform={`rotate(${p * 30})`} />
        ))}
        <circle cx="0" cy="0" r={s.r * 0.55} fill="url(#sunCenter)" stroke="#7f4f24" strokeWidth="1" />
      </g>
    ))}
  </svg>
);

// Canopy Dispatcher Function
const renderCanopy = (cropName?: string) => {
  const name = cropName?.toLowerCase() || '';
  if (name.includes('tomato') || name.includes('sarpan') || name.includes('sth')) return <TomatoCanopy />;
  if (name.includes('chill') || name.includes('pepper') || name.includes('capsicum')) return <ChillyCanopy />;
  if (name.includes('brinjal') || name.includes('eggplant') || name.includes('melongena')) return <BrinjalCanopy />;
  if (name.includes('sunflower') || name.includes('helianthus')) return <SunflowerCanopy />;
  return <TomatoCanopy />;
};

export const VirtualFarmView: React.FC = () => {
  const [farmProfile, setFarmProfile] = useState<FarmProfile | null>(null);
  const [plots, setPlots] = useState<PlotBed[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [wateringPlots, setWateringPlots] = useState<Record<string, boolean>>({});
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'new' | 'edit'>('new');
  const [selectedPlotForEdit, setSelectedPlotForEdit] = useState<PlotBed | null>(null);

  // Hover Popover State
  const [hoveredPlotId, setHoveredPlotId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reloadData = () => {
    const profile = getFarmProfile() || {
      name: 'AgriTwin Smart Farm',
      location: 'Precision Agriculture Campus',
      totalArea: 40,
      unit: 'acres' as AreaUnit,
      totalAreaSqm: 161874.4,
      onboardingCompleted: true
    };
    setFarmProfile(profile);
    setPlots(getPlots());
    setCrops(getCrops());
  };

  useEffect(() => {
    reloadData();

    const handleStorageUpdate = () => {
      reloadData();
    };

    window.addEventListener('agri_storage_updated', handleStorageUpdate);
    return () => window.removeEventListener('agri_storage_updated', handleStorageUpdate);
  }, []);

  const unit: AreaUnit = farmProfile?.unit || 'acres';

  // ================= 1. ACCURATE FARM LAND & SQ FT MATH =================
  // Total Farm Land (default to 40 if unset)
  const totalFarmLand = farmProfile?.totalArea ?? 40;

  // Allocated Cultivation: sum of all plot.area
  const allocatedCultivation = useMemo(() => {
    return Number(plots.reduce((sum, p) => sum + (p.area || convertSqmToUnit(p.areaSqm || 0, unit)), 0).toFixed(1));
  }, [plots, unit]);

  // Remaining Unallocated Land (enforce minimum 0)
  const remainingUnallocated = useMemo(() => {
    return Math.max(0, +(totalFarmLand - allocatedCultivation).toFixed(1));
  }, [totalFarmLand, allocatedCultivation]);

  // Cultivation Index %
  const cultivationPct = useMemo(() => {
    if (totalFarmLand <= 0) return 0;
    return Math.min(100, Math.round((allocatedCultivation / totalFarmLand) * 100));
  }, [totalFarmLand, allocatedCultivation]);

  // Sq Ft Calculations (1 Acre = 43,560 sq ft)
  const totalSqFt = (totalFarmLand * 43560).toLocaleString();
  const allocatedSqFt = (allocatedCultivation * 43560).toLocaleString();
  const remainingSqFt = (remainingUnallocated * 43560).toLocaleString();

  // Overall Farm Health Score Calculation
  const overallHealthScore = useMemo(() => {
    if (plots.length === 0) return 100;
    let totalScore = 0;
    plots.forEach(plot => {
      const c = crops.find(crop => crop.id === plot.cropId);
      let score = 96;
      if (c) {
        if (plot.soilMoisture < c.idealMoistureMin) score -= 18;
        else if (plot.soilMoisture > c.idealMoistureMax) score -= 8;
        if (plot.airTemp > c.idealTempMax) score -= 15;
        else if (plot.airTemp < c.idealTempMin) score -= 10;
      }
      totalScore += Math.max(20, Math.min(100, score));
    });
    return Math.round(totalScore / plots.length);
  }, [plots, crops]);

  // Priority Status Message
  const priorityStatus = useMemo(() => {
    const stressPlot = plots.find(p => {
      const c = crops.find(crop => crop.id === p.cropId);
      return c && (p.soilMoisture < c.idealMoistureMin || p.airTemp > c.idealTempMax);
    });

    if (stressPlot) {
      const c = crops.find(crop => crop.id === stressPlot.cropId);
      if (stressPlot.soilMoisture < (c?.idealMoistureMin || 45)) {
        return { text: `TOP PRIORITY: Bed ${stressPlot.code} moisture low - irrigation required`, isAlert: true };
      }
      return { text: `TOP PRIORITY: Bed ${stressPlot.code} thermal stress detected`, isAlert: true };
    }
    return { text: 'TOP PRIORITY: All systems normal.', isAlert: false };
  }, [plots, crops]);

  // 15-min precision irrigation pulse
  const handleIrrigate = async (plotId: string, plotCode: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWateringPlots(prev => ({ ...prev, [plotId]: true }));
    setActionNotice(`Actuating 15-min precision pulse on Bed ${plotCode}...`);

    await triggerPlotIrrigation(plotId);

    setTimeout(() => {
      setWateringPlots(prev => ({ ...prev, [plotId]: false }));
      setActionNotice(`Bed ${plotCode} soil moisture replenished (+8.5%). Telemetry logged.`);
      setTimeout(() => setActionNotice(null), 3500);
    }, 1200);
  };

  // Inline crop reassignment in hover popover
  const handleCropChange = (plotId: string, newCropId: string, e?: React.ChangeEvent) => {
    if (e) e.stopPropagation();
    const targetCropId = newCropId === 'fallow' || newCropId === '' ? null : newCropId;
    setPlotCrop(plotId, targetCropId);
    setActionNotice(`Plot crop assignment updated.`);
    setTimeout(() => setActionNotice(null), 2500);
  };

  // Open Modals
  const openNewPlotModal = () => {
    setSelectedPlotForEdit(null);
    setModalMode('new');
    setIsModalOpen(true);
  };

  const openEditPlotModal = (plot: PlotBed) => {
    setSelectedPlotForEdit(plot);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  // Save Modal Action
  const handleSavePlot = (data: {
    id?: string;
    code: string;
    name: string;
    area: number;
    cropId: string | null;
    sensorNodeId: string;
  }) => {
    const areaSqm = convertAreaToSqm(data.area, unit);
    const assignedCrop = crops.find(c => c.id === data.cropId);

    if (modalMode === 'edit' && data.id) {
      const existing = plots.find(p => p.id === data.id);
      if (existing) {
        updatePlot({
          ...existing,
          code: data.code,
          name: data.name,
          area: data.area,
          areaUnit: unit,
          areaSqm,
          cropId: data.cropId,
          sensorNodeId: data.sensorNodeId,
          sensorId: data.sensorNodeId
        });
        setActionNotice(`Plot Bed ${data.code} updated successfully!`);
      }
    } else {
      const created = addPlot({
        code: data.code,
        name: data.name,
        area: data.area,
        areaUnit: unit,
        areaSqm,
        cropId: data.cropId,
        sensorNodeId: data.sensorNodeId,
        sensorId: data.sensorNodeId,
        soilMoisture: assignedCrop ? assignedCrop.idealMoistureMin + 4 : 55,
        airTemp: 24.0,
        soilPh: assignedCrop ? (assignedCrop.idealPhMin + assignedCrop.idealPhMax) / 2 : 6.5,
        daysPlanted: 1
      });

      if (data.sensorNodeId) {
        addSensor({
          nodeName: `${data.sensorNodeId} Multi-Sensor Node`,
          assignedPlotCode: data.code,
          type: 'Multi-Soil & Canopy Node',
          sensorTypes: ['Soil Moisture', 'Canopy Temp', 'Soil pH', 'PAR Solar Radiometer'],
          batteryPct: 98,
          status: 'Online',
          lastPing: new Date().toISOString()
        });
      }
      setActionNotice(`Plot Bed ${created.code} successfully provisioned!`);
    }

    setIsModalOpen(false);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Delete Plot Action
  const handleDeletePlot = (plotId: string) => {
    const p = plots.find(plot => plot.id === plotId);
    deletePlot(plotId);
    setIsModalOpen(false);
    setActionNotice(`Plot Bed ${p?.code || ''} decommissioned. Acreage returned to unallocated pool.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Export current plot telemetry CSV
  const handleExportTelemetry = () => {
    const headers = ['Plot Code', 'Plot Name', 'Area (acres)', 'Area (sq ft)', 'Assigned Crop', 'Variety', 'Soil Moisture (%)', 'Air Temp (°C)', 'Soil pH', 'Watering State'];
    const rows = plots.map(p => {
      const crop = crops.find(c => c.id === p.cropId);
      const plotAreaAcres = p.area || convertSqmToUnit(p.areaSqm || 0, unit);
      return [
        p.code,
        `"${p.name}"`,
        plotAreaAcres,
        (plotAreaAcres * 43560).toFixed(0),
        crop ? `"${crop.name}"` : 'Fallow',
        crop ? `"${crop.variety}"` : 'N/A',
        p.soilMoisture,
        p.airTemp,
        p.soilPh,
        p.isWatering ? 'ON' : 'OFF'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agritwin_plot_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ================= 3x3 MATRIX SLOTS (WITH OVERVIEW CARD AT SLOT INDEX 4) =================
  // Total slots: at least 9 slots (3 rows x 3 columns)
  // Slot index 4 (middle) is reserved for the Amber Glassmorphic Overview Card
  const totalSlotsCount = Math.max(9, Math.ceil((plots.length + 2) / 3) * 3);
  
  // Construct the items array for the grid
  const gridSlots = useMemo(() => {
    const slots: Array<{ type: 'overview' } | { type: 'plot'; plot: PlotBed } | { type: 'empty'; index: number }> = [];
    let plotCursor = 0;

    for (let i = 0; i < totalSlotsCount; i++) {
      if (i === 4) {
        slots.push({ type: 'overview' });
      } else if (plotCursor < plots.length) {
        slots.push({ type: 'plot', plot: plots[plotCursor] });
        plotCursor++;
      } else {
        slots.push({ type: 'empty', index: i });
      }
    }
    return slots;
  }, [plots, totalSlotsCount]);

  return (
    <div className="space-y-6 text-slate-800 font-sans pb-12">
      
      {/* ================= TOP KPI & FARM GEOGRAPHIC BANNER ================= */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        
        {/* Left: Farm Identification */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-800 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-600/20 shrink-0">
            <Sprout className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {farmProfile?.name || 'Green Horizon Smart Farm'}
              </h1>
              <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {plots.length} Active Beds
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium mt-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>{farmProfile?.location || 'Precision Agriculture Campus'}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openNewPlotModal}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Allot New Bed</span>
          </button>

          <button
            onClick={handleExportTelemetry}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Plot CSV</span>
          </button>
        </div>
      </div>

      {/* ================= 1. ACCURATE LAND ALLOCATION KPI RIBBON ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Farm Land */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Farm Land</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{totalFarmLand}</span>
            <span className="text-xs font-bold text-slate-500 uppercase">ACRES</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            {totalSqFt} sq ft
          </p>
        </div>

        {/* Allocated Cultivation */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Allocated Cultivation</span>
            <Sprout className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-800">{allocatedCultivation}</span>
            <span className="text-xs font-bold text-slate-500 uppercase">ACRES</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            {allocatedSqFt} sq ft
          </p>
        </div>

        {/* Remaining Unallocated Land */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Remaining Unallocated</span>
            <Sparkles className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{remainingUnallocated}</span>
            <span className="text-xs font-bold text-slate-500 uppercase">ACRES</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            {remainingSqFt} sq ft
          </p>
        </div>

        {/* Cultivation Index */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cultivation Index</span>
            <Percent className="w-4 h-4 text-emerald-800" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-800">{cultivationPct}%</span>
            <span className="text-xs font-semibold text-slate-500">utilized</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
            <div 
              className="bg-emerald-800 h-full rounded-full transition-all duration-500" 
              style={{ width: `${cultivationPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900 flex items-center space-x-2 animate-in fade-in">
          <Activity className="w-4 h-4 text-emerald-700 animate-spin" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* ================= SECTION HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-800" />
            <span>Digital Twin Top-Down Soil Matrix</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Photorealistic crop canopies on rich loam soil canvas with interactive hover telemetry inspection
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Edge Node Mesh</span>
        </div>
      </div>

      {/* ================= 2. PHOTOREALISTIC LOAM SOIL MATRIX ================= */}
      <div className="p-6 rounded-3xl bg-[#2e1d13] border-4 border-[#1f130b] shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Loam Texture Overlay */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#5a3d2e 1.5px, transparent 1.5px), radial-gradient(#1f130e 1.5px, #2e1d13 1.5px)`,
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px'
          }}
        />

        {/* 3-Column Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          
          {gridSlots.map((slot, index) => {
            // Slot 4: Amber Glassmorphic "Farm Overview" Card
            if (slot.type === 'overview') {
              return (
                <div 
                  key="farm-overview-card"
                  className="bg-[#452715]/85 border border-[#8d532b]/60 backdrop-blur-md text-amber-50 rounded-2xl p-6 shadow-2xl min-h-[220px] flex flex-col items-center justify-center text-center space-y-2"
                >
                  <h3 className="uppercase font-bold text-amber-200/90 text-xs tracking-wider">
                    FARM OVERVIEW
                  </h3>
                  
                  <div className="text-4xl font-black text-amber-400 my-1">
                    {overallHealthScore}%
                  </div>
                  
                  <div className="text-xs text-amber-200/80 mb-3">
                    Overall Health
                  </div>

                  <div className="bg-[#24140b]/80 border border-amber-600/40 text-emerald-400 text-[11px] px-3.5 py-1.5 rounded-full font-bold flex items-center space-x-1.5 shadow-sm">
                    <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{priorityStatus.text}</span>
                  </div>
                </div>
              );
            }

            // Unplanted Soil Bed Slot
            if (slot.type === 'empty') {
              return (
                <div
                  key={`empty-slot-${slot.index}`}
                  onClick={openNewPlotModal}
                  className="bg-[#3b2518] border-2 border-dashed border-[#5e3d28] rounded-2xl flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover:bg-[#4a2f1f] transition p-6 text-center space-y-3 shadow-inner"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#4d3120] group-hover:bg-emerald-800 flex items-center justify-center text-emerald-200 transition-colors shadow-md">
                    <Plus className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-sm font-black text-amber-100 block">
                      + Allot Section
                    </span>
                    <p className="text-[11px] text-amber-200/60 font-medium max-w-[210px]">
                      Available pool: {remainingUnallocated} acres ({remainingSqFt} sq ft)
                    </p>
                  </div>
                </div>
              );
            }

            // Planted Soil Bed Slot with Embedded Top-Down Canopy
            const plot = slot.plot;
            const assignedCrop = crops.find(c => c.id === plot.cropId);
            const isCurrentlyWatering = wateringPlots[plot.id] || plot.isWatering;
            const plotArea = plot.area || convertSqmToUnit(plot.areaSqm || 0, unit);
            const plotSqFt = (plotArea * 43560).toLocaleString();

            // Compute health status
            let healthStatus = {
              label: 'Optimal',
              badgeBg: 'bg-emerald-500/90 text-white border-emerald-400',
              popoverBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
              icon: CheckCircle2
            };

            if (!assignedCrop) {
              healthStatus = {
                label: 'Fallow',
                badgeBg: 'bg-slate-700/90 text-slate-200 border-slate-600',
                popoverBadge: 'bg-slate-100 text-slate-600 border-slate-200',
                icon: Layers
              };
            } else if (plot.airTemp > (assignedCrop.idealTempMax || 32)) {
              healthStatus = {
                label: 'Heat Stress',
                badgeBg: 'bg-rose-600/90 text-white border-rose-400',
                popoverBadge: 'bg-rose-50 text-rose-700 border-rose-200',
                icon: AlertCircle
              };
            } else if (plot.soilMoisture < (assignedCrop.idealMoistureMin || 45)) {
              healthStatus = {
                label: 'Low Water',
                badgeBg: 'bg-amber-500/90 text-white border-amber-400',
                popoverBadge: 'bg-amber-50 text-amber-800 border-amber-200',
                icon: AlertCircle
              };
            }

            const StatusIcon = healthStatus.icon;
            const isHovered = hoveredPlotId === plot.id;

            return (
              <div
                key={plot.id}
                onMouseEnter={() => {
                  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                  setHoveredPlotId(plot.id);
                }}
                onMouseLeave={() => {
                  hoverTimeoutRef.current = setTimeout(() => setHoveredPlotId(null), 200);
                }}
                onClick={() => openEditPlotModal(plot)}
                className="group relative rounded-2xl min-h-[220px] overflow-visible border-2 border-[#4a3525] hover:border-emerald-500/80 shadow-lg hover:shadow-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between p-3.5 bg-[#122815]"
                style={{
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.4)'
                }}
              >
                {/* Embedded Photorealistic Top-Down SVG Canopy Layer */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  {renderCanopy(assignedCrop ? assignedCrop.name : 'tomato')}
                </div>

                {/* Top Corner Floating Badge */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white border border-white/20 text-xs font-bold flex items-center space-x-2 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="capitalize">{assignedCrop ? assignedCrop.name : 'Fallow'}</span>
                    <span className="text-white/40">|</span>
                    <span className="font-mono text-emerald-300">{plot.code}</span>
                  </div>

                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shadow-xs flex items-center space-x-1 ${healthStatus.badgeBg}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span>{healthStatus.label}</span>
                  </div>
                </div>

                {/* Center Watering Animation Indicator */}
                {isCurrentlyWatering && (
                  <div className="relative z-10 flex items-center justify-center my-auto">
                    <span className="px-3 py-1 bg-sky-600/90 text-white text-[11px] font-black rounded-full shadow-lg animate-bounce uppercase tracking-wider flex items-center space-x-1.5">
                      <Droplet className="w-3.5 h-3.5" />
                      <span>Watering Active...</span>
                    </span>
                  </div>
                )}

                {/* Bottom Bed Bar */}
                <div className="relative z-10 bg-black/70 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 flex items-center justify-between text-xs text-slate-200 mt-auto">
                  <div className="font-bold text-white truncate max-w-[140px]">{plot.name}</div>
                  <div className="font-semibold text-emerald-300">{plotArea} ACRES</div>
                </div>

                {/* ================= 5. HOVER TELEMETRY POPOVER CARD ================= */}
                {isHovered && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-1/2 -translate-x-1/2 bottom-[104%] w-[330px] sm:w-[370px] bg-white rounded-3xl p-5 shadow-2xl border-2 border-emerald-600/40 text-slate-900 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-4"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <Sprout className="w-3.5 h-3.5" />
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[11px] font-black">
                            {plot.code}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 leading-tight">{plot.name}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {plotArea} acres ({plotSqFt} sq ft) &bull; Node: <span className="font-mono font-bold text-slate-700">{plot.sensorNodeId || plot.sensorId || 'NODE-01'}</span>
                        </p>
                      </div>

                      <div className={`px-2 py-1 rounded-full text-[10px] font-black border flex items-center space-x-1 ${healthStatus.popoverBadge}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{healthStatus.label}</span>
                      </div>
                    </div>

                    {/* Assigned Cultivar Section */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                        ASSIGNED CULTIVAR & VARIETY
                      </label>
                      <select
                        value={plot.cropId || 'fallow'}
                        onChange={(e) => handleCropChange(plot.id, e.target.value, e)}
                        className="w-full px-2.5 py-1.5 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                      >
                        <option value="fallow">-- Fallow (Unplanted) --</option>
                        {crops.map(c => (
                          <option key={c.id} value={c.id}>
                            {formatCropOption(c)}
                          </option>
                        ))}
                      </select>
                      {assignedCrop ? (
                        <p className="text-[10px] text-emerald-800 font-medium">
                          Ideal Range: Moisture {assignedCrop.idealMoistureMin}%-{assignedCrop.idealMoistureMax}% &bull; Temp {assignedCrop.idealTempMin}°C-{assignedCrop.idealTempMax}°C
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-medium italic">
                          Select a cultivar to begin phenological tracking
                        </p>
                      )}
                    </div>

                    {/* 4-Column Live Metrics */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 bg-sky-50 rounded-xl border border-sky-100">
                        <div className="text-[9px] font-black uppercase text-sky-700">💧 MOISTURE</div>
                        <div className="text-xs font-black text-slate-900 mt-0.5">{plot.soilMoisture}%</div>
                        <div className="text-[8px] text-slate-400 font-medium">Root Zone</div>
                      </div>

                      <div className="p-2 bg-rose-50 rounded-xl border border-rose-100">
                        <div className="text-[9px] font-black uppercase text-rose-700">🌡 AIR TEMP</div>
                        <div className="text-xs font-black text-slate-900 mt-0.5">{plot.airTemp}°C</div>
                        <div className="text-[8px] text-slate-400 font-medium">Ambient</div>
                      </div>

                      <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                        <div className="text-[9px] font-black uppercase text-emerald-700">🌱 SOIL PH</div>
                        <div className="text-xs font-black text-slate-900 mt-0.5">{plot.soilPh}</div>
                        <div className="text-[8px] text-slate-400 font-medium">Substrate</div>
                      </div>

                      <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                        <div className="text-[9px] font-black uppercase text-amber-700">📅 PLANTED</div>
                        <div className="text-xs font-black text-slate-900 mt-0.5">Day {plot.daysPlanted || 1}</div>
                        <div className="text-[8px] text-slate-400 font-medium">Cycle</div>
                      </div>
                    </div>

                    {/* Footer Button */}
                    <div className="flex items-center space-x-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => handleIrrigate(plot.id, plot.code, e)}
                        disabled={isCurrentlyWatering}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer ${
                          isCurrentlyWatering
                            ? 'bg-sky-100 text-sky-700 border border-sky-200'
                            : 'bg-sky-600 hover:bg-sky-700 text-white active:scale-95'
                        }`}
                      >
                        <Droplet className="w-3.5 h-3.5" />
                        <span>{isCurrentlyWatering ? 'Watering (3s)...' : '💧 Trigger 15-Min Irrigation'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditPlotModal(plot)}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                        title="Customize Plot"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>

      {/* ================= PLOT ALLOTMENT & CUSTOMIZATION MODAL ================= */}
      <PlotModal
        isOpen={isModalOpen}
        mode={modalMode}
        initialPlot={selectedPlotForEdit}
        crops={crops}
        unit={unit}
        remainingAreaInUnit={remainingUnallocated}
        existingPlots={plots}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePlot}
        onDelete={handleDeletePlot}
      />

    </div>
  );
};

export default VirtualFarmView;
