import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { 
  Building2, 
  Layers, 
  PlusCircle, 
  UserCheck, 
  ShieldCheck, 
  Radio, 
  Sparkles, 
  User 
} from 'lucide-react';
import { useAgriStore } from '../../context/AgriStore';
import { useAuth } from '../../context/AuthContext';
import { DataSourceBadge } from '../common/DataSourceBadge';

const GlobalHeaderBar: React.FC = () => {
  const { 
    farmlands, 
    activeFarmland, 
    selectFarmland,
    isDemoTelemetryActive,
    toggleDemoTelemetry,
    triggerTelemetrySimulationNow
  } = useAgriStore();

  const { userProfile, role, isAdmin } = useAuth();
  const [isSimulating, setIsSimulating] = React.useState(false);

  const handleManualSimulate = async () => {
    setIsSimulating(true);
    await triggerTelemetrySimulationNow();
    setTimeout(() => setIsSimulating(false), 800);
  };

  return (
    <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
      {/* Left: Farm Selection Matrix & Data Mode */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Farm Selector */}
        <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
          <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-[11px] font-extrabold uppercase text-slate-400">Farm:</span>
          <select
            value={activeFarmland?.id || farmlands[0]?.id || ''}
            onChange={(e) => selectFarmland(e.target.value)}
            className="bg-transparent text-slate-900 text-xs font-black outline-none cursor-pointer"
          >
            {farmlands.map(f => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.totalArea} {f.unit})
              </option>
            ))}
          </select>
        </div>

        {/* Global Prototype Data Status Badge */}
        <DataSourceBadge source="MANUAL_PROTOTYPE" />
      </div>

      {/* Right: Simulator Controls, Quick Actions & User Profile */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Live Real-Time Telemetry Simulator Controls */}
        <div className="flex items-center space-x-1.5 bg-slate-900 text-white p-1 pl-3 rounded-xl border border-slate-800 shadow-xs text-xs font-bold">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${isDemoTelemetryActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-[11px] font-black text-slate-200">
              {isDemoTelemetryActive ? 'Realtime 12s Feed' : 'Simulator Paused'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => toggleDemoTelemetry(!isDemoTelemetryActive)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
              isDemoTelemetryActive
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {isDemoTelemetryActive ? 'PAUSE' : 'START STREAM'}
          </button>

          <button
            type="button"
            onClick={handleManualSimulate}
            disabled={isSimulating}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-[11px] transition-all flex items-center space-x-1 cursor-pointer disabled:opacity-50 shadow-xs"
            title="Generate new sensor reading batch now across all farms and plots"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Updating...' : '⚡ SIMULATE NOW'}</span>
          </button>
        </div>

        {isAdmin && (
          <Link
            to="/manual-telemetry"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>+ Add Obs</span>
          </Link>
        )}

        {isAdmin && (
          <Link
            to="/add-farmland"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Add Farm</span>
          </Link>
        )}

        {/* Real User Auth Role Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-2xs">
          <ShieldCheck className={`w-4 h-4 ${isAdmin ? 'text-indigo-600' : 'text-emerald-600'}`} />
          <span className="text-slate-800">{userProfile?.full_name || 'Authenticated User'}</span>
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
            isAdmin ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {role || 'farmer'}
          </span>
        </div>
      </div>
    </div>
  );
};

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-8 relative bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-6">
          <GlobalHeaderBar />
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
