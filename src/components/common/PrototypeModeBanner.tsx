import React from 'react';
import { Info, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAgriStore } from '../../context/AgriStore';

export const PrototypeModeBanner: React.FC = () => {
  const { isAdmin } = useAgriStore();

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-3 rounded-2xl border border-indigo-900/60 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30 shrink-0">
          <Info className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-900/80 px-2 py-0.5 rounded border border-indigo-700">
              PROTOTYPE MODE ACTIVE
            </span>
            <span className="text-xs font-bold text-slate-300">
              Physical IoT hardware sensors pending gateway connection.
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            System is executing on authoritative manually entered agricultural observations (<code className="text-indigo-300 font-mono text-[10px]">dataSource = "MANUAL_PROTOTYPE"</code>).
          </p>
        </div>
      </div>

      {isAdmin && (
        <Link
          to="/manual-telemetry"
          className="self-start sm:self-auto flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all shrink-0"
        >
          <span>Enter Observation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
};

export default PrototypeModeBanner;
