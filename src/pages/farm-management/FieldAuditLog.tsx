import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Droplets, 
  Wind, 
  Calendar, 
  CheckCircle2, 
  Layers, 
  Zap, 
  Plus, 
  X,
  User,
  Bot
} from 'lucide-react';
import { useAgriStore } from '../../context/AgriStore';

export const FieldAuditLog: React.FC = () => {
  const { auditLogs, activeSections, triggerActuator } = useAgriStore();
  const [selectedPlot, setSelectedPlot] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Note Modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [notePlotId, setNotePlotId] = useState(activeSections[0]?.id || '');
  const [noteContent, setNoteContent] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesPlot = selectedPlot === 'ALL' || log.plot_id === selectedPlot || log.plot_code === selectedPlot;
      const matchesAction = selectedAction === 'ALL' || log.action_type === selectedAction;
      const matchesSearch = 
        (log.details || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.plot_code || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPlot && matchesAction && matchesSearch;
    });
  }, [auditLogs, selectedPlot, selectedAction, searchQuery]);

  const handleAddManualNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !notePlotId) return;

    triggerActuator(notePlotId, 'irrigation', 'manual');
    showToast(`Manual observation note recorded for ${notePlotId}.`);
    setNoteContent('');
    setIsNoteModalOpen(false);
  };

  const handleExportCsv = () => {
    const headers = ['Timestamp', 'Section Code', 'Action Type', 'Triggered By', 'Audit Log Details'];
    const rows = filteredLogs.map(l => [
      new Date(l.timestamp).toLocaleString(),
      l.plot_code || l.plot_id,
      l.action_type,
      l.triggered_by,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agritwin_field_audit_log.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-800 pb-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">Immutable Field Audit Ledger</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                {auditLogs.length} Total Ledger Events
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical ledger of hardware actuator events, irrigation pulses, and field observations in `agritwin_audit_logs`.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsNoteModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-300 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-sky-600" />
            <span>+ Manual Note</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Audit CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search details or bed code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Section Filter */}
          <select
            value={selectedPlot}
            onChange={(e) => setSelectedPlot(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="ALL">All Plot Beds</option>
            {activeSections.map(p => (
              <option key={p.id} value={p.id}>
                {p.code}: {p.name}
              </option>
            ))}
          </select>

          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="ALL">All Actuator Types</option>
            <option value="irrigation">Irrigation Solenoids</option>
            <option value="hvac">HVAC / Canopy Fans</option>
            <option value="growLight">Grow Lights</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-[10px] text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Section</th>
                <th className="px-6 py-3.5">Action Type</th>
                <th className="px-6 py-3.5">Trigger Mode</th>
                <th className="px-6 py-3.5">Audit Log Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No field audit log records found matching search filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {l.plot_code || l.plot_id}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {l.action_type === 'irrigation' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          <Droplets className="w-3.5 h-3.5" />
                          <span>Irrigation Pulse</span>
                        </span>
                      ) : l.action_type === 'hvac' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Zap className="w-3.5 h-3.5" />
                          <span>Canopy Fan</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{l.action_type}</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1 text-[11px] font-bold ${
                        l.triggered_by === 'auto' ? 'text-purple-700' : 'text-slate-700'
                      }`}>
                        {l.triggered_by === 'auto' ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5 text-slate-400" />}
                        <span className="uppercase">{l.triggered_by}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-800 font-medium">
                      {l.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative">
            <button
              onClick={() => setIsNoteModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Record Field Observation</h3>
                <p className="text-xs text-slate-500">Add an immutable manual entry to the audit log</p>
              </div>
            </div>

            <form onSubmit={handleAddManualNote} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Section Bed</label>
                <select
                  value={notePlotId}
                  onChange={(e) => setNotePlotId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold outline-none"
                >
                  {activeSections.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.code}: {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Observation Note / Action</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Visual inspection confirmed healthy leaf canopy."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20"
                >
                  Save Log Entry
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
