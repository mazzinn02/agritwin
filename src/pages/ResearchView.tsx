import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  FileJson, 
  FileSpreadsheet,
  Info,
  Tag
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { PrototypeModeBanner } from '../components/common/PrototypeModeBanner';

export const ResearchView: React.FC = () => {
  const { telemetryObservations, activeSections, farmlands, activeFarmland } = useAgriStore();

  const [selectedFarm, setSelectedFarm] = useState('ALL');
  const [selectedPlot, setSelectedPlot] = useState('ALL');
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredObservations = useMemo(() => {
    return telemetryObservations.filter(obs => {
      const matchesFarm = selectedFarm === 'ALL' || obs.farmId === selectedFarm;
      const matchesPlot = selectedPlot === 'ALL' || obs.plotId === selectedPlot;
      const matchesSource = selectedSource === 'ALL' || obs.dataSource === selectedSource;
      const matchesSearch = 
        obs.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obs.parameterKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (obs.plotId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (obs.sensorId || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFarm && matchesPlot && matchesSource && matchesSearch;
    });
  }, [telemetryObservations, selectedFarm, selectedPlot, selectedSource, searchQuery]);

  const handleExportCsv = () => {
    const headers = [
      'Observation ID', 
      'Farm ID', 
      'Plot ID', 
      'Sensor Node', 
      'Parameter Key', 
      'Display Name', 
      'Value', 
      'Unit', 
      'Measurement Timestamp', 
      'Received Timestamp', 
      'Quality Status', 
      'Data Source'
    ];

    const rows = filteredObservations.map(o => [
      o.id,
      o.farmId,
      o.plotId,
      o.sensorId,
      o.parameterKey,
      `"${o.displayName}"`,
      o.value,
      o.unit,
      o.measurementTimestamp,
      o.receivedTimestamp,
      o.qualityStatus,
      o.dataSource
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agritwin_research_telemetry_dataset.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    const jsonContent = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredObservations, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonContent);
    link.setAttribute('download', `agritwin_research_telemetry_dataset.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-800 pb-10">
      {/* Prototype Banner */}
      <PrototypeModeBanner />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">Research Observation Dataset Workspace</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                {filteredObservations.length} Observations
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect raw telemetry observations, metadata provenance, measurement timestamps, and export dataset.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <FileJson className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search parameter, plot, or node ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Farm Filter */}
          <select
            value={selectedFarm}
            onChange={(e) => setSelectedFarm(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="ALL">All Farmlands</option>
            {farmlands.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          {/* Plot Filter */}
          <select
            value={selectedPlot}
            onChange={(e) => setSelectedPlot(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="ALL">All Sections</option>
            {activeSections.map(p => (
              <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
            ))}
          </select>

          {/* Data Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="ALL">All Data Sources</option>
            <option value="MANUAL_PROTOTYPE">MANUAL_PROTOTYPE</option>
            <option value="SENSOR">SENSOR</option>
            <option value="AI_ML">AI_ML</option>
            <option value="DERIVED">DERIVED</option>
            <option value="SIMULATION">SIMULATION</option>
          </select>
        </div>
      </div>

      {/* Dataset Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-[10px] text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Measurement Time</th>
                <th className="px-6 py-3.5">Section & Node</th>
                <th className="px-6 py-3.5">Parameter & Value</th>
                <th className="px-6 py-3.5">Quality</th>
                <th className="px-6 py-3.5">Data Source Provenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredObservations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No telemetry observation records matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredObservations.map(obs => (
                  <tr key={obs.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                      {new Date(obs.measurementTimestamp).toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-slate-900">{obs.plotId}</span>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{obs.sensorId}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <span className="text-xs font-bold text-slate-900">{obs.displayName}</span>
                        <div className="text-sm font-black text-indigo-700 mt-0.5">
                          {obs.value} <span className="text-xs font-bold text-slate-500">{obs.unit}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {obs.qualityStatus}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <DataSourceBadge source={obs.dataSource} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResearchView;
