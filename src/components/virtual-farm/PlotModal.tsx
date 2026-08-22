import React, { useState, useEffect, useMemo } from 'react';
import { X, Layers, Sprout, Radio, Trash2, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PlotBed, Crop, AreaUnit } from '../../types';
import { convertSqmToUnit, getSensors } from '../../lib/farm-storage';

interface PlotModalProps {
  isOpen: boolean;
  mode: 'new' | 'edit';
  initialPlot?: PlotBed | null;
  crops: Crop[];
  unit: AreaUnit;
  remainingAreaInUnit: number;
  existingPlots: PlotBed[];
  onClose: () => void;
  onSave: (data: {
    id?: string;
    code: string;
    name: string;
    area: number;
    cropId: string | null;
    sensorNodeId: string;
  }) => void;
  onDelete?: (plotId: string) => void;
}

// Sanitize and deduplicate crop option labels (e.g. "Brinjal (Sarpan Kudachi 501) - 155d cycle")
export function formatCropOption(crop: Crop): string {
  const cropNameLower = (crop.name || '').toLowerCase().trim();
  let varietyClean = (crop.variety || '').trim();
  if (varietyClean.toLowerCase().startsWith(cropNameLower)) {
    varietyClean = varietyClean.substring(cropNameLower.length).trim().replace(/^[-:(\s]+|[-:)\s]+$/g, '');
  }
  return `${crop.name}${varietyClean ? ` (${varietyClean})` : ''} - ${crop.growthDurationDays}d cycle`;
}

// Smart auto-increment next plot code (e.g. S-01, S-02 -> S-03)
export function getNextPlotCode(plots: PlotBed[]): string {
  const numbers = plots.map(p => {
    const match = (p.code || '').match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  });
  const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
  const nextNum = maxNum + 1;
  return nextNum < 10 ? `S-0${nextNum}` : `S-${nextNum}`;
}

