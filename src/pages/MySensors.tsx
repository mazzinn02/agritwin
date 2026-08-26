import React, { useState } from 'react';
import { 
  Radio, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Cpu, 
  X, 
  Power, 
  Clock, 
  Activity, 
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { PrototypeModeBanner } from '../components/common/PrototypeModeBanner';

export const MySensors: React.FC = () => {
  const { activeSections: plots, activeFarmland } = useAgriStore();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-800 pb-10">
      <PrototypeModeBanner />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">Sensors & Hardware Nodes</h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                MANUAL DATA SOURCE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Registered telemetry nodes assigned to section plot beds in {activeFarmland?.name || 'Farm'}.
            </p>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-950 text-emerald-300 rounded-2xl border border-emerald-800 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sensor Node Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plots.map(plot => (
          <div key={plot.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Node: {plot.sensorNodeId || 'NODE-01'}</span>
                  <h3 className="text-base font-black text-slate-900 mt-0.5">{plot.code}: {plot.name}</h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                  CONFIGURED
                </span>
              </div>

              <div className="space-y-2 mt-4 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-semibold">Connection Status:</span>
                  <span className="font-extrabold text-amber-700">NO LIVE CONNECTION</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-semibold">Primary Source:</span>
                  <span className="font-extrabold text-indigo-700">MANUAL PROTOTYPE</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-semibold">Assigned Section Area:</span>
                  <span className="font-bold text-slate-900">{plot.area} Acres</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 font-medium flex items-center justify-between">
              <span>Prototype Hardware Ready</span>
              <DataSourceBadge source="MANUAL_PROTOTYPE" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MySensors;
