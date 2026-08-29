import React, { useState, useMemo } from 'react';
import { 
  History, 
  Download, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Droplet, 
  Filter,
  Radio,
  Clock
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { PrototypeModeBanner } from '../components/common/PrototypeModeBanner';
import { SensorProvenance } from '../components/common/SensorProvenance';
import { TelemetryObservation } from '../types';

export const FieldLog: React.FC = () => {
  const { telemetryObservations, activeSections, activeFarmland, crops } = useAgriStore();

  // Filter States
  const [selectedPlot, setSelectedPlot] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedParam, setSelectedParam] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Combine and sort observations
  const allObservations = useMemo(() => {
    return [...telemetryObservations].sort(
      (a, b) => new Date(b.measurementTimestamp).getTime() - new Date(a.measurementTimestamp).getTime()
    );
  }, [telemetryObservations]);

  // Filter Records
  const filteredRecords = useMemo(() => {
    return allObservations.filter(record => {
      // Plot Filter
      if (selectedPlot !== 'ALL' && record.plotId !== selectedPlot) {
        const matchingPlot = activeSections.find(p => p.id === selectedPlot || p.code === selectedPlot);
        if (record.plotId !== matchingPlot?.id && record.plotId !== matchingPlot?.code) {
          return false;
        }
      }

      // Data Source Filter (MANUAL_PROTOTYPE, SIMULATED, LIVE_SENSOR, DERIVED, AI, IMPORTED)
      if (selectedSource !== 'ALL' && record.dataSource !== selectedSource) {
        return false;
      }

      // Parameter Key Filter
      if (selectedParam !== 'ALL' && record.parameterKey !== selectedParam) {
        return false;
      }

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = record.displayName.toLowerCase().includes(q);
        const matchesPlot = record.plotId.toLowerCase().includes(q);
        const matchesParam = record.parameterKey.toLowerCase().includes(q);
        if (!matchesName && !matchesPlot && !matchesParam) return false;
      }

      return true;
    });
  }, [allObservations, selectedPlot, selectedSource, selectedParam, searchQuery, activeSections]);

  // 1-Click Native CSV Export
  const handleExportCSV = () => {
    const recordsToExport = filteredRecords.length > 0 ? filteredRecords : allObservations;
    const headers = ['Observation ID', 'Measurement Timestamp (ISO)', 'Farm ID', 'Plot ID', 'Device ID', 'Parameter Key', 'Display Name', 'Value', 'Unit', 'Data Source', 'Quality Status'];
    
    const rows = recordsToExport.map(r => [
      r.id,
      `"${r.measurementTimestamp}"`,
      `"${r.farmId || ''}"`,
      `"${r.plotId}"`,
      `"${r.deviceId || ''}"`,
      `"${r.parameterKey}"`,
      `"${r.displayName}"`,
      r.value,
      `"${r.unit}"`,
      `"${r.dataSource}"`,
      `"${r.qualityStatus}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodedUri);
    downloadAnchor.setAttribute('download', `agritwin_historical_telemetry_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans pb-10">
      <PrototypeModeBanner />

      {/* ================= HEADER & CSV EXPORT BUTTON ================= */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-sm shrink-0">
            <History className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Historical Telemetry & Observations
              </h1>
              <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                {filteredRecords.length} of {allObservations.length} Persisted Records
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Authoritative historical ledger stored in Firestore. Filter by plot, source, or parameter key.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Download Telemetry CSV</span>
        </button>
      </div>

      {/* ================= DATA SOURCE & PARAMETER FILTER BAR ================= */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Plot Selector */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
            Plot Bed Filter
          </label>
          <select
            value={selectedPlot}
            onChange={(e) => setSelectedPlot(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="ALL">All Plots (Global View)</option>
            {activeSections.map(p => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Data Source Selector (MANDATORY REQUIREMENT K) */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
            Data Source Filter
          </label>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="ALL">All Data Sources</option>
            <option value="SIMULATED">SIMULATED (Demo Realtime Engine)</option>
            <option value="MANUAL_PROTOTYPE">MANUAL_PROTOTYPE (Operator Input)</option>
            <option value="LIVE_SENSOR">LIVE_SENSOR (Physical IoT Node)</option>
            <option value="DERIVED">DERIVED (AgriTwin Engine)</option>
            <option value="AI">AI (Genotype Model)</option>
            <option value="IMPORTED">IMPORTED (External Dataset)</option>
          </select>
        </div>

        {/* Parameter Key Filter */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
            Parameter Key
          </label>
          <select
            value={selectedParam}
            onChange={(e) => setSelectedParam(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="ALL">All Parameters</option>
            <option value="soil_moisture">Soil Moisture (%)</option>
            <option value="air_temperature">Air Temperature (°C)</option>
            <option value="soil_ph">Soil pH</option>
            <option value="humidity">Humidity (%)</option>
            <option value="light">Solar Radiation (lx)</option>
          </select>
        </div>

        {/* Text Search */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
            Search Text
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search parameter, plot code..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* ================= TELEMETRY DATA TABLE ================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Plot / Node</th>
                <th className="px-4 py-3.5">Parameter</th>
                <th className="px-4 py-3.5">Value & Unit</th>
                <th className="px-4 py-3.5">Source Chain</th>
                <th className="px-4 py-3.5">Data Source</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    No historical telemetry observations match your filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const dateObj = new Date(record.measurementTimestamp);
                  const formattedDate = isNaN(dateObj.getTime())
                    ? record.measurementTimestamp
                    : dateObj.toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      });

                  const plotObj = activeSections.find(p => p.id === record.plotId || p.code === record.plotId);

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        <span className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formattedDate}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {plotObj?.code || record.plotId}
                          </span>
                          <span className="text-slate-500 font-normal text-[11px]">({record.deviceId || 'NODE-01'})</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-slate-700">
                        {record.displayName}
                      </td>

                      <td className="px-4 py-3.5 font-mono font-black text-slate-900 text-sm">
                        {record.value} <span className="text-xs font-bold text-slate-500">{record.unit}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <SensorProvenance obs={record} plots={activeSections} farmland={activeFarmland} />
                      </td>

                      <td className="px-4 py-3.5">
                        <DataSourceBadge source={record.dataSource} />
                      </td>

                      <td className="px-5 py-3.5 text-right font-mono text-xs font-bold text-emerald-700">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px]">
                          {record.qualityStatus || 'VALID'}
                        </span>
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
