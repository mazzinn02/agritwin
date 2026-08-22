import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Droplets, 
  Thermometer, 
  Calendar, 
  Gauge, 
  Layers, 
  Sparkles,
  Info
} from 'lucide-react';
import { Crop, PlotBed } from '../../types';
import { getCrops, getPlots, addCrop, updateCrop, deleteCrop } from '../../lib/farm-storage';

export const Crops: React.FC = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [plots, setPlots] = useState<PlotBed[]>([]);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [cropToDelete, setCropToDelete] = useState<Crop | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formVariety, setFormVariety] = useState('');
  const [formDuration, setFormDuration] = useState<number | ''>(90);
  const [formWater, setFormWater] = useState<number | ''>(4.5);
  const [formMoistureMin, setFormMoistureMin] = useState<number | ''>(55);
  const [formMoistureMax, setFormMoistureMax] = useState<number | ''>(75);
  const [formTempMin, setFormTempMin] = useState<number | ''>(20);
  const [formTempMax, setFormTempMax] = useState<number | ''>(28);
  const [formPhMin, setFormPhMin] = useState<number | ''>(6.0);
  const [formPhMax, setFormPhMax] = useState<number | ''>(6.8);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const reloadData = () => {
    setCrops(getCrops());
    setPlots(getPlots());
  };

  useEffect(() => {
    reloadData();

    const handleStorageUpdate = () => {
      reloadData();
    };

    window.addEventListener('agri_storage_updated', handleStorageUpdate);
    return () => window.removeEventListener('agri_storage_updated', handleStorageUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormName('');
    setFormVariety('');
    setFormDuration(90);
    setFormWater(4.5);
    setFormMoistureMin(55);
    setFormMoistureMax(75);
    setFormTempMin(20);
    setFormTempMax(28);
    setFormPhMin(6.0);
    setFormPhMax(6.8);
    setFormErrors({});
    setEditingCrop(null);
    setModalMode('add');
  };

  // Open Edit Modal
  const openEditModal = (crop: Crop) => {
    setFormName(crop.name);
    setFormVariety(crop.variety);
    setFormDuration(crop.growthDurationDays);
    setFormWater(crop.waterRequirementLpd);
    setFormMoistureMin(crop.idealMoistureMin);
    setFormMoistureMax(crop.idealMoistureMax);
    setFormTempMin(crop.idealTempMin);
    setFormTempMax(crop.idealTempMax);
    setFormPhMin(crop.idealPhMin);
    setFormPhMax(crop.idealPhMax);
    setFormErrors({});
    setEditingCrop(crop);
    setModalMode('edit');
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = 'Crop name is required';
    if (!formVariety.trim()) errors.variety = 'Cultivar / Variety is required';
    if (formDuration === '' || Number(formDuration) <= 0) errors.duration = 'Duration must be > 0 days';
    if (formWater === '' || Number(formWater) < 0) errors.water = 'Water requirement must be >= 0 L/day';
    
    const minMoist = Number(formMoistureMin);
    const maxMoist = Number(formMoistureMax);
    if (formMoistureMin === '' || minMoist < 0 || minMoist > 100) errors.moisture = 'Moisture must be between 0-100%';
    if (formMoistureMax === '' || maxMoist < 0 || maxMoist > 100) errors.moisture = 'Moisture must be between 0-100%';
    if (formMoistureMin !== '' && formMoistureMax !== '' && minMoist > maxMoist) {
      errors.moisture = 'Min moisture cannot exceed Max moisture';
    }

    const minTemp = Number(formTempMin);
    const maxTemp = Number(formTempMax);
    if (formTempMin === '' || formTempMax === '' || minTemp > maxTemp) {
      errors.temp = 'Invalid temperature boundary';
    }

    const minPh = Number(formPhMin);
    const maxPh = Number(formPhMax);
    if (formPhMin === '' || formPhMax === '' || minPh < 0 || maxPh > 14 || minPh > maxPh) {
      errors.ph = 'pH must be between 0 and 14';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (modalMode === 'add') {
      const created = addCrop({
        name: formName.trim(),
        variety: formVariety.trim(),
        growthDurationDays: Number(formDuration),
        waterRequirementLpd: Number(formWater),
        idealMoistureMin: Number(formMoistureMin),
        idealMoistureMax: Number(formMoistureMax),
        idealTempMin: Number(formTempMin),
        idealTempMax: Number(formTempMax),
        idealPhMin: Number(formPhMin),
        idealPhMax: Number(formPhMax)
      });
      setModalMode(null);
      showToast(`Crop "${created.name} (${created.variety})" registered successfully!`);
    } else if (modalMode === 'edit' && editingCrop) {
      const updated: Crop = {
        ...editingCrop,
        name: formName.trim(),
        variety: formVariety.trim(),
        growthDurationDays: Number(formDuration),
        waterRequirementLpd: Number(formWater),
        idealMoistureMin: Number(formMoistureMin),
        idealMoistureMax: Number(formMoistureMax),
        idealTempMin: Number(formTempMin),
        idealTempMax: Number(formTempMax),
        idealPhMin: Number(formPhMin),
        idealPhMax: Number(formPhMax)
      };
      updateCrop(updated);
      setModalMode(null);
      showToast(`Crop "${updated.name}" updated successfully!`);
    }
  };

  // Handle Delete Confirmation
  const confirmDelete = () => {
    if (!cropToDelete) return;
    const deletedName = cropToDelete.name;
    deleteCrop(cropToDelete.id);
    setCropToDelete(null);
    showToast(`Crop "${deletedName}" deleted and safely unbound from any assigned plots.`);
  };

  const filteredCrops = crops.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.variety.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-800 font-sans pb-10">
      
      {/* ================= HEADER & CRUD CONTROLS ================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-600/20 shrink-0">
            <Sprout className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Crop & Cultivar Library
              </h1>
              <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {crops.length} Registered
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage vegetative parameters, biophysical thresholds, and water requirements
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Crop</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= SEARCH & FILTER BAR ================= */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search crop name or variety (e.g. Tomato, Sarpan)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800 transition-all"
          />
        </div>
      </div>

      {/* ================= CROPS DATA TABLE ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Crop & Cultivar</th>
                <th className="px-4 py-3.5">Growth Cycle</th>
                <th className="px-4 py-3.5">Water Requirement</th>
                <th className="px-4 py-3.5">Ideal Soil Moisture</th>
                <th className="px-4 py-3.5">Optimal Temp</th>
                <th className="px-4 py-3.5">Soil pH</th>
                <th className="px-4 py-3.5">Assigned Beds</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredCrops.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    No crops found matching your search. Click "+ Add New Crop" to register one.
                  </td>
                </tr>
              ) : (
                filteredCrops.map((crop) => {
                  const assignedPlotCodes = plots
                    .filter(p => p.cropId === crop.id)
                    .map(p => p.code);

                  return (
                    <tr key={crop.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Crop Name & Variety */}
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold">
                            <Sprout className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{crop.name}</div>
                            <div className="text-[11px] text-slate-500 font-medium">{crop.variety}</div>
                          </div>
                        </div>
                      </td>

                      {/* Growth Cycle */}
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-1.5 font-semibold text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{crop.growthDurationDays} days</span>
                        </div>
                      </td>

                      {/* Water Req */}
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-1.5 font-semibold text-slate-700">
                          <Droplets className="w-3.5 h-3.5 text-sky-600" />
                          <span>{crop.waterRequirementLpd} L/day</span>
                        </div>
                      </td>

                      {/* Soil Moisture */}
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 font-semibold border border-sky-200 text-[11px]">
                          {crop.idealMoistureMin}% - {crop.idealMoistureMax}%
                        </span>
                      </td>

                      {/* Optimal Temp */}
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-semibold border border-rose-200 text-[11px]">
                          {crop.idealTempMin}°C - {crop.idealTempMax}°C
                        </span>
                      </td>

                      {/* Soil pH */}
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 text-[11px]">
                          {crop.idealPhMin} - {crop.idealPhMax}
                        </span>
                      </td>

                      {/* Assigned Beds */}
                      <td className="px-4 py-4">
                        {assignedPlotCodes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedPlotCodes.map(code => (
                              <span key={code} className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold">
                                {code}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => openEditModal(crop)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            title="Edit Crop"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setCropToDelete(crop)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Delete Crop"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ADD / EDIT CROP MODAL ================= */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-emerald-100">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {modalMode === 'add' ? 'Register New Crop Variety' : `Edit Crop: ${editingCrop?.name}`}
                  </h3>
                  <p className="text-[11px] text-slate-400">Biophysical parameters for digital twin simulation</p>
                </div>
              </div>
              <button 
                onClick={() => setModalMode(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                {/* Crop Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Crop Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Tomato, Spinach"
                    className={`w-full px-3 py-2 bg-slate-50 rounded-xl border text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800 ${
                      formErrors.name ? 'border-rose-400' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.name && <p className="text-rose-600 text-[10px] mt-0.5">{formErrors.name}</p>}
                </div>

                {/* Variety */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Cultivar / Variety <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formVariety}
                    onChange={(e) => setFormVariety(e.target.value)}
                    placeholder="e.g. Sarpan F1-STH-520"
                    className={`w-full px-3 py-2 bg-slate-50 rounded-xl border text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800 ${
                      formErrors.variety ? 'border-rose-400' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.variety && <p className="text-rose-600 text-[10px] mt-0.5">{formErrors.variety}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Growth Duration */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Growth Duration (Days) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 90"
                    className={`w-full px-3 py-2 bg-slate-50 rounded-xl border text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800 ${
                      formErrors.duration ? 'border-rose-400' : 'border-slate-200'
                    }`}
                  />
                </div>

                {/* Water Requirement */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Water Need (L/day) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formWater}
                    onChange={(e) => setFormWater(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 4.5"
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800"
                  />
                </div>
              </div>

              {/* Moisture Min/Max */}
              <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-100 space-y-2">
                <div className="flex items-center space-x-1.5 text-sky-900 font-bold text-xs">
                  <Droplets className="w-3.5 h-3.5 text-sky-600" />
                  <span>Ideal Soil Moisture Boundaries (%)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Min Moisture (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formMoistureMin}
                      onChange={(e) => setFormMoistureMin(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-medium text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Max Moisture (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formMoistureMax}
                      onChange={(e) => setFormMoistureMax(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-medium text-slate-900"
                    />
                  </div>
                </div>
                {formErrors.moisture && <p className="text-rose-600 text-[10px]">{formErrors.moisture}</p>}
              </div>

              {/* Temperature & pH */}
              <div className="grid grid-cols-2 gap-3">
                {/* Temp */}
                <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-100 space-y-2">
                  <div className="flex items-center space-x-1.5 text-rose-900 font-bold text-xs">
                    <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                    <span>Ideal Temp (°C)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={formTempMin}
                      onChange={(e) => setFormTempMin(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Min"
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-medium text-slate-900"
                    />
                    <input
                      type="number"
                      value={formTempMax}
                      onChange={(e) => setFormTempMax(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Max"
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-medium text-slate-900"
                    />
                  </div>
                </div>

                {/* pH */}
                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-2">
                  <div className="flex items-center space-x-1.5 text-emerald-900 font-bold text-xs">
                    <Gauge className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Ideal Soil pH</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={formPhMin}
                      onChange={(e) => setFormPhMin(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Min"
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-medium text-slate-900"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={formPhMax}
                      onChange={(e) => setFormPhMax(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Max"
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-medium text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  {modalMode === 'add' ? 'Save Crop Variety' : 'Update Crop Variety'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {cropToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Crop Variety</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">{cropToDelete.name} ({cropToDelete.variety})</strong>? 
              Any plot beds assigned to this crop will automatically revert to <span className="font-semibold text-slate-800">Fallow</span> state.
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setCropToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Crops;
