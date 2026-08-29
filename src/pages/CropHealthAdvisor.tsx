import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sprout, BrainCircuit, Grid, Leaf } from 'lucide-react';
import CropVision from './CropVision';
import AIAdvisor from './AIAdvisor';
import VirtualFarmView from '../components/virtual-farm/VirtualFarmView';

export const CropHealthAdvisor: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Tab state derived from URL pathname
  const [activeTab, setActiveTab] = useState<'health' | 'advisor' | 'live'>('health');

  useEffect(() => {
    if (location.pathname.includes('/advisor')) {
      setActiveTab('advisor');
    } else if (location.pathname.includes('/virtual-farm')) {
      setActiveTab('live');
    } else {
      setActiveTab('health');
    }
  }, [location.pathname]);

  const handleTabChange = (tab: 'health' | 'advisor' | 'live') => {
    setActiveTab(tab);
    if (tab === 'advisor') navigate('/advisor');
    else if (tab === 'live') navigate('/virtual-farm');
    else navigate('/vision');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ── Consolidated Header with Sub-Tabs ───────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900">Crop Intelligence & Advisor</h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Tier 1 Operational Suite
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidated plant health scanning, AI agronomic recommendations, and live field canopy grid.
            </p>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shrink-0">
          <button
            onClick={() => handleTabChange('health')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'health'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sprout className="w-4 h-4 text-emerald-500" />
            <span>Crop Health & Vision</span>
          </button>

          <button
            onClick={() => handleTabChange('advisor')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'advisor'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BrainCircuit className="w-4 h-4 text-indigo-500" />
            <span>AI Advisor</span>
          </button>

          <button
            onClick={() => handleTabChange('live')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'live'
                ? 'bg-white text-teal-700 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Grid className="w-4 h-4 text-teal-500" />
            <span>Live Farm Grid</span>
          </button>
        </div>
      </div>

      {/* ── Active Tab Content ─────────────────────────────────────────────────── */}
      <div>
        {activeTab === 'health' && <CropVision />}
        {activeTab === 'advisor' && <AIAdvisor />}
        {activeTab === 'live' && <VirtualFarmView />}
      </div>
    </div>
  );
};

export default CropHealthAdvisor;
