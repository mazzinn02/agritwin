import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Calendar,
  Filter,
  Download,
  Search,
  Building2,
  Sprout,
  Cpu,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronDown,
  RefreshCw,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { useAuth } from '../context/AuthContext';
import { FieldActivity, ActivitySeverity, ActivityEventType } from '../types';
import { exportActivityLog, exportTelemetry, exportAlerts } from '../lib/csv-exporter';

type TimeFilter = 'today' | 'yesterday' | '7days' | '30days' | 'all' | 'custom';

function getSeverityBadge(severity: ActivitySeverity) {
  switch (severity) {
    case 'critical':
      return { label: 'Critical', bg: 'bg-rose-100 text-rose-800 border-rose-200', icon: AlertCircle, dot: 'bg-rose-500' };
    case 'warning':
      return { label: 'Warning', bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: AlertCircle, dot: 'bg-amber-500' };
    case 'success':
      return { label: 'Success', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2, dot: 'bg-emerald-500' };
    case 'info':
    default:
      return { label: 'Info', bg: 'bg-blue-100 text-blue-800 border-blue-200', icon: Info, dot: 'bg-blue-500' };
  }
}

export const ActivityLog: React.FC = () => {
  const { fieldActivities, farmlands, plots, sensors, telemetryObservations, alerts } = useAgriStore();
  const { userProfile } = useAuth();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [farmFilter, setFarmFilter] = useState<string>('all');
  const [plotFilter, setPlotFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const [exportType, setExportType] = useState<'activity' | 'telemetry' | 'alerts'>('activity');
  // Date filtering logic
  const filteredActivities = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOf7Days = startOfToday - 7 * 24 * 60 * 60 * 1000;
    const startOf30Days = startOfToday - 30 * 24 * 60 * 60 * 1000;

    return fieldActivities.filter((act) => {
      const actTime = new Date(act.timestamp).getTime();

      // Time Filter
      if (timeFilter === 'today' && actTime < startOfToday) return false;
      if (timeFilter === 'yesterday' && (actTime < startOfYesterday || actTime >= startOfToday)) return false;
      if (timeFilter === '7days' && actTime < startOf7Days) return false;
      if (timeFilter === '30days' && actTime < startOf30Days) return false;
      if (timeFilter === 'custom') {
        if (customFrom && actTime < new Date(customFrom).getTime()) return false;
        if (customTo && actTime > new Date(customTo + 'T23:59:59').getTime()) return false;
      }

      // Farm Filter
      if (farmFilter !== 'all' && act.farmId !== farmFilter) return false;

      // Plot Filter
      if (plotFilter !== 'all' && act.plotId !== plotFilter) return false;

      // Severity Filter
      if (severityFilter !== 'all' && act.severity !== severityFilter) return false;

      // Type Filter
      if (typeFilter !== 'all' && act.eventType !== typeFilter) return false;

      // Search Filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = act.title.toLowerCase().includes(term);
        const matchesDesc = act.description.toLowerCase().includes(term);
        const matchesCreated = (act.createdBy || '').toLowerCase().includes(term);
        if (!matchesTitle && !matchesDesc && !matchesCreated) return false;
      }

      return true;
    });
  }, [fieldActivities, timeFilter, farmFilter, plotFilter, severityFilter, typeFilter, searchTerm, customFrom, customTo]);

  const handleExport = (format: 'csv' | 'excel') => {
    const filter = {
      farmId: farmFilter,
      plotId: plotFilter,
      severity: severityFilter as any,
      eventType: typeFilter as any,
      dateFrom: customFrom || undefined,
      dateTo: customTo || undefined,
      format,
    };

    if (exportType === 'activity') {
      exportActivityLog(filteredActivities, filter, userProfile?.full_name);
    } else if (exportType === 'telemetry') {
      exportTelemetry(telemetryObservations, filter, userProfile?.full_name);
    } else {
      exportAlerts(alerts, filter, userProfile?.full_name);
    }
  };
  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
              Field Activity Log &amp; Audit Trail
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black mt-2 tracking-tight">Farm Operations Timeline</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Complete historical audit trail of all sensor readings, telemetry arrivals, actuator cycles, alerts, and field operations.
          </p>
        </div>

        {/* Quick Export Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download CSV ({filteredActivities.length})
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Excel
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        {/* Time Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All History' },
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7days', label: 'Last 7 Days' },
            { id: '30days', label: 'Last 30 Days' },
            { id: 'custom', label: 'Custom Date' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeFilter(tab.id as TimeFilter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                timeFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range Picker */}
        {timeFilter === 'custom' && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>From:</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span>To:</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
        )}

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Farm Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Farm</label>
            <select
              value={farmFilter}
              onChange={(e) => setFarmFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Farms ({farmlands.length})</option>
              {farmlands.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
              <option value="success">Success</option>
            </select>
          </div>

          {/* Event Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Event Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Event Types</option>
              <option value="telemetry_update">Field Sensor Data</option>
              <option value="irrigation_triggered">Irrigation Pulses</option>
              <option value="hvac_triggered">Fan &amp; HVAC</option>
              <option value="alert_generated">Alerts</option>
              <option value="farm_created">Farm Added</option>
              <option value="plot_created">Plot Added</option>
              <option value="user_login">User Login</option>
              <option value="csv_export">CSV Export</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Search Keywords</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search activity..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Timeline List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            Field Events ({filteredActivities.length})
          </h2>
          <span className="text-xs text-slate-400">Chronological activity timeline</span>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No activity records matching your current filter.
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-emerald-500/20 space-y-4 my-2">
            {filteredActivities.map((act) => {
              const badge = getSeverityBadge(act.severity);
              const farm = farmlands.find((f) => f.id === act.farmId);
              const plot = plots.find((p) => p.id === act.plotId || p.code === act.plotId);
              const timeStr = new Date(act.timestamp).toLocaleString();

              return (
                <div key={act.id} className="relative group">
                  {/* Timeline bullet */}
                  <div className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${badge.dot}`} />

                  <div className="bg-slate-50/70 hover:bg-slate-50 rounded-2xl p-4 border border-slate-200 transition-all space-y-2">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        <h3 className="font-extrabold text-sm text-slate-900">{act.title}</h3>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">{timeStr}</span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{act.description}</p>

                    {/* Metadata strip */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 flex-wrap">
                      {farm && (
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Building2 className="w-3 h-3 text-emerald-600" /> {farm.name}
                        </span>
                      )}
                      {plot && (
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Sprout className="w-3 h-3 text-teal-600" /> {plot.name} ({plot.code})
                        </span>
                      )}
                      {act.sensorId && (
                        <span className="flex items-center gap-1 font-mono text-indigo-700 font-bold">
                          <Cpu className="w-3 h-3 text-indigo-500" /> {act.sensorId}
                        </span>
                      )}
                      {act.createdBy && (
                        <span className="text-slate-400 ml-auto">By: <strong className="text-slate-700">{act.createdBy}</strong></span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
