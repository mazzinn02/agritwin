import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Layers, 
  Sprout, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Sparkles,
  Info,
  X
} from 'lucide-react';
import { AreaUnitInput, AreaUnit } from '../common/AreaUnitInput';
import { VisualPlotPreview, SectionAssignment } from './VisualPlotPreview';
import { getCrops, addPlot, saveFarmProfile, convertAreaToSqm } from '../../lib/farm-storage';
import { saveFarmRecord, saveSectionPlotRecord } from '../../lib/firebase';
import { Crop, PlotBed } from '../../types';

interface AddNewFarmlandWizardProps {
  onClose?: () => void;
  isModal?: boolean;
}

const DEFAULT_SARPAN_CROPS: Crop[] = [
  {
    id: 'crop_sarpan_maize',
    name: 'Sarpan Hybrid Maize',
    variety: 'Sarpan 555 Gold',
    growthDurationDays: 110,
    waterRequirementLpd: 5.5,
    idealMoistureMin: 55,
    idealMoistureMax: 80,
    idealTempMin: 20,
    idealTempMax: 32,
    idealPhMin: 6.0,
    idealPhMax: 7.2
  },
  {
    id: 'crop_sarpan_tomato',
    name: 'Sarpan Hybrid Tomato',
    variety: 'Sarpan Red Gem',
    growthDurationDays: 90,
    waterRequirementLpd: 4.2,
    idealMoistureMin: 60,
    idealMoistureMax: 85,
    idealTempMin: 18,
    idealTempMax: 30,
    idealPhMin: 6.0,
    idealPhMax: 6.8
  },
  {
    id: 'crop_sarpan_cotton',
    name: 'Sarpan Bt Cotton',
    variety: 'Sarpan Super Boll',
    growthDurationDays: 150,
    waterRequirementLpd: 6.8,
    idealMoistureMin: 50,
    idealMoistureMax: 75,
    idealTempMin: 22,
    idealTempMax: 35,
    idealPhMin: 6.5,
    idealPhMax: 7.5
  },
  {
    id: 'crop_sarpan_wheat',
    name: 'Sarpan Winter Wheat',
    variety: 'Sarpan Sharbati',
    growthDurationDays: 120,
    waterRequirementLpd: 4.0,
    idealMoistureMin: 50,
    idealMoistureMax: 70,
    idealTempMin: 15,
    idealTempMax: 26,
    idealPhMin: 6.2,
    idealPhMax: 7.0
  }
];

