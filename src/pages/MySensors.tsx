import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Plus, 
  Battery, 
  BatteryMedium, 
  BatteryLow, 
  BatteryCharging, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Cpu, 
  X, 
  Power, 
  Clock, 
  Activity, 
  ShieldCheck 
} from 'lucide-react';
import { IoTSensor, PlotBed } from '../types';
import { getSensors, getPlots, addSensor, toggleSensorStatus } from '../lib/farm-storage';

export const MySensors: React.FC = () => {
  const [sensors, setSensors] = useState<IoTSensor[]>([]);
  const [plots, setPlots] = useState<PlotBed[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [nodeName, setNodeName] = useState('');
  const [assignedPlot, setAssignedPlot] = useState('');
  const [sensorType, setSensorType] = useState('Multi-Soil & Canopy Node');
  const [batteryPct, setBatteryPct] = useState<number | ''>(100);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const reloadData = () => {
    setSensors(getSensors());
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

  const handleToggleStatus = (sensorId: string, nodeName: string) => {
    toggleSensorStatus(sensorId);
    showToast(`Sensor "${nodeName}" status toggled.`);
  };

  const openAddModal = () => {
    const nextNum = sensors.length + 1;
    setNodeName(`Node 0${nextNum} Hardware Array`);
    setAssignedPlot(plots[0]?.code || 'S-01');
    setSensorType('Multi-Soil & Canopy Node');
    setBatteryPct(100);
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!nodeName.trim()) errors.nodeName = 'Node name is required';
    if (!assignedPlot.trim()) errors.assignedPlot = 'Plot assignment is required';
    if (batteryPct === '' || Number(batteryPct) < 0 || Number(batteryPct) > 100) {
      errors.batteryPct = 'Battery must be between 0% and 100%';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const created = addSensor({
      nodeName: nodeName.trim(),
      assignedPlotCode: assignedPlot.trim().toUpperCase(),
      type: sensorType.trim(),
      batteryPct: Number(batteryPct),
      status: 'Online'
    });

    setIsAddModalOpen(false);
    showToast(`Node "${created.nodeName}" added successfully.`);
  };

  // Metrics
  const onlineCount = sensors.filter(s => s.status === 'Online').length;
  const avgBattery = sensors.length > 0 
    ? Math.round(sensors.reduce((acc, s) => acc + s.batteryPct, 0) / sensors.length)
    : 100;

  return (
    <div className="space-y-6 text-slate-800 font-sans pb-10">
      
      {/* ================= HEADER & TOP CONTROLS ================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-600/20 shrink-0">
            <Radio className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                IoT Edge Hardware Diagnostics
              </h1>
              <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {onlineCount} of {sensors.length} Online
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Real-time hardware battery telemetry, gateway connectivity, and assigned soil nodes
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Sensor Node</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= HARDWARE OVERVIEW STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Hardware Nodes</span>
            <Cpu className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{sensors.length}</div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Distributed across field beds</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Connectivity</span>
            <Wifi className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-800">{onlineCount} Active</div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            {sensors.length - onlineCount > 0 ? `${sensors.length - onlineCount} Standby/Offline` : '100% Network Uptime'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Battery Health</span>
            <BatteryMedium className="w-4 h-4 text-emerald-800" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{avgBattery}%</div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
            <div 
              className="bg-emerald-800 h-full rounded-full transition-all duration-500" 
              style={{ width: `${avgBattery}%` }}
            />
          </div>
        </div>
      </div>

      {/* ================= SENSOR NODE CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sensors.map((sensor) => {
          const isOnline = sensor.status === 'Online';
          const isLowBattery = sensor.batteryPct < 30;

          const dateObj = new Date(sensor.lastPing);
          const formattedPing = isNaN(dateObj.getTime())
            ? sensor.lastPing
            : dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          return (
            <div 
              key={sensor.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isOnline ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      <Radio className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{sensor.nodeName}</h3>
                      <span className="text-[11px] text-slate-500 font-medium font-mono">{sensor.id}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center space-x-1 ${
                    isOnline ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {isOnline ? <Wifi className="w-3 h-3 text-emerald-600 mr-1" /> : <WifiOff className="w-3 h-3 text-slate-400 mr-1" />}
                    <span>{sensor.status}</span>
                  </span>
                </div>

                {/* Node Details Grid */}
                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Assigned Bed:</span>
                    <span className="font-bold px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px]">
                      {sensor.assignedPlotCode}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Hardware Type:</span>
                    <span className="font-semibold text-slate-800">{sensor.type}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Last Node Ping:</span>
                    <span className="font-mono text-slate-700 text-[11px] flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400 inline mr-1" />
                      {formattedPing}
                    </span>
                  </div>

                  {/* Battery Health Bar */}
                  <div className="pt-1">
                    <div className="flex justify-between items-center text-[11px] font-bold mb-1">
                      <span className="text-slate-600 flex items-center space-x-1">
                        <Battery className="w-3.5 h-3.5 text-slate-500 inline mr-1" />
                        <span>Battery Level</span>
                      </span>
                      <span className={isLowBattery ? 'text-rose-600' : 'text-emerald-800'}>
                        {sensor.batteryPct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          isLowBattery ? 'bg-rose-500' : 'bg-emerald-800'
                        }`}
                        style={{ width: `${sensor.batteryPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button: Status Toggle */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleToggleStatus(sensor.id, sensor.nodeName)}
                  className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    isOnline 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' 
                      : 'bg-emerald-800 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isOnline ? 'Set to Standby / Offline' : 'Activate Sensor Online'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= ADD SENSOR MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-emerald-100">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Register Hardware Node</h3>
                  <p className="text-[11px] text-slate-400">Add an edge sensor to the IoT network</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              
              {/* Node Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Node Identifier / Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value)}
                  placeholder="e.g. Node 03 Hardware Array"
                  className={`w-full px-3 py-2 bg-slate-50 rounded-xl border text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800 ${
                    formErrors.nodeName ? 'border-rose-400' : 'border-slate-200'
                  }`}
                />
                {formErrors.nodeName && <p className="text-rose-600 text-[10px] mt-0.5">{formErrors.nodeName}</p>}
              </div>

              {/* Assigned Plot */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Assigned Plot Bed <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assignedPlot}
                  onChange={(e) => setAssignedPlot(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800"
                >
                  {plots.map(p => (
                    <option key={p.id} value={p.code}>
                      {p.code} ({p.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sensor Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Sensor Hardware Specification
                </label>
                <select
                  value={sensorType}
                  onChange={(e) => setSensorType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800"
                >
                  <option value="Multi-Soil & Canopy Node">Multi-Soil & Canopy Node (Moisture + Temp + pH)</option>
                  <option value="Microclimate & Root Array">Microclimate & Root Array</option>
                  <option value="PAR Light & Solar Array">PAR Light & Solar Array</option>
                  <option value="Substrate NPK & pH Probe">Substrate NPK & pH Probe</option>
                </select>
              </div>

              {/* Battery Level */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Initial Battery Charge (%) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={batteryPct}
                  onChange={(e) => setBatteryPct(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 100"
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                >
                  Register Node
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MySensors;
