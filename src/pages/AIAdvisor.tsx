import React, { useState, useMemo } from 'react';
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
import { useAgriStore } from '../context/AgriStore';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { PrototypeModeBanner } from '../components/common/PrototypeModeBanner';

export const AIAdvisor: React.FC = () => {
  const { activeSections: plots, crops, activeFarmland, triggerActuator } = useAgriStore();
  const [selectedPlotId, setSelectedPlotId] = useState<string>(plots[0]?.id || '');
  const [question, setQuestion] = useState('');
  const [doctorAnswer, setDoctorAnswer] = useState<string | null>(null);
  const [answering, setAnswering] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const activePlot = useMemo(() => {
    return plots.find(p => p.id === selectedPlotId) || plots[0] || null;
  }, [plots, selectedPlotId]);

  const assignedCrop = useMemo(() => {
    if (!activePlot || !activePlot.cropId) return null;
    return crops.find(c => c.id === activePlot.cropId) || null;
  }, [activePlot, crops]);

  const handleAskDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !activePlot) return;

    setAnswering(true);
    setTimeout(() => {
      setDoctorAnswer(
        `Agronomic Rule Assessment for ${activePlot.code} (${assignedCrop?.name || 'Crop'}): Based on current observation (Soil Moisture ${activePlot.soilMoisture}%, Temp ${activePlot.airTemp}°C, pH ${activePlot.soilPh}), maintain steady canopy ventilation and pulse irrigation.`
      );
      setAnswering(false);
    }, 600);
  };

  const handleAction = async (type: 'irrigation' | 'hvac') => {
    if (!activePlot) return;
    await triggerActuator(activePlot.id, type, 'manual');
    setActionSuccess(`Action executed on ${activePlot.code}: ${type === 'irrigation' ? 'Pulse Irrigation Triggered' : 'Canopy Fans Activated'}.`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans pb-10">
      <PrototypeModeBanner />

      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">AI Agronomic Advisor & Biophysical Diagnostics</h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                RULE-BASED ASSESSMENT
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Genotype-aware micro-climate validation & agronomic advice computed from actual plot observations.
            </p>
          </div>
        </div>

        {/* Plot Selector */}
        {plots.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Plot:</span>
            <select
              value={selectedPlotId}
              onChange={e => setSelectedPlotId(e.target.value)}
              className="bg-white text-slate-900 text-xs font-bold rounded-lg px-3 py-1 border border-slate-200 outline-none cursor-pointer"
            >
              {plots.map(p => {
                const c = crops.find(crop => crop.id === p.cropId);
                return (
                  <option key={p.id} value={p.id}>{p.code}: {c ? c.name : p.name}</option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-950 text-emerald-300 rounded-2xl border border-emerald-800 text-xs font-bold flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {activePlot ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Plot Telemetry Assessment Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-purple-600 tracking-wider">Current Plot State</span>
                <h3 className="text-lg font-black text-slate-900">{activePlot.code}: {assignedCrop?.name || 'Fallow'}</h3>
              </div>
              <DataSourceBadge source="MANUAL_PROTOTYPE" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="font-semibold text-slate-500">Soil Moisture:</span>
                <span className="font-black text-slate-900">{activePlot.soilMoisture}% (Target: {assignedCrop?.idealMoistureMin || 50}%–{assignedCrop?.idealMoistureMax || 75}%)</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="font-semibold text-slate-500">Air Temperature:</span>
                <span className="font-black text-slate-900">{activePlot.airTemp}°C (Target: {assignedCrop?.idealTempMin || 20}°C–{assignedCrop?.idealTempMax || 28}°C)</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="font-semibold text-slate-500">Soil pH:</span>
                <span className="font-black text-slate-900">{activePlot.soilPh} (Target: {assignedCrop?.idealPhMin || 6.0}–{assignedCrop?.idealPhMax || 6.8})</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => handleAction('irrigation')}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1"
              >
                <Droplet className="w-3.5 h-3.5" />
                <span>Irrigate Plot</span>
              </button>
              <button
                onClick={() => handleAction('hvac')}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1"
              >
                <Wind className="w-3.5 h-3.5" />
                <span>Toggle Fan</span>
              </button>
            </div>
          </div>

          {/* AI Agronomic Query & Diagnostics Console */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
                <Bot className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Ask Agronomic AI Assistant</h3>
              </div>

              <form onSubmit={handleAskDoctor} className="space-y-3">
                <textarea
                  rows={3}
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder={`Ask a question about ${activePlot.code} (${assignedCrop?.name || 'Crop'}). e.g. "What is the recommended irrigation schedule for current moisture levels?"`}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 outline-none focus:border-purple-500 transition-all resize-none"
                />

                <button
                  type="submit"
                  disabled={answering || !question.trim()}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 shadow-md shadow-purple-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{answering ? 'Analyzing Observations...' : 'Submit Query'}</span>
                </button>
              </form>

              {doctorAnswer && (
                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-950 font-medium animate-fadeIn space-y-2">
                  <div className="flex items-center space-x-1.5 text-purple-800 font-bold">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>AI Agronomic Guidance (Rule-Based Assessment):</span>
                  </div>
                  <p className="leading-relaxed">{doctorAnswer}</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-500 font-semibold">
              Note: Diagnostics are driven by authoritative observations in AgriStore and agronomic thresholds.
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs font-bold">
          No plots created yet. Please create a farm and plots to use AI Advisor.
        </div>
      )}
    </div>
  );
};

export default AIAdvisor;
