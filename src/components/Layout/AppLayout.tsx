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
    selectFarmland
  } = useAgriStore();

  const { userProfile, role, isAdmin } = useAuth();

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

      {/* Right: Quick Actions & Real User Auth Profile Badge */}
      <div className="flex flex-wrap items-center gap-2.5">
        {isAdmin && (
          <Link
            to="/manual-telemetry"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>+ Add Observation</span>
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
