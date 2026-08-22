import React, { useState } from 'react';
import { 
  Building2, 
  Sprout, 
  Layers, 
  MapPin, 
  Cpu, 
  Droplets, 
  Calendar, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck,
  Radio
} from 'lucide-react';
import { AreaUnit, FarmProfile, Crop, PlotBed, TelemetryRecord, IoTSensor } from '../../types';
import { convertAreaToSqm, saveFarmProfile, saveCrops, savePlots, saveSensors, saveHistory } from '../../lib/farm-storage';

interface OnboardingWizardProps {
  onComplete: (profile: FarmProfile) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1: Farm Profile State
  const [farmName, setFarmName] = useState('Green Horizon Smart Farm');
  const [location, setLocation] = useState('Central Valley Agri-Hub, CA');
  const [totalArea, setTotalArea] = useState<number | ''>(25);
  const [unit, setUnit] = useState<AreaUnit>('acres');

  // Step 2: Initial Crop State
  const [cropName, setCropName] = useState('Tomato');
  const [variety, setVariety] = useState('Sarpan F1-STH-520');
  const [growthDurationDays, setGrowthDurationDays] = useState<number | ''>(90);
  const [idealMoistureMin, setIdealMoistureMin] = useState<number | ''>(55);
  const [idealMoistureMax, setIdealMoistureMax] = useState<number | ''>(75);

  // Step 3: Plot #1 & IoT Gateway State
  const [plotCode, setPlotCode] = useState('S-01');
  const [plotName, setPlotName] = useState('Alpha High-Tunnel Zone');
  const [plotArea, setPlotArea] = useState<number | ''>(5);
  const [gatewayNodeId, setGatewayNodeId] = useState('NODE-01');

