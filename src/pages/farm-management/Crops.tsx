import React, { useState } from 'react';
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
import { Crop } from '../../types';
import { useAgriStore } from '../../context/AgriStore';

export const Crops: React.FC = () => {
  const { crops, addCrop, updateCrop, deleteCrop, activeSections } = useAgriStore();
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
  const [formGddBase, setFormGddBase] = useState<number | ''>(10);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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
    setFormGddBase(10);
    setFormErrors({});
    setEditingCrop(null);
    setModalMode('add');
  };

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
    setFormGddBase(crop.gddBaseTemp ?? 10);
    setFormErrors({});
    setEditingCrop(crop);
    setModalMode('edit');
  };

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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name: formName.trim(),
      variety: formVariety.trim(),
      growthDurationDays: Number(formDuration),
      waterRequirementLpd: Number(formWater),
      idealMoistureMin: Number(formMoistureMin),
      idealMoistureMax: Number(formMoistureMax),
      idealTempMin: Number(formTempMin),
      idealTempMax: Number(formTempMax),
      idealPhMin: Number(formPhMin),
      idealPhMax: Number(formPhMax),
      gddBaseTemp: Number(formGddBase) || 10
    };

    if (modalMode === 'add') {
      const created = addCrop(payload);
      showToast(`Added cultivar '${created.name} (${created.variety})' to Crop Library.`);
    } else if (modalMode === 'edit' && editingCrop) {
      updateCrop({
        ...editingCrop,
        ...payload
      });
      showToast(`Updated '${editingCrop.name} (${editingCrop.variety})' biophysical thresholds.`);
    }

    setModalMode(null);
  };

  const confirmDeleteCrop = () => {
    if (!cropToDelete) return;
    deleteCrop(cropToDelete.id);
    showToast(`Deleted crop cultivar '${cropToDelete.name}'. Assigned sections reverted to Fallow.`);
    setCropToDelete(null);
  };

  const filteredCrops = crops.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.variety.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-800 pb-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Crop Cultivar Library</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage agronomic cultivars, growth cycles, and GDD biophysical thresholds across the digital twin.
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Cultivar</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by crop name or variety..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-xs"
        />
      </div>

      {/* Crops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCrops.map(crop => {
          const activeSectionsCount = activeSections.filter(s => s.cropId === crop.id).length;

          return (
            <div key={crop.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 hover:border-emerald-200 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    {crop.variety}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">{crop.name}</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(crop)}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCropToDelete(crop)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Threshold Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-medium">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Cycle & GDD Base</span>
                  <span className="font-bold text-slate-800">{crop.growthDurationDays} Days ({crop.gddBaseTemp || 10}°C Base)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Water Requirement</span>
                  <span className="font-bold text-slate-800">{crop.waterRequirementLpd} L/day</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Ideal Moisture</span>
                  <span className="font-bold text-sky-700">{crop.idealMoistureMin}%–{crop.idealMoistureMax}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Ideal Temp Range</span>
                  <span className="font-bold text-amber-700">{crop.idealTempMin}°C–{crop.idealTempMax}°C</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Assigned Sections:</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {activeSectionsCount} Sections
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Crop Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative">
            <button
              onClick={() => setModalMode(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {modalMode === 'add' ? 'Add Crop Cultivar' : `Edit ${editingCrop?.name}`}
                </h3>
                <p className="text-xs text-slate-500">Configure agronomic limits for biophysical evaluations</p>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Crop Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tomato"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cultivar / Variety *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarpan F1-STH-520"
                    value={formVariety}
                    onChange={e => setFormVariety(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cycle (Days)</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={e => setFormDuration(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Water (L/day)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formWater}
                    onChange={e => setFormWater(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">GDD Base (°C)</label>
                  <input
                    type="number"
                    value={formGddBase}
                    onChange={e => setFormGddBase(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Min Soil Moisture (%)</label>
                  <input
                    type="number"
                    value={formMoistureMin}
                    onChange={e => setFormMoistureMin(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Max Soil Moisture (%)</label>
                  <input
                    type="number"
                    value={formMoistureMax}
                    onChange={e => setFormMoistureMax(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Min Air Temp (°C)</label>
                  <input
                    type="number"
                    value={formTempMin}
                    onChange={e => setFormTempMin(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Max Air Temp (°C)</label>
                  <input
                    type="number"
                    value={formTempMax}
                    onChange={e => setFormTempMax(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  {modalMode === 'add' ? 'Save Cultivar' : 'Update Thresholds'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {cropToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Delete Crop Cultivar?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-900">{cropToDelete.name} ({cropToDelete.variety})</strong>? Any assigned farmland sections will revert to Fallow.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setCropToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCrop}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Delete Cultivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Crops;
