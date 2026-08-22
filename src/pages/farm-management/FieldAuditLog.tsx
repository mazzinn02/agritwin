import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Droplets, 
  Wind, 
  Sun, 
  StickyNote, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Layers, 
  Zap, 
  Plus, 
  X,
  Radio,
  User,
  Bot
} from 'lucide-react';
import { ref, onValue, push } from '../../lib/firebase';
import { db } from '../../lib/firebase';
import { FieldAuditLogEntry, logFieldAction } from '../../lib/audit-log';
import { getPlots } from '../../lib/farm-storage';
import { PlotBed } from '../../types';

export const FieldAuditLog: React.FC = () => {
  const [logs, setLogs] = useState<FieldAuditLogEntry[]>([]);
  const [plots, setPlots] = useState<PlotBed[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedPlot, setSelectedPlot] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedTrigger, setSelectedTrigger] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Note Modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [notePlotId, setNotePlotId] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const reloadPlots = () => {
    const loadedPlots = getPlots();
    setPlots(loadedPlots);
    if (loadedPlots.length > 0 && !notePlotId) {
      setNotePlotId(loadedPlots[0].code);
    }
  };

  useEffect(() => {
    reloadPlots();

    const loadLocalLogs = () => {
      try {
        const raw = localStorage.getItem('agri_field_audit_log');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLogs(parsed);
            setLoading(false);
          }
        }
      } catch (e) {}
    };

    loadLocalLogs();

    const auditRef = ref(db, 'field_audit_log');
    const unsubscribe = onValue(auditRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const entries: FieldAuditLogEntry[] = Object.entries(val).map(([k, v]: [string, any]) => ({
          id: k,
          ...v
        })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setLogs(entries);
      } else {
        loadLocalLogs();
      }
      setLoading(false);
    });

    const handleStorageUpdate = () => {
      reloadPlots();
      loadLocalLogs();
    };

    window.addEventListener('agri_storage_updated', handleStorageUpdate);
    window.addEventListener('agri_audit_logged', handleStorageUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('agri_storage_updated', handleStorageUpdate);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered entries
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedPlot !== 'ALL' && log.plot_id !== selectedPlot) return false;
      if (selectedAction !== 'ALL' && log.action_type !== selectedAction) return false;
      if (selectedTrigger !== 'ALL' && log.triggered_by !== selectedTrigger) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDetails = (log.details || '').toLowerCase().includes(q);
        const matchesPlot = (log.plot_id || '').toLowerCase().includes(q);
        if (!matchesDetails && !matchesPlot) return false;
      }
      return true;
    });
  }, [logs, selectedPlot, selectedAction, selectedTrigger, searchQuery]);

  // Handle CSV Export
  const handleExportCSV = () => {
    const records = filteredLogs.length > 0 ? filteredLogs : logs;
    const headers = ['Log ID', 'Timestamp (ISO)', 'Plot ID', 'Action Type', 'Triggered By', 'Details'];
    const rows = records.map((l) => [
      l.id || '',
      `"${l.timestamp}"`,
      `"${l.plot_id}"`,
      `"${l.action_type}"`,
      `"${l.triggered_by}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agritwin_field_audit_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Field Audit Log exported to CSV.');
  };

  // Add Manual Agronomist Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    await logFieldAction(
      notePlotId,
      'manual_note',
      'manual',
      noteContent.trim()
    );

    setIsNoteModalOpen(false);
    setNoteContent('');
    showToast('Agronomic audit note added.');
  };

  const getActionBadge = (type: FieldAuditLogEntry['action_type']) => {
    switch (type) {
      case 'irrigation':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
            <Droplets className="w-3 h-3 mr-1 text-sky-600" />
            Irrigation Actuation
          </span>
        );
      case 'hvac':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Wind className="w-3 h-3 mr-1 text-emerald-600" />
            HVAC / Fan
          </span>
        );
      case 'grow_light':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Sun className="w-3 h-3 mr-1 text-amber-600" />
            Grow Lighting
          </span>
        );
      case 'manual_note':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <StickyNote className="w-3 h-3 mr-1 text-purple-600" />
            Agronomic Note
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans pb-10">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-600/20 shrink-0">
            <FileText className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Field Actuation Audit Log
              </h1>
              <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                {filteredLogs.length} Entries
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Complete verifiable ledger of physical device triggers, closed-loop actions, and farmer interventions
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsNoteModalOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Audit Note</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3">
        
        {/* Plot Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
            Plot Bed
          </label>
          <select
            value={selectedPlot}
            onChange={(e) => setSelectedPlot(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800"
          >
            <option value="ALL">All Plots</option>
            {plots.map(p => (
              <option key={p.id} value={p.code}>{p.code}: {p.name}</option>
            ))}
          </select>
        </div>

        {/* Action Type Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
            Action Type
          </label>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800"
          >
            <option value="ALL">All Actions</option>
            <option value="irrigation">Irrigation Actuation</option>
            <option value="hvac">HVAC / Fan</option>
            <option value="grow_light">Grow Lighting</option>
            <option value="manual_note">Agronomic Notes</option>
          </select>
        </div>

        {/* Trigger Mode */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
            Trigger Source
          </label>
          <select
            value={selectedTrigger}
            onChange={(e) => setSelectedTrigger(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800"
          >
            <option value="ALL">All Triggers</option>
            <option value="manual">Manual Intervention</option>
            <option value="auto">Automated AI / Closed-Loop</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
            Search Details
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search action or text..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800"
            />
          </div>
        </div>

      </div>

      {/* Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Plot Identifier</th>
                <th className="px-4 py-3.5">Action Category</th>
                <th className="px-4 py-3.5">Trigger Mode</th>
                <th className="px-5 py-3.5">Action Details & State Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    {loading ? 'Loading audit records...' : 'No field actuation audit records logged yet.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const formattedDate = isNaN(dateObj.getTime())
                    ? log.timestamp
                    : dateObj.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      });

                  const isAuto = log.triggered_by === 'auto';

                  return (
                    <tr key={log.id || `${log.timestamp}-${Math.random()}`} className="hover:bg-slate-50/80 transition-colors">
                      {/* Timestamp */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {formattedDate}
                      </td>

                      {/* Plot */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono text-[11px] font-bold">
                          {log.plot_id}
                        </span>
                      </td>

                      {/* Action Category */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getActionBadge(log.action_type)}
                      </td>

                      {/* Trigger Mode */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          isAuto 
                            ? 'bg-sky-50 text-sky-800 border border-sky-200' 
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {isAuto ? <Bot className="w-3 h-3 mr-1 text-sky-600" /> : <User className="w-3 h-3 mr-1 text-slate-500" />}
                          {isAuto ? 'Automated AI' : 'Manual'}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="px-5 py-4 text-slate-700 font-medium">
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-emerald-100">
                  <StickyNote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add Agronomic Audit Note</h3>
                  <p className="text-[11px] text-slate-400">Log manual observation or treatment</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNoteModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNote} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Target Plot Bed
                </label>
                <select
                  value={notePlotId}
                  onChange={(e) => setNotePlotId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800"
                >
                  {plots.map(p => (
                    <option key={p.id} value={p.code}>{p.code}: {p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Observation / Action Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="e.g. Applied micronutrient foliar spray, adjusted emitter spacing..."
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                >
                  Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FieldAuditLog;
