import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sprout, 
  MapPin, 
  Radio, 
  Layers, 
  Activity, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  Droplet, 
  Thermometer, 
  Calendar, 
  Wind, 
  Sun, 
  Gauge, 
  Cpu, 
  Check, 
  RefreshCw, 
  Eye, 
  Maximize2,
  MousePointer,
  RotateCcw,
  Zap
} from 'lucide-react';
import { SEEDED_CROPS, CropData } from '../../lib/crop-management';
import { AreaUnitInput, AreaUnit } from '../common/AreaUnitInput';
import { PlantCanopySvg } from '../common/PlantCanopySvg';
import { ref, set, push } from '../../lib/firebase';
import { db } from '../../lib/firebase';
import { logFieldAction } from '../../lib/audit-log';
import { saveFarmProfile, saveCrops, savePlots, saveSensors, saveHistory, convertAreaToSqm } from '../../lib/farm-storage';

export const GuidedOnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);

  // Farm Profile State
  const [farmName, setFarmName] = useState('Green Horizon Smart Farm');
  const [farmLocation, setFarmLocation] = useState('Central Valley Agri-Hub, CA');

  // STEP 2: Crop State
  const [cropSource, setCropSource] = useState<'preset' | 'custom'>('preset');
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('crop_tomato_sth520');
  const [customCropName, setCustomCropName] = useState('Tomato');
  const [customVariety, setCustomVariety] = useState('Sarpan F1-STH-520');
  const [customDurationDays, setCustomDurationDays] = useState<number>(105);
  const [customWaterNeed, setCustomWaterNeed] = useState<number>(4.5);
  const [customMoistureMin, setCustomMoistureMin] = useState<number>(55);
  const [customMoistureMax, setCustomMoistureMax] = useState<number>(75);
  const [customTempMin, setCustomTempMin] = useState<number>(20);
  const [customTempMax, setCustomTempMax] = useState<number>(28);
  const [customPhMin, setCustomPhMin] = useState<number>(6.0);
  const [customPhMax, setCustomPhMax] = useState<number>(6.8);

  // STEP 3: Map Demarcation State
  const [plotCode, setPlotCode] = useState('S-01');
  const [plotName, setPlotName] = useState('North Greenhouse Alpha');
  const [plotAreaValue, setPlotAreaValue] = useState<number>(2.5);
  const [plotAreaUnit, setPlotAreaUnit] = useState<AreaUnit>('Acres');
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([
    [15.4592, 75.0072],
    [15.4595, 75.0084],
    [15.4586, 75.0087],
    [15.4583, 75.0075]
  ]);
  const [isDrawing, setIsDrawing] = useState(false);

  // STEP 4: IoT Hardware Pairing State
  const [nodeId, setNodeId] = useState('NODE-01');
  const [isSimulated, setIsSimulated] = useState(false);
  const [selectedSensorTypes, setSelectedSensorTypes] = useState<string[]>([
    'Soil Moisture',
    'Ambient Temp & Humidity',
    'Substrate pH',
    'PAR Sunlight Lux'
  ]);

  // STEP 5: Provisioning State (Automatic)
  const [provisioningProgress, setProvisioningProgress] = useState(0);
  const [isProvisioned, setIsProvisioned] = useState(false);

  // STEP 6: Live Preview & Closed-Loop Actuator State
  const [previewMoisture, setPreviewMoisture] = useState(58.4);
  const [isIrrigating, setIsIrrigating] = useState(false);
  const [isHvacActive, setIsHvacActive] = useState(false);
  const [actuationFeedback, setActuationFeedback] = useState<string | null>(null);

  // Helper to get active crop details
  const getActiveCropDetails = () => {
    if (cropSource === 'preset' && SEEDED_CROPS[selectedPresetKey]) {
      const p = SEEDED_CROPS[selectedPresetKey];
      return {
        id: selectedPresetKey,
        name: p.name.split('(')[0].trim(),
        variety: p.name,
        botanical_name: p.botanical_name,
        durationDays: p.growth_duration_days,
        waterNeed: p.expected_yield_per_sqm,
        moistureMin: p.ideal_conditions.humidity_min_pct,
        moistureMax: p.ideal_conditions.humidity_max_pct,
        tempMin: p.ideal_conditions.temp_min_c,
        tempMax: p.ideal_conditions.temp_max_c,
        phMin: 6.0,
        phMax: 6.8
      };
    }
    return {
      id: `crop_${Date.now()}`,
      name: customCropName,
      variety: customVariety,
      botanical_name: customVariety,
      durationDays: customDurationDays,
      waterNeed: customWaterNeed,
      moistureMin: customMoistureMin,
      moistureMax: customMoistureMax,
      tempMin: customTempMin,
      tempMax: customTempMax,
      phMin: customPhMin,
      phMax: customPhMax
    };
  };

  // Step 5 Automated Provisioning Effect
  useEffect(() => {
    if (step === 5) {
      setProvisioningProgress(0);
      setIsProvisioned(false);
      
      const interval = setInterval(() => {
        setProvisioningProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsProvisioned(true);
            return 100;
          }
          return prev + 25;
        });
      }, 350);

      return () => clearInterval(interval);
    }
  }, [step]);

  // Step 6 Closed-loop Actuation Handler
  const handleTestIrrigation = async () => {
    setIsIrrigating(true);
    setActuationFeedback('Actuating 15-min precision irrigation pulse...');
    
    // Call Field Audit Logger
    await logFieldAction(
      plotCode,
      'irrigation',
      'manual',
      `Onboarding Step 6: Tested Closed-Loop Irrigation Valve on Plot ${plotCode}. Telemetry verified.`,
      plotCode
    );

    setTimeout(() => {
      setPreviewMoisture((prev) => Math.min(88, +(prev + 8.5).toFixed(1)));
      setIsIrrigating(false);
      setActuationFeedback('Moisture increased (+8.5%). Field Audit Log entry recorded.');
    }, 2000);
  };

  const handleTestHvac = async () => {
    const nextState = !isHvacActive;
    setIsHvacActive(nextState);

    await logFieldAction(
      plotCode,
      'hvac',
      'manual',
      `Onboarding Step 6: Toggled HVAC / Fan actuator ${nextState ? 'ON' : 'OFF'} on Plot ${plotCode}.`,
      plotCode
    );

    setActuationFeedback(`HVAC Fan toggled ${nextState ? 'ON' : 'OFF'}. Field Audit Log recorded.`);
    setTimeout(() => setActuationFeedback(null), 3500);
  };

  // Add custom map point in DRAW MODE
  const handleMapCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert SVG pixel to approximate lat/lng offset
    const lat = 15.4589 + (0.5 - y / rect.height) * 0.003;
    const lng = 75.0078 + (x / rect.width - 0.5) * 0.003;
    setPolygonPoints(prev => [...prev, [lat, lng]]);
  };

  // Finish and persist all data
  const handleCompleteWizard = async () => {
    const crop = getActiveCropDetails();
    const areaUnitStr = plotAreaUnit.toLowerCase().includes('acre') ? 'acres' :
                        plotAreaUnit.toLowerCase().includes('hect') ? 'hectares' :
                        plotAreaUnit.toLowerCase().includes('meter') ? 'sqm' : 'sqft';

    const areaSqm = convertAreaToSqm(plotAreaValue, areaUnitStr as any);
    const now = new Date().toISOString();

    // 1. Firebase Realtime Database
    const plotId = plotCode.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const plotPayload = {
      id: plotId,
      code: plotCode,
      name: plotName,
      crop: crop.name,
      variety: crop.variety,
      cropType: crop.name.toLowerCase(),
      area: plotAreaValue,
      areaUnit: areaUnitStr,
      areaSqm,
      gps: {
        center: [15.4589, 75.0078],
        polygonCoordinates: polygonPoints
      },
      boundaryCoordinates: polygonPoints,
      paired_nodes: isSimulated ? [] : [{
        node_id: nodeId,
        sensor_types: selectedSensorTypes
      }],
      sensorNodeId: isSimulated ? 'SIMULATED-NODE' : nodeId,
      dataSource: isSimulated ? 'simulated' : 'hardware_paired',
      healthScore: 96,
      healthStatus: 'Excellent',
      soilMoisture: previewMoisture,
      optimalMoistureMin: crop.moistureMin,
      optimalMoistureMax: crop.moistureMax,
      airTemp: 24.2,
      soilPh: 6.5,
      nitrogen: 45,
      vpd: 1.05,
      dripIrrigationActive: false,
      hvacActive: false,
      created_at: now
    };

    await set(ref(db, `plots/${plotId}`), plotPayload);
    await set(ref(db, `devices/${plotId}`), {
      irrigation: { enabled: false, mode: 'auto' },
      hvac: { enabled: false, mode: 'auto' },
      growLight: { enabled: false, mode: 'manual' }
    });
    await set(ref(db, `live_readings/${plotId}`), {
      moisture: previewMoisture,
      temp: 24.2,
      humidity: 62,
      soilPh: 6.5,
      sunlightLux: 650,
      vpd: 1.05,
      timestamp: Date.now()
    });

    // 2. Unified Local Storage Synchronizations
    saveFarmProfile({
      name: farmName.trim() || 'Green Horizon Smart Farm',
      location: farmLocation.trim() || 'Central Valley Agri-Hub, CA',
      totalArea: Math.max(plotAreaValue * 2, 10),
      unit: areaUnitStr as any,
      totalAreaSqm: areaSqm * 2,
      boundary: polygonPoints,
      createdAt: now,
      onboardingCompleted: true
    });

    saveCrops([{
      id: crop.id,
      name: crop.name,
      variety: crop.variety,
      growthDurationDays: crop.durationDays,
      waterRequirementLpd: crop.waterNeed,
      idealMoistureMin: crop.moistureMin,
      idealMoistureMax: crop.moistureMax,
      idealTempMin: crop.tempMin,
      idealTempMax: crop.tempMax,
      idealPhMin: crop.phMin,
      idealPhMax: crop.phMax,
      createdAt: now
    }]);

    savePlots([{
      id: plotId,
      code: plotCode,
      name: plotName,
      area: plotAreaValue,
      areaUnit: areaUnitStr,
      areaSqm,
      cropId: crop.id,
      sensorNodeId: isSimulated ? 'SIMULATED-NODE' : nodeId,
      sensorId: isSimulated ? 'SIMULATED-NODE' : nodeId,
      boundaryCoordinates: polygonPoints,
      soilMoisture: previewMoisture,
      airTemp: 24.2,
      soilPh: 6.5,
      parLux: 650,
      isWatering: false,
      daysPlanted: 1,
      createdAt: now
    }]);

    saveSensors([{
      id: `sensor_${nodeId.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`,
      nodeName: `${nodeId} Gateway Multi-Sensor`,
      assignedPlotCode: plotCode,
      type: 'Multi-Soil & Canopy Node',
      sensorTypes: selectedSensorTypes,
      batteryPct: 98,
      status: 'Online',
      lastPing: now
    }]);

    saveHistory([{
      timestamp: now,
      plotCode: plotCode,
      cropName: `${crop.name} (${crop.variety})`,
      soilMoisture: previewMoisture,
      airTemp: 24.2,
      soilPh: 6.5,
      status: 'Optimal'
    }]);

    // Navigate to Dashboard
    navigate('/');
  };

  const cropDetails = getActiveCropDetails();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-sans">
      
      {/* Top Header Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-md ring-2 ring-emerald-600/30">
            <Sprout className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center space-x-2">
              <span>AgriTwin Setup Wizard</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                Day-0 Provisioning
              </span>
            </h1>
            <p className="text-xs text-slate-400">Step {step} of 7 &bull; Guided Precision Setup</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Biophysical Engine v2.4</span>
        </div>
      </header>

      {/* Progress Tracker (Linear 7 Steps) */}
      <div className="bg-slate-950/40 border-b border-slate-800/80 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {[
            { num: 1, label: 'Welcome' },
            { num: 2, label: 'Crop Registration' },
            { num: 3, label: 'Geospatial Plot' },
            { num: 4, label: 'IoT Pairing' },
            { num: 5, label: 'Twin Provisioning' },
            { num: 6, label: 'Telemetry Test' },
            { num: 7, label: 'Launch' },
          ].map((s, idx) => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            return (
              <React.Fragment key={s.num}>
                <div className="flex items-center space-x-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isActive ? 'bg-emerald-600 text-white ring-4 ring-emerald-600/20 shadow-md scale-110' :
                    isCompleted ? 'bg-emerald-800 text-emerald-200' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span className={`text-xs font-semibold hidden md:inline ${
                    isActive ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {idx < 6 && (
                  <div className={`flex-1 mx-2 h-0.5 transition-colors hidden sm:block ${
                    isCompleted ? 'bg-emerald-700' : 'bg-slate-800'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Wizard Step Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-8 flex items-center justify-center">
        
        {/* ================= STEP 1: WELCOME ================= */}
        {step === 1 && (
          <div className="w-full bg-slate-800/90 rounded-3xl p-8 sm:p-12 border border-slate-700/80 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-3xl bg-emerald-800/80 flex items-center justify-center text-emerald-200 mx-auto shadow-xl ring-4 ring-emerald-500/20">
              <Sparkles className="w-10 h-10 text-emerald-300 animate-pulse" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-3xl font-black tracking-tight text-white">Welcome to AgriTwin</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Configure your biophysical crop digital twin in minutes. This wizard registers your crop cultivar, maps plot boundaries, pairs IoT telemetry nodes, and activates real-time phenology modeling.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left pt-2">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">Farm / Facility Name</label>
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="e.g. Green Horizon Smart Farm"
                  className="w-full px-3 py-2 bg-slate-900 rounded-xl border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">Geographic Location</label>
                <input
                  type="text"
                  value={farmLocation}
                  onChange={(e) => setFarmLocation(e.target.value)}
                  placeholder="e.g. Central Valley, CA"
                  className="w-full px-3 py-2 bg-slate-900 rounded-xl border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-2 text-left">
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/60">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs mb-1">
                  <Sprout className="w-4 h-4" />
                  <span>1. Crop Cultivar</span>
                </div>
                <p className="text-[11px] text-slate-400">Calibrate base temperatures and growth curves.</p>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/60">
                <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs mb-1">
                  <MapPin className="w-4 h-4" />
                  <span>2. Geospatial Map</span>
                </div>
                <p className="text-[11px] text-slate-400">Outline soil beds with satellite coordinate mapping.</p>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/60">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs mb-1">
                  <Activity className="w-4 h-4" />
                  <span>3. Closed-Loop Twin</span>
                </div>
                <p className="text-[11px] text-slate-400">Live telemetry ingestion & automated actuation.</p>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-8 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg hover:shadow-emerald-900/40 transition-all flex items-center space-x-2.5 mx-auto cursor-pointer"
              >
                <span>Set Up Your Farm</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: CROP & CULTIVAR REGISTRATION ================= */}
        {step === 2 && (
          <div className="w-full bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-700 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Sprout className="w-5 h-5 text-emerald-400" />
                  <span>Step 2: Crop & Cultivar Registration</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Select a validated cultivar preset or define custom agronomic thresholds</p>
              </div>

              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCropSource('preset')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    cropSource === 'preset' ? 'bg-emerald-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Validated Catalog
                </button>
                <button
                  type="button"
                  onClick={() => setCropSource('custom')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    cropSource === 'custom' ? 'bg-emerald-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Custom Cultivar
                </button>
              </div>
            </div>

            {cropSource === 'preset' ? (
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Select Seeded Cultivar Preset
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(SEEDED_CROPS).map(([key, crop]) => {
                    const isSelected = selectedPresetKey === key;
                    return (
                      <div
                        key={key}
                        onClick={() => setSelectedPresetKey(key)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                          isSelected 
                            ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20' 
                            : 'bg-slate-900/60 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{crop.name.split('(')[0]}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium italic mt-0.5">{crop.botanical_name}</p>
                        </div>
                        <div className="text-[10px] text-emerald-300 font-bold bg-emerald-900/40 px-2 py-1 rounded-lg">
                          {crop.growth_duration_days} Days &bull; Moisture: {crop.ideal_conditions.humidity_min_pct}-{crop.ideal_conditions.humidity_max_pct}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Crop Name</label>
                  <input
                    type="text"
                    value={customCropName}
                    onChange={(e) => setCustomCropName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 rounded-xl border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Cultivar / Variety</label>
                  <input
                    type="text"
                    value={customVariety}
                    onChange={(e) => setCustomVariety(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 rounded-xl border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Growth Duration (Days)</label>
                  <input
                    type="number"
                    value={customDurationDays}
                    onChange={(e) => setCustomDurationDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-900 rounded-xl border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Water Need (L/day)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customWaterNeed}
                    onChange={(e) => setCustomWaterNeed(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-900 rounded-xl border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Step Controls */}
            <div className="pt-4 border-t border-slate-700 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-md flex items-center space-x-2"
              >
                <span>Continue to Step 3</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: GEOSPATIAL PLOT DEMARCATION ================= */}
        {step === 3 && (
          <div className="w-full bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-700 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-sky-400" />
                  <span>Step 3: Geospatial Plot Demarcation</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Outline plot polygon on satellite map or enter precise area</p>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawing(!isDrawing)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition-all ${
                  isDrawing ? 'bg-sky-600 text-white border-sky-400' : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <MousePointer className="w-3.5 h-3.5" />
                <span>{isDrawing ? 'Drawing Mode Active' : 'Click to Draw Boundary'}</span>
              </button>
            </div>

            {/* Interactive Draw Canvas / Map */}
            <div className="relative w-full h-56 bg-slate-950 rounded-2xl border border-slate-700 overflow-hidden select-none">
              <svg 
                className="w-full h-full cursor-crosshair"
                onClick={handleMapCanvasClick}
              >
                <defs>
                  <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#334155" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Drawn Boundary Polygon */}
                {polygonPoints.length > 2 && (
                  <polygon
                    points={polygonPoints.map((p, i) => {
                      const px = 100 + ((p[1] - 75.0078) / 0.003) * 500;
                      const py = 110 - ((p[0] - 15.4589) / 0.003) * 300;
                      return `${px},${py}`;
                    }).join(' ')}
                    fill="rgba(16, 185, 129, 0.25)"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray={isDrawing ? '4' : 'none'}
                  />
                )}

                {/* Vertices */}
                {polygonPoints.map((p, i) => {
                  const px = 100 + ((p[1] - 75.0078) / 0.003) * 500;
                  const py = 110 - ((p[0] - 15.4589) / 0.003) * 300;
                  return (
                    <circle
                      key={i}
                      cx={px}
                      cy={py}
                      r="4"
                      fill="#38bdf8"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </svg>

              <div className="absolute bottom-2 left-2 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700 text-[10px] text-slate-300 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>IIIT Dharwad Farm Campus &bull; 15.4589° N, 75.0078° E</span>
              </div>
            </div>

            {/* Plot Identification & Area Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Plot Bed Code</label>
                <input
                  type="text"
                  value={plotCode}
                  onChange={(e) => setPlotCode(e.target.value)}
                  placeholder="e.g. S-01"
                  className="w-full px-3.5 py-2 bg-slate-900 rounded-xl border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Plot Name</label>
                <input
                  type="text"
                  value={plotName}
                  onChange={(e) => setPlotName(e.target.value)}
                  placeholder="e.g. North Greenhouse Alpha"
                  className="w-full px-3.5 py-2 bg-slate-900 rounded-xl border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2 bg-slate-900 p-4 rounded-2xl border border-slate-700">
                <AreaUnitInput
                  value={plotAreaValue}
                  unit={plotAreaUnit}
                  onChange={(val, u) => {
                    setPlotAreaValue(val);
                    setPlotAreaUnit(u);
                  }}
                  label="Plot Demarcation Area"
                />
              </div>
            </div>

            {/* Step Controls */}
            <div className="pt-4 border-t border-slate-700 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-md flex items-center space-x-2"
              >
                <span>Continue to Step 4</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: IOT HARDWARE & NODE PAIRING ================= */}
        {step === 4 && (
          <div className="w-full bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-700 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Radio className="w-5 h-5 text-amber-400" />
                <span>Step 4: IoT Hardware & Node Pairing</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Pair a physical telemetry node or use high-fidelity simulated streaming</p>
            </div>

            {/* Hardware Mode / Simulation Toggle */}
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Simulation Stream Fallback</p>
                <p className="text-[11px] text-slate-400">Skip physical device pairing and stream synthetic twin data</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSimulated}
                  onChange={(e) => setIsSimulated(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {!isSimulated && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Physical IoT Node ID / MAC
                  </label>
                  <div className="relative">
                    <Cpu className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={nodeId}
                      onChange={(e) => setNodeId(e.target.value)}
                      placeholder="e.g. NODE-01 or ESP32-AGRI-04"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 rounded-xl border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-2">
                    Active Telemetry Sensors on Node
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      'Soil Moisture',
                      'Ambient Temp & Humidity',
                      'Substrate pH',
                      'PAR Sunlight Lux',
                      'CO2 Air Sensor',
                      'Leaf Wetness Grid'
                    ].map((sensor) => {
                      const isChecked = selectedSensorTypes.includes(sensor);
                      return (
                        <div
                          key={sensor}
                          onClick={() => {
                            if (isChecked) {
                              setSelectedSensorTypes(prev => prev.filter(s => s !== sensor));
                            } else {
                              setSelectedSensorTypes(prev => [...prev, sensor]);
                            }
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center space-x-2 ${
                            isChecked 
                              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200' 
                              : 'bg-slate-900 border-slate-700 text-slate-400'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center ${
                            isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-600'
                          }`}>
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                          <span className="font-semibold text-[11px]">{sensor}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step Controls */}
            <div className="pt-4 border-t border-slate-700 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(5)}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-md flex items-center space-x-2"
              >
                <span>Provision Digital Twin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 5: DIGITAL TWIN CANOPY PROVISIONING ================= */}
        {step === 5 && (
          <div className="w-full bg-slate-800/90 rounded-3xl p-8 sm:p-10 border border-slate-700/80 shadow-2xl space-y-6 text-center animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-800/80 flex items-center justify-center text-emerald-200 mx-auto ring-4 ring-emerald-500/20">
              <RefreshCw className={`w-8 h-8 ${isProvisioned ? 'text-emerald-300' : 'animate-spin text-emerald-400'}`} />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-white">
                {isProvisioned ? 'Digital Twin Provisioned!' : 'Provisioning Digital Twin Model...'}
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Calibrating Growing Degree Day (GDD) baseline, Leaf Area Index, and phenology curve starting at Day 0.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto space-y-2">
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${provisioningProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>GDD Indexing: T_base = 10°C</span>
                <span>{provisioningProgress}%</span>
              </div>
            </div>

            {/* Provisioned Virtual Card Preview */}
            {isProvisioned && (
              <div className="max-w-md mx-auto bg-slate-900 p-5 rounded-2xl border border-emerald-600/60 text-left space-y-3 animate-in zoom-in-95 duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 bg-slate-950 rounded-xl border border-slate-700 flex items-center justify-center shrink-0">
                    <PlantCanopySvg stage="germination" cropType={cropDetails.name} size={48} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 font-mono">
                        {plotCode}
                      </span>
                      <h4 className="text-sm font-bold text-white">{cropDetails.name}</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{cropDetails.variety}</p>
                    <p className="text-[10px] text-emerald-400 font-semibold mt-1">Day 0 &bull; Seedling / Germination Phase</p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4">
              <button
                type="button"
                disabled={!isProvisioned}
                onClick={() => setStep(6)}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-bold shadow-md flex items-center space-x-2 mx-auto cursor-pointer"
              >
                <span>Proceed to Live Telemetry Test</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 6: LIVE TELEMETRY PREVIEW & CLOSED-LOOP ACTUATION ================= */}
        {step === 6 && (
          <div className="w-full bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-700 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span>Step 6: Live Telemetry & Actuator Verification</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Test closed-loop hardware control and verify instant field audit logging</p>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-center">
                <div className="flex items-center justify-center space-x-1 text-[10px] text-sky-400 font-bold uppercase mb-1">
                  <Droplet className="w-3 h-3" />
                  <span>Soil Moisture</span>
                </div>
                <div className="text-lg font-bold text-white">{previewMoisture}%</div>
                <div className="text-[9px] text-emerald-400 font-semibold">Target {cropDetails.moistureMin}-{cropDetails.moistureMax}%</div>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-center">
                <div className="flex items-center justify-center space-x-1 text-[10px] text-rose-400 font-bold uppercase mb-1">
                  <Thermometer className="w-3 h-3" />
                  <span>Air Temp</span>
                </div>
                <div className="text-lg font-bold text-white">24.2°C</div>
                <div className="text-[9px] text-slate-400 font-medium">Optimal</div>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-center">
                <div className="flex items-center justify-center space-x-1 text-[10px] text-emerald-400 font-bold uppercase mb-1">
                  <Gauge className="w-3 h-3" />
                  <span>Soil pH</span>
                </div>
                <div className="text-lg font-bold text-white">6.5</div>
                <div className="text-[9px] text-slate-400 font-medium">Substrate</div>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-center">
                <div className="flex items-center justify-center space-x-1 text-[10px] text-amber-400 font-bold uppercase mb-1">
                  <Sun className="w-3 h-3" />
                  <span>PAR Lux</span>
                </div>
                <div className="text-lg font-bold text-white">650 Lux</div>
                <div className="text-[9px] text-slate-400 font-medium">Clear Sky</div>
              </div>
            </div>

            {/* Try an Action / Closed-Loop Actuator Widget */}
            <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>Closed-Loop Hardware Test</span>
                  </p>
                  <p className="text-[11px] text-slate-400">Trigger remote actuation to confirm Field Audit Log ledger recording</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  disabled={isIrrigating}
                  onClick={handleTestIrrigation}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                    isIrrigating ? 'bg-sky-600 text-white animate-pulse' : 'bg-sky-700 hover:bg-sky-600 text-white'
                  }`}
                >
                  <Droplet className="w-3.5 h-3.5" />
                  <span>{isIrrigating ? 'Irrigating...' : 'Trigger 15-Min Irrigation Pulse'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestHvac}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                    isHvacActive ? 'bg-emerald-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                  }`}
                >
                  <Wind className="w-3.5 h-3.5" />
                  <span>{isHvacActive ? 'Fan Running (ON)' : 'Toggle HVAC Fan'}</span>
                </button>
              </div>

              {actuationFeedback && (
                <p className="text-xs text-emerald-300 font-semibold flex items-center space-x-1 pt-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  <span>{actuationFeedback}</span>
                </p>
              )}
            </div>

            {/* Step Controls */}
            <div className="pt-4 border-t border-slate-700 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(5)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(7)}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-md flex items-center space-x-2"
              >
                <span>Continue to Summary</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 7: COMPLETION ================= */}
        {step === 7 && (
          <div className="w-full bg-slate-800/90 rounded-3xl p-8 sm:p-10 border border-slate-700/80 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-800 flex items-center justify-center text-emerald-200 mx-auto ring-4 ring-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 text-emerald-300" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-3xl font-black text-white">Setup Complete!</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Your farm digital twin has been calibrated, demarcated, and linked to live telemetry streams.
              </p>
            </div>

            {/* 4 Summary Verification Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left">
              <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-700/80">
                <span className="text-[10px] font-bold uppercase text-emerald-400">1. Crop Cultivar Registered</span>
                <p className="text-xs font-bold text-white mt-0.5">{cropDetails.name} ({cropDetails.variety})</p>
                <p className="text-[11px] text-slate-400">{cropDetails.durationDays} Days &bull; GDD Calibrated</p>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-700/80">
                <span className="text-[10px] font-bold uppercase text-sky-400">2. Geospatial Plot Bed</span>
                <p className="text-xs font-bold text-white mt-0.5">{plotCode} &bull; {plotName}</p>
                <p className="text-[11px] text-slate-400">{plotAreaValue} {plotAreaUnit} mapped</p>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-700/80">
                <span className="text-[10px] font-bold uppercase text-amber-400">3. Telemetry Pairing</span>
                <p className="text-xs font-bold text-white mt-0.5">{isSimulated ? 'Simulated Live Stream' : `Node: ${nodeId}`}</p>
                <p className="text-[11px] text-slate-400">{selectedSensorTypes.length} Active Probes</p>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-700/80">
                <span className="text-[10px] font-bold uppercase text-purple-400">4. Digital Twin Model</span>
                <p className="text-xs font-bold text-white mt-0.5">Phenology Engine Day 0</p>
                <p className="text-[11px] text-slate-400">Field Audit Logging Active</p>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleCompleteWizard}
                className="px-8 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm shadow-xl hover:shadow-emerald-900/50 transition-all flex items-center space-x-2 mx-auto cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/60 px-6 py-3 text-center text-xs text-slate-500">
        AgriTwin Precision Digital Twin &bull; IIIT Dharwad Smart Agriculture Initiative
      </footer>

    </div>
  );
};

export default GuidedOnboardingWizard;
