import React, { useState, useEffect } from 'react';
import { ref, onValue } from '../lib/firebase';
import { db } from '../lib/firebase';
import { Camera, Play, Square, Settings, Expand, Video, WifiOff } from 'lucide-react';

import { getFarmProfile } from '../lib/farm-storage';

export const CameraFeed = () => {
  const [cameraStatus, setCameraStatus] = useState<any>(null);
  const [useDemoStream, setUseDemoStream] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const farmProfile = getFarmProfile();

  useEffect(() => {
    const camRef = ref(db, 'camera');
    const unsubscribe = onValue(camRef, (snapshot) => {
      setCameraStatus(snapshot.val());
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6 text-slate-800">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 flex items-center">
            <Video className="mr-3 text-sky-600 w-8 h-8" />
            Field & Canopy Live Camera Feed
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">Live RTSP video stream from {farmProfile?.name || 'Smart Farm'} Gateway Node</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setUseDemoStream(!useDemoStream)}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-sky-700 font-bold rounded-xl text-xs border border-slate-200 shadow-xs transition-all cursor-pointer uppercase tracking-wider active:scale-95"
          >
            {useDemoStream ? 'Simulate Hardware Disconnect' : 'Connect Demo Stream'}
          </button>

          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-xs border border-slate-200 text-xs font-bold text-slate-700">
            <div className={`w-2.5 h-2.5 rounded-full ${useDemoStream ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{useDemoStream ? 'Live Feed Connected' : 'Stream Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Main Feed Container */}
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-slate-200/80">
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center group border border-slate-800 shadow-2xl">
          {useDemoStream && isPlaying ? (
            /* Live Demo Feed Container */
            <>
              <img 
                src="https://images.unsplash.com/photo-1592982537447-6f2a6a0a38f3?auto=format&fit=crop&q=80&w=1200" 
                alt="Live greenhouse feed" 
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute top-4 left-4 flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800">
                <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
                <span className="text-white text-xs font-extrabold tracking-wider">LIVE RTSP STREAM</span>
              </div>
            </>
          ) : (
            /* Styled Empty State Container */
            <div className="p-8 text-center text-slate-300 max-w-md space-y-4">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="relative p-5 rounded-2xl bg-slate-800 border border-slate-700 text-emerald-400 shadow-inner">
                  <Camera className="w-10 h-10" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Camera Feed Paused / Offline</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click 'Connect Demo Stream' or play below to view active canopy video.
                </p>
              </div>
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-xs font-medium">
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>RTSP Stream Standby</span>
              </div>
            </div>
          )}

          {/* Overlay Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsPlaying(!isPlaying)} 
                className="text-white hover:text-emerald-400 transition-colors p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </button>
              <div className="text-white text-xs font-semibold tracking-wider font-mono">
                CAM_1_NORTH_WING (Gateway #1)
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="text-slate-300 hover:text-white transition-colors p-1.5 cursor-pointer">
                <Settings className="w-4 h-4" />
              </button>
              <button className="text-slate-300 hover:text-white transition-colors p-1.5 cursor-pointer">
                <Expand className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraFeed;