  // Validate Step 1
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!farmName.trim()) newErrors.farmName = 'Farm name is required';
    if (!location.trim()) newErrors.location = 'Location is required';
    if (totalArea === '' || Number(totalArea) <= 0) {
      newErrors.totalArea = 'Total farm area must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Step 2
  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!cropName.trim()) newErrors.cropName = 'Crop name is required';
    if (!variety.trim()) newErrors.variety = 'Variety is required';
    if (growthDurationDays === '' || Number(growthDurationDays) <= 0) {
      newErrors.growthDurationDays = 'Duration must be greater than 0 days';
    }
    const minMoist = Number(idealMoistureMin);
    const maxMoist = Number(idealMoistureMax);
    if (idealMoistureMin === '' || minMoist < 0 || minMoist > 100) {
      newErrors.idealMoistureMin = 'Min moisture must be between 0% and 100%';
    }
    if (idealMoistureMax === '' || maxMoist < 0 || maxMoist > 100) {
      newErrors.idealMoistureMax = 'Max moisture must be between 0% and 100%';
    }
    if (idealMoistureMin !== '' && idealMoistureMax !== '' && minMoist > maxMoist) {
      newErrors.idealMoistureMax = 'Max moisture cannot be less than min moisture';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Step 3
  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!plotCode.trim()) newErrors.plotCode = 'Plot code is required (e.g. S-01)';
    if (!plotName.trim()) newErrors.plotName = 'Plot name is required';
    
    const parsedPlotArea = Number(plotArea);
    const parsedTotalArea = Number(totalArea);

    if (plotArea === '' || parsedPlotArea <= 0) {
      newErrors.plotArea = 'Plot area must be greater than 0';
    } else if (parsedPlotArea > parsedTotalArea) {
      newErrors.plotArea = `Plot area (${parsedPlotArea} ${unit}) cannot exceed Total Farm Area (${parsedTotalArea} ${unit})`;
    }

    if (!gatewayNodeId.trim()) newErrors.gatewayNodeId = 'IoT Node ID is required (e.g. NODE-01)';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setErrors({});
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    const now = new Date().toISOString();
    const parsedTotalArea = Number(totalArea);
    const parsedPlotArea = Number(plotArea);
    const totalAreaSqm = convertAreaToSqm(parsedTotalArea, unit);
    const plotAreaSqm = convertAreaToSqm(parsedPlotArea, unit);

    // 1. Farm Profile Record
    const farmProfile: FarmProfile = {
      name: farmName.trim(),
      location: location.trim(),
      totalArea: parsedTotalArea,
      unit,
      totalAreaSqm,
      createdAt: now,
      onboardingCompleted: true
    };

    // 2. Initial Crop Record
    const initialCropId = `crop_${Date.now()}`;
    const initialCrop: Crop = {
      id: initialCropId,
      name: cropName.trim(),
      variety: variety.trim(),
      growthDurationDays: Number(growthDurationDays),
      waterRequirementLpd: 4.5,
      idealMoistureMin: Number(idealMoistureMin),
      idealMoistureMax: Number(idealMoistureMax),
      idealTempMin: 20,
      idealTempMax: 28,
      idealPhMin: 6.0,
      idealPhMax: 6.8,
      createdAt: now
    };

    // 3. Plot #1 Record
    const initialPlotId = `plot_${Date.now()}`;
    const cleanPlotCode = plotCode.trim().toUpperCase();
    const cleanNodeId = gatewayNodeId.trim().toUpperCase();

    const initialPlot: PlotBed = {
      id: initialPlotId,
      code: cleanPlotCode,
      name: plotName.trim(),
      area: Number(plotArea),
      areaUnit: unit,
      areaSqm: plotAreaSqm,
      cropId: initialCropId,
      sensorNodeId: cleanNodeId,
      sensorId: cleanNodeId,
      soilMoisture: Number(idealMoistureMin) + 5,
      airTemp: 24.2,
      soilPh: 6.5,
      parLux: 650,
      isWatering: false,
      daysPlanted: 1,
      createdAt: now
    };

    // 4. Initial IoT Sensor Record
    const initialSensor: IoTSensor = {
      id: `sensor_${cleanNodeId.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`,
      nodeName: `${cleanNodeId} Multi-Sensor Array`,
      assignedPlotCode: cleanPlotCode,
      type: 'Multi-Soil & Canopy Node',
      batteryPct: 98,
      status: 'Online',
      lastPing: now
    };

    // 5. Initial Telemetry Record
    const initialTelemetry: TelemetryRecord = {
      id: `tel_${Date.now()}`,
      timestamp: now,
      plotCode: cleanPlotCode,
      cropName: cropName.trim(),
      soilMoisture: Number(idealMoistureMin) + 5,
      airTemp: 24.2,
      soilPh: 6.5,
      status: 'Optimal'
    };

    // Atomically persist to all 5 required localStorage keys
    saveFarmProfile(farmProfile);
    saveCrops([initialCrop]);
    savePlots([initialPlot]);
    saveSensors([initialSensor]);
    saveHistory([initialTelemetry]);

    // Transition immediately without page reload
    onComplete(farmProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header (Slate-900 & Emerald-800 Accent) */}
        <div className="bg-slate-900 px-6 sm:px-8 py-6 text-white border-b border-slate-800 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center text-emerald-100 shadow-md ring-2 ring-emerald-500/20">
                <Sparkles className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">AgriTwin Initialization</h1>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">Day-0 Smart Farm Setup & Biophysical Twin Provisioning</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Enterprise Twin v2.4</span>
            </div>
          </div>

          {/* Stepper Navigation */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between">
            {/* Step 1 Pill */}
            <div className="flex items-center space-x-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === 1 ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20 shadow-sm' : 
                step > 1 ? 'bg-emerald-800 text-emerald-200' : 'bg-slate-800 text-slate-400'
              }`}>
                {step > 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : '1'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold leading-none">Step 1</p>
                <p className={`text-xs font-bold ${step === 1 ? 'text-white' : 'text-slate-400'}`}>Farm Profile</p>
              </div>
            </div>

            <div className={`flex-1 mx-3 h-0.5 transition-colors ${step > 1 ? 'bg-emerald-600' : 'bg-slate-800'}`} />

            {/* Step 2 Pill */}
            <div className="flex items-center space-x-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === 2 ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20 shadow-sm' : 
                step > 2 ? 'bg-emerald-800 text-emerald-200' : 'bg-slate-800 text-slate-400'
              }`}>
                {step > 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : '2'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold leading-none">Step 2</p>
                <p className={`text-xs font-bold ${step === 2 ? 'text-white' : 'text-slate-400'}`}>Initial Crop</p>
              </div>
            </div>

            <div className={`flex-1 mx-3 h-0.5 transition-colors ${step > 2 ? 'bg-emerald-600' : 'bg-slate-800'}`} />

            {/* Step 3 Pill */}
            <div className="flex items-center space-x-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === 3 ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20 shadow-sm' : 'bg-slate-800 text-slate-400'
              }`}>
                3
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold leading-none">Step 3</p>
                <p className={`text-xs font-bold ${step === 3 ? 'text-white' : 'text-slate-400'}`}>Plot & Node</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 flex-1 bg-white">
          
          {/* STEP 1: Farm Profile */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-lg pb-2 border-b border-slate-100">
                <Building2 className="w-5 h-5 text-emerald-800" />
                <h2>Step 1: Farm Infrastructure & Area</h2>
              </div>
              <p className="text-xs text-slate-500 -mt-3">Specify the primary farm boundary and measurement unit for your digital twin.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Farm Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Farm / Facility Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="e.g. Green Horizon Smart Farm"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 transition-all ${
                      errors.farmName ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200 focus:border-emerald-800'
                    }`}
                  />
                  {errors.farmName && (
                    <p className="text-rose-600 text-xs mt-1 flex items-center font-medium">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.farmName}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Geographic Location / Region <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Central Valley Agri-Hub, CA or Dharwad, India"
                      className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 rounded-xl border text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 transition-all ${
                        errors.location ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200 focus:border-emerald-800'
                      }`}
                    />
                  </div>
                  {errors.location && (
                    <p className="text-rose-600 text-xs mt-1 flex items-center font-medium">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.location}
                    </p>
                  )}
                </div>

                {/* Total Area */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Total Farm Area <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={totalArea}
                    onChange={(e) => setTotalArea(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 25"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 transition-all ${
                      errors.totalArea ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200 focus:border-emerald-800'
                    }`}
                  />
                  {errors.totalArea && (
                    <p className="text-rose-600 text-xs mt-1 flex items-center font-medium">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.totalArea}
                    </p>
                  )}
                </div>

                {/* Measurement Unit */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Measurement Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as AreaUnit)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/20 transition-all"
                  >
                    <option value="acres">Acres (ac)</option>
                    <option value="hectares">Hectares (ha)</option>
                    <option value="sqft">Square Feet (sq ft)</option>
                    <option value="sqm">Square Meters (m²)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Initial Crop Registration */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-lg pb-2 border-b border-slate-100">
                <Sprout className="w-5 h-5 text-emerald-800" />
                <h2>Step 2: Primary Crop Registration</h2>
              </div>
              <p className="text-xs text-slate-500 -mt-3">Configure biophysical targets and vegetative thresholds for growth cycle modeling.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Crop Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Crop Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    placeholder="e.g. Tomato, Chilli, Wheat"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 transition-all ${
                      errors.cropName ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200 focus:border-emerald-800'
                    }`}
                  />
                  {errors.cropName && (
                    <p className="text-rose-600 text-xs mt-1 flex items-center font-medium">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.cropName}
                    </p>
                  )}
                </div>

                {/* Variety */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Cultivar / Variety <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    placeholder="e.g. Sarpan F1-STH-520"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 transition-all ${
                      errors.variety ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200 focus:border-emerald-800'
                    }`}
                  />
                  {errors.variety && (
                    <p className="text-rose-600 text-xs mt-1 flex items-center font-medium">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.variety}
                    </p>
                  )}
                </div>

                {/* Growth Duration */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Growth Duration (Days to Harvest) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="number"
                      min="1"
                      value={growthDurationDays}
                      onChange={(e) => setGrowthDurationDays(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 90"
                      className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 rounded-xl border text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 transition-all ${
                        errors.growthDurationDays ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200 focus:border-emerald-800'
                      }`}
                    />
                  </div>
                  {errors.growthDurationDays && (
                    <p className="text-rose-600 text-xs mt-1 flex items-center font-medium">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.growthDurationDays}
                    </p>
                  )}
                </div>

                {/* Ideal Soil Moisture Range */}
                <div className="sm:col-span-2 p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                      <Droplets className="w-4 h-4 text-emerald-700" />
                      <span>Ideal Soil Moisture Boundaries (%)</span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                      Biophysical Calibration
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                        Min Soil Moisture (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={idealMoistureMin}
                        onChange={(e) => setIdealMoistureMin(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 55"
                        className={`w-full px-3 py-2 bg-white rounded-lg border text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-800 transition-all ${
                          errors.idealMoistureMin ? 'border-rose-400' : 'border-slate-200'
                        }`}
                      />
                      {errors.idealMoistureMin && (
                        <p className="text-rose-600 text-[11px] mt-0.5 font-medium">{errors.idealMoistureMin}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                        Max Soil Moisture (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={idealMoistureMax}
                        onChange={(e) => setIdealMoistureMax(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 75"
                        className={`w-full px-3 py-2 bg-white rounded-lg border text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-800 transition-all ${
                          errors.idealMoistureMax ? 'border-rose-400' : 'border-slate-200'
                        }`}
                      />
                      {errors.idealMoistureMax && (
                        <p className="text-rose-600 text-[11px] mt-0.5 font-medium">{errors.idealMoistureMax}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Configure Plot #1 & IoT Gateway */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-lg pb-2 border-b border-slate-100">
                <Layers className="w-5 h-5 text-emerald-800" />
                <h2>Step 3: Plot #1 & IoT Node Configuration</h2>
              </div>
              <p className="text-xs text-slate-500 -mt-3">Link your first management zone to an edge hardware sensor node.</p>

              {/* Area Allocation Badge */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-600 font-medium">Total Registered Farm Area:</span>
                <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {totalArea} {unit}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Plot Code */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Plot Code / Identifier <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={plotCode}
                    onChange={(e) => setPlotCode(e.target.value)}
                    placeholder="e.g. S-01"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 transition-all ${
                      errors.plotCode ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200 focus:border-emerald-800'
                    }`}
                  />
                  {errors.plotCode && (
                    <p className="text-rose-600 text-xs mt-1 flex items-center font-medium">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.plotCode}
                    </p>
                  )}
                </div>

                {/* Plot Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Plot Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={plotName}
                    onChange={(e) => setPlotName(e.target.value)}
                    placeholder="e.g. Alpha High-Tunnel Zone"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 transition-all ${
                      errors.plotName ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200 focus:border-emerald-800'
                    }`}
                  />
                  {errors.plotName && (
                    <p className="text-rose-600 text-xs mt-1 flex items-center font-medium">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.plotName}
                    </p>
                  )}
                </div>

                {/* Plot Area */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Plot Area ({unit}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={plotArea}
                    onChange={(e) => setPlotArea(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={`e.g. 5 (max ${totalArea})`}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 transition-all ${
                      errors.plotArea ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200 focus:border-emerald-800'
                    }`}
                  />
                  {errors.plotArea && (
                    <p className="text-rose-600 text-xs mt-1 flex items-center font-medium">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.plotArea}
                    </p>
                  )}
                </div>

                {/* IoT Node ID */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    IoT Node ID <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Radio className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={gatewayNodeId}
                      onChange={(e) => setGatewayNodeId(e.target.value)}
                      placeholder="e.g. NODE-01"
                      className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 rounded-xl border text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 transition-all ${
                        errors.gatewayNodeId ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200 focus:border-emerald-800'
                      }`}
                    />
                  </div>
                  {errors.gatewayNodeId && (
                    <p className="text-rose-600 text-xs mt-1 flex items-center font-medium">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.gatewayNodeId}
                    </p>
                  )}
                </div>
              </div>

              {/* Connected Preview Info */}
              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 flex items-start space-x-3 text-xs text-emerald-950">
                <Cpu className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-900">Provisioning Assignment:</p>
                  <p className="text-slate-600 mt-0.5">
                    Plot <span className="font-semibold text-slate-800">{plotCode || 'S-01'}</span> will be assigned to initial crop <span className="font-semibold text-slate-800">{cropName || 'Tomato'} ({variety || 'Sarpan F1-STH-520'})</span> and stream telemetry via IoT Node <span className="font-semibold text-slate-800">{gatewayNodeId || 'NODE-01'}</span>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center space-x-2 ml-auto cursor-pointer"
              >
                <span>Continue to Step {step + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center space-x-2 ml-auto cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Complete Onboarding & Launch Twin</span>
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
};