export const PlotModal: React.FC<PlotModalProps> = ({
  isOpen,
  mode,
  initialPlot,
  crops,
  unit,
  remainingAreaInUnit,
  existingPlots,
  onClose,
  onSave,
  onDelete
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [area, setArea] = useState<number | ''>('');
  const [cropId, setCropId] = useState<string>('');
  const [sensorNodeId, setSensorNodeId] = useState('NODE-01');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Registered IoT Node Options
  const nodeOptions = useMemo(() => {
    const defaultNodes = ['NODE-01', 'NODE-02', 'NODE-03', 'ESP32-MESH-ALPHA'];
    const registeredSensors = getSensors().map(s => s.assignedPlotCode ? `NODE-${s.assignedPlotCode}` : s.id);
    const set = new Set([...defaultNodes, ...registeredSensors]);
    return Array.from(set);
  }, [isOpen]);

  // Maximum allowed area for this plot
  const maxAvailableArea = mode === 'new'
    ? remainingAreaInUnit
    : remainingAreaInUnit + (initialPlot ? (initialPlot.area || convertSqmToUnit(initialPlot.areaSqm, unit)) : 0);

  useEffect(() => {
    if (!isOpen) {
      setConfirmDelete(false);
      setErrors({});
      return;
    }

    if (mode === 'edit' && initialPlot) {
      setCode(initialPlot.code || '');
      setName(initialPlot.name || '');
      const plotArea = initialPlot.area || convertSqmToUnit(initialPlot.areaSqm, unit);
      setArea(plotArea);
      setCropId(initialPlot.cropId || '');
      setSensorNodeId(initialPlot.sensorNodeId || initialPlot.sensorId || 'NODE-01');
    } else {
      const nextCode = getNextPlotCode(existingPlots);
      const nextNum = existingPlots.length + 1;
      setCode(nextCode);
      setName(`Bed #${nextNum} Cultivation Zone`);
      setArea(Math.min(maxAvailableArea, Math.max(1, +(maxAvailableArea / 2).toFixed(1))));
      setCropId(crops[0]?.id || '');
      setSensorNodeId(nodeOptions[existingPlots.length % nodeOptions.length] || 'NODE-01');
    }
    setErrors({});
    setConfirmDelete(false);
  }, [isOpen, mode, initialPlot, remainingAreaInUnit, existingPlots, crops, nodeOptions]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      errs.code = 'Plot Bed Code is required (e.g. S-01)';
    } else {
      const duplicate = existingPlots.find(
        p => p.code.toUpperCase() === cleanCode && (mode === 'new' || p.id !== initialPlot?.id)
      );
      if (duplicate) {
        errs.code = `Plot code "${cleanCode}" is already in use by another bed`;
      }
    }

    if (!name.trim()) {
      errs.name = 'Section Name is required';
    }

    if (area === '' || Number(area) <= 0) {
      errs.area = 'Allocated area must be greater than 0';
    } else if (Number(area) > maxAvailableArea + 0.001) {
      errs.area = `Area exceeds available unallocated land (${maxAvailableArea.toFixed(1)} ${unit})`;
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onSave({
      id: mode === 'edit' ? initialPlot?.id : undefined,
      code: cleanCode,
      name: name.trim(),
      area: Number(area),
      cropId: cropId === '' || cropId === 'fallow' ? null : cropId,
      sensorNodeId: sensorNodeId.trim().toUpperCase() || 'NODE-01'
    });
  };

  const handleDelete = () => {
    if (initialPlot && onDelete) {
      onDelete(initialPlot.id);
    }
  };

  const selectedCrop = crops.find(c => c.id === cropId);
  const currentAreaNum = typeof area === 'number' ? area : 0;
  const calculatedSqFt = (currentAreaNum * 43560).toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-sm ring-1 ring-emerald-600/30 shrink-0">
              <Layers className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {mode === 'new' ? 'New Plot Bed Allotment' : `Customize Section: ${initialPlot?.code}`}
              </h3>
              <p className="text-[11px] text-slate-400">
                {mode === 'new' ? 'Configure physical soil bed acreage & hardware' : 'Modify biophysical parameters or decommission'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Plot Bed Code */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Plot Bed Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. S-01, S-02"
                className={`w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border text-xs font-bold text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-emerald-800 transition-all ${
                  errors.code ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {errors.code && <p className="text-rose-600 text-[10px] font-bold mt-1">{errors.code}</p>}
            </div>

            {/* Allocated Area */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Allocated Area ({unit}) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-semibold text-slate-400">
                  Max: {maxAvailableArea.toFixed(1)} {unit}
                </span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max={maxAvailableArea}
                value={area}
                onChange={(e) => setArea(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 2.5"
                className={`w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800 transition-all ${
                  errors.area ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {/* Live Sq Ft Calculation */}
              <p className="text-[11px] text-emerald-800 font-bold mt-1">
                ↳ {calculatedSqFt} sq ft
              </p>
              {errors.area && <p className="text-rose-600 text-[10px] font-bold mt-0.5">{errors.area}</p>}
            </div>
          </div>

          {/* Section Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Section / Zone Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. North Greenhouse Bed #1"
              className={`w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800 transition-all ${
                errors.name ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            {errors.name && <p className="text-rose-600 text-[10px] font-bold mt-1">{errors.name}</p>}
          </div>

          {/* Assigned Cultivar (Deduplicated) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Assigned Crop Cultivar
            </label>
            <select
              value={cropId}
              onChange={(e) => setCropId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800 transition-all cursor-pointer"
            >
              <option value="fallow">-- Fallow / Unplanted Bed --</option>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {formatCropOption(c)}
                </option>
              ))}
            </select>
            {selectedCrop && (
              <div className="mt-1.5 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/80 text-[11px] text-emerald-900 space-y-0.5">
                <span className="font-bold block text-emerald-950">Cultivar Tolerances:</span>
                <p className="text-emerald-800">
                  Ideal Moisture: {selectedCrop.idealMoistureMin}% - {selectedCrop.idealMoistureMax}% &bull; Ideal Temp: {selectedCrop.idealTempMin}°C - {selectedCrop.idealTempMax}°C &bull; pH: {selectedCrop.idealPhMin} - {selectedCrop.idealPhMax}
                </p>
              </div>
            )}
          </div>

          {/* Paired IoT Hardware Node ID Dropdown */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
              <span>Paired IoT Gateway Node ID</span>
              <span className="text-[10px] font-semibold text-slate-400">Registered Telemetry Nodes</span>
            </label>
            <div className="relative">
              <Radio className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <select
                value={sensorNodeId}
                onChange={(e) => setSensorNodeId(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-emerald-800 transition-all cursor-pointer"
              >
                {nodeOptions.map(node => (
                  <option key={node} value={node}>
                    {node}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Decommission confirmation (if in edit mode) */}
          {mode === 'edit' && (
            <div className="pt-2 border-t border-slate-100">
              {confirmDelete ? (
                <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs space-y-2.5">
                  <div className="flex items-center space-x-2 text-rose-900 font-bold">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Confirm Plot Bed Decommissioning?</span>
                  </div>
                  <p className="text-[11px] text-rose-700 font-medium">
                    This will delete bed <strong className="font-bold">{initialPlot?.code}</strong> and return its {initialPlot?.area || convertSqmToUnit(initialPlot?.areaSqm || 0, unit)} {unit} ({((initialPlot?.area || convertSqmToUnit(initialPlot?.areaSqm || 0, unit)) * 43560).toLocaleString()} sq ft) to unallocated land.
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Yes, Decommission Bed
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3.5 py-1.5 bg-white text-slate-700 font-bold rounded-xl text-xs border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center space-x-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Decommission Plot Section</span>
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              {mode === 'new' ? 'Allot Plot Bed' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default PlotModal;
