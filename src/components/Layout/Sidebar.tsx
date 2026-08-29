import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Sprout, 
  History, 
  LineChart, 
  Map, 
  Camera, 
  Activity, 
  GitCompare,
  Sliders,
  ChevronDown,
  ChevronRight,
  Leaf,
  FolderKanban,
  FileText,
  Users,
  LogOut,
  Building2,
  Radio,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { userProfile, role, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // Collapsible Accordions: Advanced & Administration
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800 shadow-2xl shrink-0 font-sans">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl shadow-md text-slate-950">
          <Leaf className="w-5 h-5 fill-current" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="font-black text-lg text-white tracking-wide">AgriTwin</span>
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950 border border-emerald-800 px-1.5 py-0.5 rounded">
              v2.5
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Digital Twin Architecture</p>
        </div>
      </div>

      {/* Navigation Container */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 text-xs font-medium">
        
        {/* ── TIER 1: SIMPLE OPERATIONS (DEFAULT VIEW) ───────────────────────── */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            OPERATIONS
          </div>

          {/* 1. Dashboard */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 font-bold ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-400" />
            <span className="text-sm">Dashboard</span>
          </NavLink>

          {/* 2. My Farms (Single entry - duplicate removed) */}
          <NavLink
            to="/my-farms"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 font-bold ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Building2 className="w-4 h-4 text-teal-400" />
            <span className="text-sm">My Farms</span>
          </NavLink>

          {/* 3. Crop Health & Advisor (Consolidated AI Advisor + Crop Vision + Live Farm Grid) */}
          <NavLink
            to="/vision"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 font-bold ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Sprout className="w-4 h-4 text-lime-400" />
            <span className="text-sm">Crop Health & Advisor</span>
          </NavLink>

          {/* 4. Field Log & Analytics */}
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 font-bold ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <LineChart className="w-4 h-4 text-amber-400" />
            <span className="text-sm">Records & Analytics</span>
          </NavLink>

          {/* 5. Device Control */}
          <NavLink
            to="/control"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 font-bold ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Activity className="w-4 h-4 text-sky-400" />
            <span className="text-sm">Device Control</span>
          </NavLink>
        </div>

        {/* ── TIER 2: ADVANCED / RESEARCH & DIGITAL TWIN (COLLAPSIBLE) ─────────── */}
        <div className="border-t border-slate-800/80 pt-3">
          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest hover:text-slate-200 transition-colors"
          >
            <span>ADVANCED & DIGITAL TWIN</span>
            {advancedOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {advancedOpen && (
            <div className="mt-1 space-y-1 pl-1 animate-fadeIn">
              <NavLink
                to="/research"
                className={({ isActive }) =>
                  `flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Database className="w-4 h-4 text-purple-400" />
                <span>Research Workspace</span>
              </NavLink>

              <NavLink
                to="/map"
                className={({ isActive }) =>
                  `flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Map className="w-4 h-4 text-purple-400" />
                <span>Map View</span>
              </NavLink>

              <NavLink
                to="/compare"
                className={({ isActive }) =>
                  `flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <GitCompare className="w-4 h-4 text-purple-400" />
                <span>Crop Comparison</span>
              </NavLink>

              <NavLink
                to="/what-if"
                className={({ isActive }) =>
                  `flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>What-If Simulator</span>
              </NavLink>

              <NavLink
                to="/camera"
                className={({ isActive }) =>
                  `flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Camera className="w-4 h-4 text-purple-400" />
                <span>Camera Feed</span>
              </NavLink>

              <NavLink
                to="/sensors"
                className={({ isActive }) =>
                  `flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Radio className="w-4 h-4 text-purple-400" />
                <span>My Sensors (Detailed)</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* ── TIER 3: SYSTEM / ADMINISTRATION (ADMIN ROLE ONLY) ───────────────── */}
        {isAdmin && (
          <div className="border-t border-slate-800/80 pt-3">
            <button
              onClick={() => setAdminOpen(!adminOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest hover:text-slate-200 transition-colors"
            >
              <span>ADMINISTRATION</span>
              {adminOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {adminOpen && (
              <div className="mt-1 space-y-1 pl-1 animate-fadeIn">
                {/* System Diagnostics (renamed from DB & Realtime, admin-only) */}
                <NavLink
                  to="/db-monitor"
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                      isActive ? 'bg-indigo-900/60 text-indigo-300 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span>System Diagnostics</span>
                </NavLink>

                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                      isActive ? 'bg-indigo-900/60 text-indigo-300 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>User Management</span>
                </NavLink>

                <NavLink
                  to="/farm-management/crops"
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                      isActive ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <FolderKanban className="w-4 h-4 text-indigo-400" />
                  <span>Plots & Crop Config</span>
                </NavLink>

                <NavLink
                  to="/farm-management/audit-log"
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                      isActive ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Field Audit Log</span>
                </NavLink>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-sm text-emerald-400 shrink-0">
            {userProfile?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="truncate">
            <span className="text-xs font-bold text-white block truncate">{userProfile?.full_name || 'System User'}</span>
            <span className="text-[10px] font-black uppercase text-emerald-400 block tracking-wider">{role || 'farmer'}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
