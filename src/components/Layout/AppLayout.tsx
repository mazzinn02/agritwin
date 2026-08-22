import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ref, onValue, set } from '../../lib/firebase';
import { db } from '../../lib/firebase';
import { RefreshCw, Cpu, Sprout, Microscope, Sparkles } from 'lucide-react';
import { useUserMode } from '../../context/UserModeContext';

const EdgeStatusHeader: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const { mode, setMode, isFarmer } = useUserMode();

  useEffect(() => {
    const statusRef = ref(db, 'system_status');
    const unsubscribe = onValue(statusRef, (snap) => {
      if (snap.exists()) {
        setStatus(snap.val());
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleEdgeStatus = async () => {
    const curr = status || { edge_online: true, offline_buffer_count: 0, last_cloud_sync: Date.now() };
    const isOnline = !curr.edge_online;
    await set(ref(db, 'system_status'), {
      ...curr,
      edge_online: isOnline,
      offline_buffer_count: isOnline ? 0 : 47,
      last_cloud_sync: Date.now()
    });
  };

  const isOnline = status?.edge_online ?? true;

  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
      
      {/* Left: Edge Gateway Status */}
      <div className="flex items-center space-x-2.5">
        <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg border border-sky-200">
          <Cpu className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Gateway #1 (Greenhouse Alpha)</span>
        <span className="text-slate-300">•</span>
        <div className={`flex items-center px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${
          isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          <span className={`w-2 h-2 rounded-full mr-1.5 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'}`} />
          {isOnline ? 'Live Sync (2s)' : `Buffered (${status?.offline_buffer_count ?? 47})`}
        </div>
      </div>

      {/* Center/Right: Dual UX View Switcher (Farmer Mode vs Agronomist Mode) & Simulate Offline */}
      <div className="flex items-center space-x-3">
        
        {/* Dual Mode Switcher Pill */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setMode('farmer')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              isFarmer
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>Farmer Mode</span>
          </button>

          <button
            onClick={() => setMode('agronomist')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              !isFarmer
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Microscope className="w-3.5 h-3.5" />
            <span>Agronomist Mode</span>
          </button>
        </div>

        <button
          onClick={toggleEdgeStatus}
          title="Toggle edge connection state"
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
          <span>{isOnline ? 'Simulate Offline' : 'Reconnect Cloud'}</span>
        </button>
      </div>
    </div>
  );
};

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 relative bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-6">
          <EdgeStatusHeader />
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
