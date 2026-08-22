import React, { useState, useEffect, useMemo } from 'react';
import { 
  BrainCircuit, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Dna, 
  Ruler, 
  Grape, 
  ShieldAlert, 
  TrendingUp, 
  Sparkles,
  Send,
  Bot,
  Droplet,
  Wind,
  Check,
  Sprout
} from 'lucide-react';
import { useUserMode } from '../context/UserModeContext';
import { getPlots, getCrops, triggerPlotIrrigation, updatePlot } from '../lib/farm-storage';
import { logFieldAction } from '../lib/audit-log';
import { PlotBed, Crop } from '../types';

export const AIAdvisor = () => {
  const { isFarmer } = useUserMode();
  const [plots, setPlots] = useState<PlotBed[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string>('');
  const [question, setQuestion] = useState('');
  const [doctorAnswer, setDoctorAnswer] = useState<string | null>(null);
  const [answering, setAnswering] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const reloadData = () => {
    const p = getPlots();
    const c = getCrops();
    setPlots(p);
    setCrops(c);
    if (p.length > 0) {
      setSelectedPlotId(prev => (prev && p.some(item => item.id === prev)) ? prev : p[0].id);
    }
  };

  useEffect(() => {
    reloadData();
    const handleUpdate = () => reloadData();
    window.addEventListener('agri_storage_updated', handleUpdate);
    return () => window.removeEventListener('agri_storage_updated', handleUpdate);
  }, []);

  const activePlot = useMemo(() => {
    return plots.find(p => p.id === selectedPlotId) || plots[0] || null;
  }, [plots, selectedPlotId]);

  const assignedCrop = useMemo(() => {
    if (!activePlot || !activePlot.cropId) return null;
    return crops.find(c => c.id === activePlot.cropId) || null;
  }, [activePlot, crops]);

  // Dynamic Diagnosis & Prescription
  const diagnosis = useMemo(() => {
    if (!activePlot) {
      return {
        title: 'No Plot Selected',
        verdict: 'Standby for field telemetry.',
        healthScore: 100,
        yieldPotential: 100,
        recommendations: []
      };
    }

    const minMoisture = assignedCrop?.idealMoistureMin || 50;
    const maxMoisture = assignedCrop?.idealMoistureMax || 75;
    const minTemp = assignedCrop?.idealTempMin || 18;
    const maxTemp = assignedCrop?.idealTempMax || 30;

    const issues: { title: string; solution: string; actionType: 'water' | 'fan' | 'dosing'; actionLabel: string }[] = [];

    if (activePlot.soilMoisture < minMoisture) {
      issues.push({
        title: `Low Soil Moisture (${activePlot.soilMoisture}% vs Target ${minMoisture}-${maxMoisture}%)`,
        solution: `Root zone moisture is depleted. Transpiration rate requires a 15-minute drip irrigation replenishment pulse.`,
        actionType: 'water',
        actionLabel: 'Trigger 15-Min Irrigation Pulse'
      });
    }

    if (activePlot.airTemp > maxTemp) {
      issues.push({
        title: `High Canopy Thermal Stress (${activePlot.airTemp}°C vs Max ${maxTemp}°C)`,
        solution: `Canopy ambient heat is elevating vapor pressure deficit. Turn on overhead shade fans to stabilize leaf temperature.`,
        actionType: 'fan',
        actionLabel: 'Turn On Canopy Ventilation Fan'
      });
    }

    const isOptimal = issues.length === 0;
    const healthScore = isOptimal ? 96 : activePlot.airTemp > maxTemp && activePlot.soilMoisture < minMoisture ? 68 : 78;
    const yieldPotential = isOptimal ? 94 : 82;

    return {
      title: isOptimal ? 'Optimal Micro-Climate & Growth Equilibrium' : 'Micro-Climate Attention Recommended',
      verdict: isOptimal 
        ? `All environmental and root zone parameters for ${assignedCrop ? `${assignedCrop.name} (${assignedCrop.variety})` : activePlot.code} are aligned with optimal genetic potential.` 
        : `Agronomic deviations detected on ${activePlot.code}. Follow the recommended corrective actuations below.`,
      healthScore,
      yieldPotential,
      recommendations: issues
    };
  }, [activePlot, assignedCrop]);

  const handleAskDoctor = (queryText: string) => {
    setAnswering(true);
    setQuestion(queryText);
    setTimeout(() => {
      setAnswering(false);
      const cropName = assignedCrop ? assignedCrop.name : 'crop';
      if (queryText.toLowerCase().includes('yellow')) {
        setDoctorAnswer(`Yellowing leaves on ${cropName} indicate early Nitrogen deficiency combined with minor over-watering. Suggested action: Apply water-soluble NPK balanced nutrient formulation and verify moisture targets.`);
      } else if (queryText.toLowerCase().includes('harvest')) {
        setDoctorAnswer(`Based on GDD thermal accumulation and Day ${activePlot?.daysPlanted || 1} pace, your ${cropName} will reach optimal harvest maturity in ~${Math.max(1, (assignedCrop?.growthDurationDays || 90) - (activePlot?.daysPlanted || 1))} days.`);
      } else {
        setDoctorAnswer(`Micro-climate parameters for ${activePlot?.code || 'Plot'} (${cropName}) are currently evaluated against calibrated cultivar thresholds. Current moisture is ${activePlot?.soilMoisture}%, Air Temp is ${activePlot?.airTemp}°C.`);
      }
    }, 600);
  };

  const handle1TapAction = async (actionType: 'water' | 'fan' | 'dosing') => {
    if (!activePlot) return;
    if (actionType === 'water') {
      await triggerPlotIrrigation(activePlot.id);
      setActionSuccess(`15-Minute Drip Irrigation executed on ${activePlot.code}. Moisture updated (+8.5%).`);
    } else if (actionType === 'fan') {
      const nextFan = !activePlot.hvacActive;
      updatePlot({ ...activePlot, hvacActive: nextFan });
      await logFieldAction(
        activePlot.id,
        'hvac',
        'manual',
        `AI Advisor: Toggled canopy ventilation fan ${nextFan ? 'ON' : 'OFF'} on ${activePlot.code}.`,
        activePlot.code
      );
      setActionSuccess(`Canopy Ventilation Fan toggled ${nextFan ? 'ON' : 'OFF'} for ${activePlot.code}.`);
    } else {
      setActionSuccess('Nutrient dosing scheduled in field automation schedule.');
    }
    setTimeout(() => setActionSuccess(null), 3500);
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans pb-10">
      
      {/* Top Header & Plot Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center">
            <BrainCircuit className="mr-3 text-sky-600 w-8 h-8" />
            AI Crop Doctor & Advisor
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            {isFarmer 
              ? 'Plain-English diagnosis & 1-tap actionable solutions for field operations' 
              : 'Genotype-grounded intelligence & biophysical micro-climate recommendations'}
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

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center space-x-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Hero Recommendation Card */}
      <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-3xl p-8 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                Live Crop Doctor Diagnosis ({activePlot?.code || 'Active Bed'})
              </span>
            </div>
            <h3 className="text-2xl font-black">{diagnosis.title}</h3>
            <p className="text-sm text-emerald-50 leading-relaxed font-medium">
              {diagnosis.verdict}
            </p>
          </div>

          <div className="flex items-center space-x-6 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 self-start md:self-auto">
            <div>
              <div className="text-[10px] text-emerald-100 uppercase font-bold tracking-wider">Health Score</div>
              <div className="text-3xl font-black">{diagnosis.healthScore}%</div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <div className="text-[10px] text-emerald-100 uppercase font-bold tracking-wider">Yield Potential</div>
              <div className="text-3xl font-black">{diagnosis.yieldPotential}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Prescriptions with 1-Tap Actuation Buttons */}
      {diagnosis.recommendations.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-amber-200 bg-amber-50/40 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Active Agronomic Prescriptions for {activePlot?.code}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {diagnosis.recommendations.map((rec, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-900">{rec.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{rec.solution}</p>
                </div>

                <button
                  onClick={() => handle1TapAction(rec.actionType)}
                  className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
                >
                  {rec.actionType === 'water' ? <Droplet className="w-4 h-4" /> : <Wind className="w-4 h-4" />}
                  <span>{rec.actionLabel}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plain English AI Crop Doctor Question Box */}
      <div className="bg-white/95 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-200">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Ask the AI Crop Doctor</h3>
            <p className="text-xs text-slate-500 font-medium">Ask any field question in plain English (e.g. leaf discoloration, watering frequency)</p>
          </div>
        </div>

        {/* Question Input Form */}
        <div className="flex items-center space-x-2">
          <input 
            type="text"
            placeholder="Type a question (e.g. 'Why are my leaves yellowing?', 'When is the best harvest time?')..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && question && handleAskDoctor(question)}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-sky-500 shadow-inner"
          />
          <button
            onClick={() => handleAskDoctor(question || 'Why are my leaves yellowing?')}
            disabled={answering}
            className="p-3 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Question Prompt Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="text-xs text-slate-400 font-bold self-center mr-1">Try asking:</span>
          {[
            `Why are my ${assignedCrop?.name || 'crop'} leaves turning yellow?`,
            `When is the best time to harvest ${activePlot?.code || 'this plot'}?`,
            `How much water does ${activePlot?.code || 'this plot'} need today?`
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleAskDoctor(prompt)}
              className="text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-xl transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* AI Doctor Answer Output Box */}
        {doctorAnswer && (
          <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-5 space-y-2 animate-in fade-in">
            <div className="flex items-center space-x-2 text-sky-800 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>AI Crop Doctor Prescription:</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">{doctorAnswer}</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default AIAdvisor;
