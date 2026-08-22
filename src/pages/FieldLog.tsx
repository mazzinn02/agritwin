import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Droplet, 
  Calendar, 
  Layers,
  Thermometer,
  Gauge
} from 'lucide-react';
import { TelemetryRecord, PlotBed } from '../types';
import { getHistory, getPlots } from '../lib/farm-storage';

export const FieldLog: React.FC = () => {
  const [history, setHistory] = useState<TelemetryRecord[]>([]);
  const [plots, setPlots] = useState<PlotBed[]>([]);
  
  // Filter States
  const [selectedPlot, setSelectedPlot] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const reloadData = () => {
    setHistory(getHistory());
    setPlots(getPlots());
  };

  useEffect(() => {
    reloadData();

    const handleStorageUpdate = () => {
      reloadData();
    };

    window.addEventListener('agri_storage_updated', handleStorageUpdate);
    return () => window.removeEventListener('agri_storage_updated', handleStorageUpdate);
  }, []);

  // Filter Telemetry Records
  const filteredRecords = useMemo(() => {
    return history.filter(record => {
      // Plot Filter
      if (selectedPlot !== 'ALL' && record.plotCode !== selectedPlot) {
        return false;
      }
      // Status Filter
      if (selectedStatus !== 'ALL' && record.status !== selectedStatus) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCrop = record.cropName.toLowerCase().includes(q);
        const matchesPlot = record.plotCode.toLowerCase().includes(q);
        if (!matchesCrop && !matchesPlot) return false;
      }
      return true;
    });
  }, [history, selectedPlot, selectedStatus, searchQuery]);

  // 1-Click Native CSV Export
  const handleExportCSV = () => {
    const recordsToExport = filteredRecords.length > 0 ? filteredRecords : history;
    const headers = ['Record ID', 'Timestamp (ISO)', 'Plot Code', 'Crop Name', 'Soil Moisture (%)', 'Air Temp (°C)', 'Soil pH', 'Health Status'];
    
    const rows = recordsToExport.map(r => [
      r.id,
      `"${r.timestamp}"`,
      `"${r.plotCode}"`,
      `"${r.cropName}"`,
      r.soilMoisture,
      r.airTemp,
      r.soilPh,
      `"${r.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodedUri);
    downloadAnchor.setAttribute('download', `agritwin_telemetry_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  // Status Badge Helper
  const renderStatusBadge = (status: TelemetryRecord['status']) => {
    switch (status) {
      case 'Optimal':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Optimal
          </span>
        );
      case 'Low Water':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Droplet className="w-3.5 h-3.5 mr-1 text-amber-600" />
            Low Water
          </span>
        );
      case 'Heat Stress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Flame className="w-3.5 h-3.5 mr-1 text-rose-500" />
            Heat Stress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans pb-10">
      
      {/* ================= HEADER & CSV EXPORT BUTTON ================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-600/20 shrink-0">
            <History className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Field Telemetry Log & Audit
              </h1>
              <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                {filteredRecords.length} of {history.length} Records
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Historical biophysical records, irrigation pulses, and microclimate telemetry
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download CSV Spreadsheet</span>
        </button>
      </div>

      {/* ================= CLEAN FILTER BAR ================= */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Plot Selector */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
            Plot Bed Filter
          </label>
          <select
            value={selectedPlot}
            onChange={(e) => setSelectedPlot(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800 transition-all cursor-pointer"
          >
            <option value="ALL">All Plots (Global View)</option>
            {plots.map(p => (
              <option key={p.id} value={p.code}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Selector */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
            Health Status Filter
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800 transition-all cursor-pointer"
          >
            <option value="ALL">All Health States</option>
            <option value="Optimal">Optimal</option>
            <option value="Low Water">Low Water</option>
            <option value="Heat Stress">Heat Stress</option>
          </select>
        </div>

        {/* Text Search */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
            Search Crop or Code
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Tomato, S-01..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-800 transition-all"
            />
          </div>
        </div>

      </div>

      {/* ================= TELEMETRY DATA TABLE ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Plot Bed</th>
                <th className="px-4 py-3.5">Assigned Crop</th>
                <th className="px-4 py-3.5">Soil Moisture</th>
                <th className="px-4 py-3.5">Air Temperature</th>
                <th className="px-4 py-3.5">Soil pH</th>
                <th className="px-5 py-3.5 text-right">Condition Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No historical telemetry records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const dateObj = new Date(record.timestamp);
                  const formattedDate = isNaN(dateObj.getTime())
                    ? record.timestamp
                    : dateObj.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      });

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Timestamp */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {formattedDate}
                      </td>

                      {/* Plot Bed */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono text-[11px] font-bold">
                          {record.plotCode}
                        </span>
                      </td>

                      {/* Crop Name */}
                      <td className="px-4 py-4 whitespace-nowrap font-bold text-slate-900">
                        {record.cropName}
                      </td>

                      {/* Soil Moisture */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                          <Droplet className="w-3.5 h-3.5 text-sky-600" />
                          <span>{record.soilMoisture}%</span>
                        </div>
                      </td>

                      {/* Air Temp */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                          <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                          <span>{record.airTemp}°C</span>
                        </div>
                      </td>

                      {/* Soil pH */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                          <Gauge className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{record.soilPh}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        {renderStatusBadge(record.status)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default FieldLog;