export const AddNewFarmlandWizard: React.FC<AddNewFarmlandWizardProps> = ({ onClose, isModal = false }) => {
  const navigate = useNavigate();

  // Multi-step state
  const [step, setStep] = useState<number>(1);

  // Step 1: Basics
  const [farmName, setFarmName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [totalArea, setTotalArea] = useState<number>(20);
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('Acres');

  // Step 2: Section Count
  const [sectionCount, setSectionCount] = useState<number>(4);

  // Step 3: Sections Configuration
  const [sections, setSections] = useState<SectionAssignment[]>([]);

  // Available Crops
  const [allCrops, setAllCrops] = useState<Crop[]>([]);
  const [saving, setSaving] = useState<boolean>(false);

  // Load existing crops or fallback to Sarpan defaults
  useEffect(() => {
    const loaded = getCrops();
    if (loaded && loaded.length > 0) {
      setAllCrops(loaded);
    } else {
      setAllCrops(DEFAULT_SARPAN_CROPS);
    }
  }, []);

  // Initialize or update section array when sectionCount or totalArea changes
  useEffect(() => {
    const count = Math.max(1, Math.min(12, sectionCount));
    const equalArea = Number((totalArea / count).toFixed(2));

    setSections(prev => {
      const updated: SectionAssignment[] = [];
      for (let i = 0; i < count; i++) {
        const letter = String.fromCharCode(65 + i);
        const existing = prev[i];
        const defaultCrop = allCrops[i % allCrops.length] || allCrops[0];

        updated.push({
          code: existing?.code || `SEC-${letter}`,
          name: existing?.name || `Section ${letter}`,
          cropId: existing?.cropId || defaultCrop?.id || '',
          area: existing ? existing.area : equalArea,
          cropObj: existing?.cropObj || defaultCrop
        });
      }
      return updated;
    });
  }, [sectionCount, totalArea, allCrops]);

  // Sum of section areas
  const allocatedSum = useMemo(() => {
    return Number(sections.reduce((sum, s) => sum + (Number(s.area) || 0), 0).toFixed(2));
  }, [sections]);

  // Validation discrepancy
  const diff = Number((allocatedSum - totalArea).toFixed(2));
  const isExactMatch = Math.abs(diff) < 0.01 && totalArea > 0;

  // Handle Section updates
  const updateSection = (idx: number, field: keyof SectionAssignment, val: any) => {
    setSections(prev => {
      const clone = [...prev];
      if (clone[idx]) {
        clone[idx] = { ...clone[idx], [field]: val };
        if (field === 'cropId') {
          const cropObj = allCrops.find(c => c.id === val) || null;
          clone[idx].cropObj = cropObj;
        }
      }
      return clone;
    });
  };

  // Step 5: Save Farmland & Sections to Firebase & Local Storage
  const handleSave = async () => {
    if (!farmName.trim()) {
      alert('Please enter a farmland name');
      setStep(1);
      return;
    }
    if (!isExactMatch) {
      alert('Section areas must sum up exactly to the total farmland area before saving.');
      setStep(3);
      return;
    }

    setSaving(true);

    try {
      const farmId = `farm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const farmRecord = {
        id: farmId,
        name: farmName,
        location: location || 'Precision Agriculture Sector',
        totalArea,
        unit: areaUnit.toLowerCase(),
        totalAreaSqm: convertAreaToSqm(totalArea, areaUnit.toLowerCase()),
        sectionsCount: sections.length,
        createdAt: new Date().toISOString(),
        onboardingCompleted: true
      };

      // 1. Save Farm Profile in Firebase & Local Storage
      await saveFarmRecord(farmRecord);
      saveFarmProfile(farmRecord as any);

      // 2. Save each Section as a Plot record in Firebase & Local Storage
      const createdPlots: PlotBed[] = [];
      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        const plotData = {
          code: sec.code,
          name: `${sec.name} (${farmName})`,
          area: sec.area,
          areaUnit: areaUnit.toLowerCase(),
          areaSqm: convertAreaToSqm(sec.area, areaUnit.toLowerCase()),
          cropId: sec.cropId || null,
          sensorNodeId: `NODE-${farmId.slice(-4)}-${sec.code}`,
          sensorId: `NODE-${farmId.slice(-4)}-${sec.code}`,
          soilMoisture: 62,
          airTemp: 24,
          soilPh: 6.5,
          parLux: 680,
          daysPlanted: 1,
          isWatering: false,
          createdAt: new Date().toISOString()
        };

        const newPlot = addPlot(plotData as any);
        await saveSectionPlotRecord({ ...newPlot, farmId });
        createdPlots.push(newPlot);
      }

      setSaving(false);
      if (onClose) onClose();
      navigate('/');
    } catch (err) {
      console.error('Error saving new farmland:', err);
      setSaving(false);
      alert('Saved locally. Navigating to Dashboard...');
      if (onClose) onClose();
      navigate('/');
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-4">
      {/* Top Header */}
      <div className="bg-slate-900 text-white p-6 relative">
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-sky-600 text-white shadow-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Admin Land Provisioning</span>
            <h2 className="text-2xl font-black tracking-tight text-white">Add New Farmland</h2>
          </div>
        </div>

        {/* Step Progress Tracker */}
        <div className="grid grid-cols-5 gap-2 mt-6">
          {[
            { num: 1, label: 'Basics' },
            { num: 2, label: 'Sections' },
            { num: 3, label: 'Allocation' },
            { num: 4, label: '2D Preview' },
            { num: 5, label: 'Confirm' }
          ].map(s => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div key={s.num} className="flex flex-col items-center">
                <div
                  className={`w-full h-1.5 rounded-full transition-all duration-300 ${
                    isDone ? 'bg-emerald-500' : isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-800'
                  }`}
                />
                <span className={`text-[10px] font-semibold mt-1.5 ${isActive ? 'text-emerald-400' : isDone ? 'text-slate-300' : 'text-slate-500'}`}>
                  {s.num}. {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form Content Body */}
      <div className="p-6 md:p-8 space-y-6">

        {/* STEP 1: Farmland Basics */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Step 1: Farmland Identification & Area</h3>
              <p className="text-xs text-slate-500 mt-1">Enter the primary details and total surface area for this agricultural property.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Farmland Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={farmName}
                    onChange={e => setFarmName(e.target.value)}
                    placeholder="e.g. Sarpan Valley Tech Farm"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-medium placeholder-slate-400 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Location / Region
                </label>
                <div className="relative">
                  <MapPin className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Salinas Valley, Sector A"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-medium placeholder-slate-400 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Total Area Input using AreaUnitInput Component */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Total Farmland Area
              </label>
              <AreaUnitInput
                value={totalArea}
                unit={areaUnit}
                onChange={(val, unit) => {
                  setTotalArea(val);
                  setAreaUnit(unit);
                }}
                label="Property Surface Boundary"
                placeholder="Enter total area (e.g. 25)"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Section Division Count */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Step 2: Section Partitioning</h3>
              <p className="text-xs text-slate-500 mt-1">Specify how many individual crop sections or plot beds to divide this land into.</p>
            </div>

            {/* Reference Total Area Card */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Layers className="w-6 h-6 text-emerald-700" />
                <div>
                  <span className="text-xs font-semibold text-emerald-800">Fixed Property Reference</span>
                  <h4 className="text-lg font-extrabold text-emerald-950">{farmName || 'Farmland'}</h4>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-700">{totalArea}</span>
                <span className="text-xs font-bold text-emerald-800 ml-1">{areaUnit}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                How many sections do you want to divide this farmland into?
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={sectionCount}
                  onChange={e => setSectionCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-32 px-4 py-3 text-xl font-bold text-slate-900 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-center outline-none"
                />
                <span className="text-sm font-semibold text-slate-600">Sections (e.g. 4 sections = Section A, B, C, D)</span>
              </div>
            </div>

            {/* Quick Grid Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Quick Section Count Presets</label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 6, 8].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSectionCount(n)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      sectionCount === n
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {n} {n === 1 ? 'Section' : 'Sections'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Per-Section Crop & Area Assignment */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step 3: Section Crop & Area Allocation</h3>
                <p className="text-xs text-slate-500 mt-1">Assign crops and surface area to each section. Sum must equal total farmland area.</p>
              </div>

              {/* Reference indicator */}
              <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold self-start sm:self-auto">
                Target: {totalArea} {areaUnit}
              </div>
            </div>

            {/* Live Running Total Progress Bar & Hard Validation State */}
            <div className={`p-4 rounded-2xl border transition-all ${
              isExactMatch
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : diff > 0
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : 'bg-sky-50 border-sky-300 text-sky-950'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {isExactMatch ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className={`w-5 h-5 shrink-0 ${diff > 0 ? 'text-rose-600' : 'text-sky-600'}`} />
                  )}
                  <span className="font-bold text-sm">
                    Allocated: {allocatedSum} / {totalArea} {areaUnit}
                  </span>
                </div>

                <span className="text-xs font-bold">
                  {isExactMatch ? (
                    <span className="text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">Exact Allocation Match</span>
                  ) : diff > 0 ? (
                    <span className="text-rose-700 bg-rose-100/80 px-2.5 py-1 rounded-lg">Over-allocated by {Math.abs(diff)} {areaUnit}</span>
                  ) : (
                    <span className="text-sky-700 bg-sky-100/80 px-2.5 py-1 rounded-lg">{Math.abs(diff)} {areaUnit} remaining to allocate</span>
                  )}
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isExactMatch ? 'bg-emerald-500' : diff > 0 ? 'bg-rose-500' : 'bg-sky-500'
                  }`}
                  style={{ width: `${Math.min(100, (allocatedSum / (totalArea || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Per-Section Rows */}
            <div className="space-y-3">
              {sections.map((sec, idx) => (
                <div key={sec.code || idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 w-full md:w-48">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono text-xs font-bold">
                      {sec.code}
                    </span>
                    <input
                      type="text"
                      value={sec.name}
                      onChange={e => updateSection(idx, 'name', e.target.value)}
                      className="w-full text-sm font-bold text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Crop Selection Dropdown */}
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assigned Crop</label>
                    <select
                      value={sec.cropId}
                      onChange={e => updateSection(idx, 'cropId', e.target.value)}
                      className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 px-3 py-2.5 rounded-xl outline-none focus:border-emerald-500"
                    >
                      {allCrops.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.variety})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Area Input */}
                  <div className="w-full md:w-44">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Section Area ({areaUnit})</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={sec.area}
                      onChange={e => updateSection(idx, 'area', parseFloat(e.target.value) || 0)}
                      className="w-full text-sm font-bold text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-emerald-500 text-right"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Visual Plot Preview */}
        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Step 4: 2D Visual Schematic Preview</h3>
              <p className="text-xs text-slate-500 mt-1">Review the proportional block rendering of your new farmland before saving.</p>
            </div>

            <VisualPlotPreview
              farmName={farmName || 'Farmland Estate'}
              location={location}
              totalArea={totalArea}
              areaUnit={areaUnit}
              sections={sections}
              allCrops={allCrops}
            />
          </div>
        )}

        {/* STEP 5: Confirm & Save */}
        {step === 5 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Step 5: Confirm & Deploy Farmland</h3>
              <p className="text-xs text-slate-500 mt-1">Verify all farmland parameters. On saving, records will be persisted to Firebase & Digital Twin OS.</p>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Farmland Name</span>
                  <p className="font-extrabold text-white text-base mt-0.5">{farmName}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Location</span>
                  <p className="font-extrabold text-white text-base mt-0.5">{location || 'Salinas Valley'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Area</span>
                  <p className="font-extrabold text-emerald-400 text-base mt-0.5">{totalArea} {areaUnit}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Sections</span>
                  <p className="font-extrabold text-white text-base mt-0.5">{sections.length} Plots</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Sections Summary</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sections.map(s => {
                    const crop = allCrops.find(c => c.id === s.cropId);
                    return (
                      <div key={s.code} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-emerald-300 text-xs">{s.code}</span> &bull; <span className="font-medium text-slate-200 text-xs">{s.name}</span>
                          <p className="text-[11px] text-slate-400 mt-0.5">{crop ? `${crop.name}` : 'Custom Crop'}</p>
                        </div>
                        <span className="text-xs font-bold text-white bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
                          {s.area} {areaUnit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Wizard Footer Navigation Controls */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          disabled={step === 1 || saving}
          onClick={() => setStep(prev => Math.max(1, prev - 1))}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-white disabled:opacity-40 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {step < 5 ? (
          <button
            type="button"
            disabled={(step === 1 && !farmName.trim()) || (step === 3 && !isExactMatch)}
            onClick={() => setStep(prev => Math.min(5, prev + 1))}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 disabled:opacity-40 transition-all"
          >
            <span>Next Step</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={saving || !isExactMatch}
            onClick={handleSave}
            className="flex items-center space-x-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 disabled:opacity-40 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving & Deploying...' : 'Deploy Farmland & Sections'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AddNewFarmlandWizard;
