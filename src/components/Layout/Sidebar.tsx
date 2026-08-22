import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Sprout, 
  History, 
  LineChart, 
  BrainCircuit, 
  Map, 
  Camera, 
  Activity, 
  Settings2, 
  GitCompare,
  Grid,
  Sliders,
  ChevronDown,
  ChevronRight,
  Leaf,
  FolderKanban,
  FileText,
  Users,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const primaryItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Crop Vision', path: '/vision', icon: Sprout },
  { name: 'Field Log', path: '/history', icon: History },
  { name: 'Analytics', path: '/analytics', icon: LineChart },
  { name: 'AI Advisor', path: '/advisor', icon: BrainCircuit },
  { name: 'Camera Feed', path: '/camera', icon: Camera },
  { name: 'My Sensors', path: '/sensors', icon: Activity },
  { name: 'Device Control', path: '/control', icon: Settings2 },
];

const farmManagementItems = [
  { name: 'Crops', path: '/farm-management/crops', icon: Sprout },
  { name: 'Field Audit Log', path: '/farm-management/audit-log', icon: FileText },
];

const advancedItems = [
  { name: 'What-If Simulator', path: '/what-if', icon: Sliders },
  { name: 'Crop Comparison', path: '/compare', icon: GitCompare },
  { name: 'Virtual Farm', path: '/virtual-farm', icon: Grid },
  { name: 'Map View', path: '/map', icon: Map },
];

export const Sidebar: React.FC = () => {
  const [farmMgmtOpen, setFarmMgmtOpen] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const { user, userProfile, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  const displayName = userProfile?.full_name || user?.displayName || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || userProfile?.email || '';
  const initial = (displayName.charAt(0) || 'U').toUpperCase();

  return (
    <div className="flex flex-col w-64 h-screen bg-white text-slate-700 border-r border-slate-200/80 shadow-xs z-20 select-none shrink-0">
      {/* Brand Logo */}
      <div className="flex items-center space-x-2.5 h-20 border-b border-slate-200/80 px-6 shrink-0">
        <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-sky-600 text-white shadow-sm">
          <Leaf className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 via-teal-700 to-sky-700">
            AgriTwin
          </h1>
          <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Digital Twin OS</p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`
              }
            >
              <Icon className="w-5 h-5 mr-3 shrink-0" />
              <span className="text-sm">{item.name}</span>
            </NavLink>
          );
        })}

        {/* Collapsible Farm Management */}
        <div className="pt-3 mt-3 border-t border-slate-200/80">
          <button
            onClick={() => setFarmMgmtOpen(!farmMgmtOpen)}
            className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-800 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-emerald-600" />
              <span>Farm Management</span>
            </span>
            {farmMgmtOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>

          {farmMgmtOpen && (
            <div className="mt-1 space-y-1 pl-2">
              {farmManagementItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 mr-2.5 shrink-0 text-emerald-600" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}

              {/* Admin-Only User Management Item */}
              {isAdmin && (
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold'
                        : 'text-indigo-700 hover:bg-indigo-50/60 font-medium'
                    }`
                  }
                >
                  <Users className="w-4 h-4 mr-2.5 shrink-0 text-indigo-600" />
                  <div className="flex items-center justify-between w-full">
                    <span>User Management</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded font-bold uppercase">
                      Admin
                    </span>
                  </div>
                </NavLink>
              )}
            </div>
          )}
        </div>

        {/* Collapsible Advanced Tools */}
        <div className="pt-3 mt-2 border-t border-slate-200/80">
          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-800 transition-colors cursor-pointer"
          >
            <span>Advanced Tools</span>
            {advancedOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>

          {advancedOpen && (
            <div className="mt-1 space-y-1 pl-2">
              {advancedItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 mr-2.5 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* User Profile Section at bottom */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/70 shrink-0">
        <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs mb-2">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate" title={displayName}>
                {displayName}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                    <Sprout className="w-2.5 h-2.5" />
                    Farmer
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0 ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[10px] text-slate-400 text-center font-medium">
          AgriTwin Platform &bull; Farm Management
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
