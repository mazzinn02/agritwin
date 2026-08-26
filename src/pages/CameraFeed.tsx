import React, { useState } from 'react';
import { Video, WifiOff, RefreshCw } from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { PrototypeModeBanner } from '../components/common/PrototypeModeBanner';

export const CameraFeed: React.FC = () => {
  const { activeFarmland } = useAgriStore();
  const [selectedCamera, setSelectedCamera] = useState('CAM_1_NORTH_WING');

  const cameras = [
    { id: 'CAM_1_NORTH_WING', label: 'CAM 01: North Greenhouse Wing' },
    { id: 'CAM_2_SOUTH_WING', label: 'CAM 02: South Field Plot' },
    { id: 'CAM_3_EAST_WING', label: 'CAM 03: East Irrigation Zone' },
  ];

  return (
    <div className="space-y-6 text-slate-800 font-sans pb-10">
      <PrototypeModeBanner />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Field & Canopy Camera Feed</h1>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              NOT CONNECTED
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Optical RTSP camera stream interface for {activeFarmland?.name || 'Farm'}.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Camera Hardware Offline (Not Connected)</span>
        </div>
      </div>

      {/* Placeholder Feed Screen */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <select
            value={selectedCamera}
            onChange={e => setSelectedCamera(e.target.value)}
            className="bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 outline-none cursor-pointer"
          >
            {cameras.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          <span className="text-xs font-mono text-slate-400">Stream Status: NOT CONNECTED</span>
        </div>

        <div className="h-96 rounded-2xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center space-y-3 p-6 text-center">
          <div className="p-4 rounded-2xl bg-slate-900 text-slate-500 border border-slate-800">
            <WifiOff className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">Camera Hardware Not Connected</h3>
          <p className="text-xs text-slate-400 max-w-md">
            Optical RTSP camera stream for {selectedCamera} will be enabled once real physical camera hardware is mounted and linked to the gateway.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CameraFeed;
