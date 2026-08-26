import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  MapPin, 
  Sliders, 
  Clock, 
  Building2,
  Cpu,
  Plus,
  Trash2,
  Check
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { AGRICULTURAL_PARAMETERS, getParameterDefinition } from '../lib/parameters';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { PrototypeModeBanner } from '../components/common/PrototypeModeBanner';

interface ParameterRow {
  id: string;
  parameterKey: string;
  value: string;
  unit: string;
}

export const ManualTelemetryPage: React.FC = () => {
  const { 
    farmlands, 
    activeFarmland, 
    activeSections, 
    selectFarmland, 
    addTelemetryObservation, 
    currentUser 
  } = useAgriStore();

  const [selectedFarmId, setSelectedFarmId] = useState<string>(activeFarmland?.id || farmlands[0]?.id || '');
  const [selectedPlotId, setSelectedPlotId] = useState<string>(activeSections[0]?.id || '');
  const [timestamp, setTimestamp] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState<string>('');

  // Multi-parameter rows batch input state
  const [paramRows, setParamRows] = useState<ParameterRow[]>([
    { id: 'row_1', parameterKey: 'soil_moisture', value: '', unit: '%' },
    { id: 'row_2', parameterKey: 'air_temperature', value: '', unit: '°C' }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFarmId) {
      selectFarmland(selectedFarmId);
    }
  }, [selectedFarmId]);

  useEffect(() => {
    if (activeSections.length > 0 && (!selectedPlotId || !activeSections.some(p => p.id === selectedPlotId))) {
      setSelectedPlotId(activeSections[0].id);
    }
  }, [activeSections]);

  const selectedPlot = activeSections.find(p => p.id === selectedPlotId) || activeSections[0] || null;

  const handleRowParamChange = (rowId: string, newKey: string) => {
    const def = getParameterDefinition(newKey);
    setParamRows(prev => prev.map(r => r.id === rowId ? { ...r, parameterKey: newKey, unit: def.unit } : r));
  };

  const handleRowValueChange = (rowId: string, val: string) => {
    setParamRows(prev => prev.map(r => r.id === rowId ? { ...r, value: val } : r));
  };

  const handleAddRow = () => {
    const nextKey = AGRICULTURAL_PARAMETERS[paramRows.length % AGRICULTURAL_PARAMETERS.length].key;
    const def = getParameterDefinition(nextKey);
    setParamRows(prev => [...prev, { id: `row_${Date.now()}`, parameterKey: nextKey, value: '', unit: def.unit }]);
  };

  const handleRemoveRow = (rowId: string) => {
    if (paramRows.length <= 1) return;
    setParamRows(prev => prev.filter(r => r.id !== rowId));
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!selectedFarmId) errs.farm = 'Please select a farm property';
    if (!selectedPlotId) errs.plot = 'Please select a plot section';
    if (!timestamp) errs.timestamp = 'Please enter date and time';

    let validRowsCount = 0;
    paramRows.forEach((r, idx) => {
      if (r.value !== '' && !isNaN(Number(r.value))) {
        validRowsCount++;
      } else if (r.value !== '' && isNaN(Number(r.value))) {
        errs[`row_${idx}`] = 'Please enter a valid numerical value';
      }
    });

    if (validRowsCount === 0) {
      errs.general = 'Please enter at least one numerical observation reading';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const isoTimestamp = new Date(timestamp).toISOString();
    let submittedCount = 0;

    paramRows.forEach(r => {
      if (r.value !== '' && !isNaN(Number(r.value))) {
        const numVal = Number(Number(r.value).toFixed(2));
        const pDef = getParameterDefinition(r.parameterKey);

        addTelemetryObservation({
          farmId: selectedFarmId,
          plotId: selectedPlot?.id || selectedPlotId,
          deviceId: selectedPlot?.sensorNodeId || 'NODE-01',
          sensorId: selectedPlot?.sensorNodeId || 'NODE-01',
          parameterKey: r.parameterKey,
          displayName: pDef.displayName,
          value: numVal,
          unit: r.unit,
          measurementTimestamp: isoTimestamp,
          qualityStatus: 'VALID',
          dataSource: 'MANUAL_PROTOTYPE',
          metadata: {
            operator: currentUser?.full_name || 'Administrator',
            notes: notes.trim() || undefined
          }
        });
        submittedCount++;
      }
    });

    setSuccessMessage(
      `Successfully recorded ${submittedCount} observation reading(s) for ${selectedPlot?.code || selectedPlotId}. Digital Twin updated.`
    );

    // Reset values
    setParamRows(prev => prev.map(r => ({ ...r, value: '' })));
    setNotes('');
    setTimeout(() => setSuccessMessage(null), 4500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 font-sans text-slate-800 pb-10">
      <PrototypeModeBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">Add Farm Observations</h1>
              <DataSourceBadge source="MANUAL_PROTOTYPE" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter manual prototype observations to update plot Digital Twin status across all views.
            </p>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-950 text-emerald-300 rounded-2xl border border-emerald-800 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        
        {/* Step 1: Location & Time Selection */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            1. Select Property & Location
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Which farm?</label>
              <select
                value={selectedFarmId}
                onChange={e => setSelectedFarmId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 cursor-pointer"
              >
                {farmlands.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.location})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Which plot?</label>
              <select
                value={selectedPlotId}
                onChange={e => setSelectedPlotId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 cursor-pointer"
              >
                {activeSections.map(p => (
                  <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Date & Time</label>
              <input
                type="datetime-local"
                value={timestamp}
                onChange={e => setTimestamp(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Multi-Parameter Observation Batch Entry */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
              2. Enter Observation Readings
            </h3>
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center space-x-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Another Reading</span>
            </button>
          </div>

          {errors.general && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errors.general}</span>
            </div>
          )}

          <div className="space-y-3">
            {paramRows.map((row, idx) => {
              const pDef = getParameterDefinition(row.parameterKey);
              return (
                <div key={row.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Parameter</label>
                    <select
                      value={row.parameterKey}
                      onChange={e => handleRowParamChange(row.id, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {AGRICULTURAL_PARAMETERS.map(param => (
                        <option key={param.key} value={param.key}>{param.displayName} ({param.unit})</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Value ({row.unit})</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={`e.g. 58.4 (${pDef.minRange}-${pDef.maxRange})`}
                      value={row.value}
                      onChange={e => handleRowValueChange(row.id, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Unit</label>
                    <input
                      type="text"
                      readOnly
                      value={row.unit}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none cursor-not-allowed"
                    />
                  </div>

                  <div className="sm:col-span-1 text-right pt-4 sm:pt-0">
                    {paramRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Field Notes */}
        <div className="pt-2">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Field Notes (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Handheld TDR probe calibration after morning irrigation."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-indigo-500"
          />
        </div>

        {/* Form Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Save All Readings</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualTelemetryPage;
