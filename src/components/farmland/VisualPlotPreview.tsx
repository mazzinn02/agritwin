import React from 'react';
import { Sprout, Layers, MapPin, CheckCircle2 } from 'lucide-react';
import { Crop } from '../../types';

export interface SectionAssignment {
  code: string;
  name: string;
  cropId: string;
  area: number;
  cropObj?: Crop | null;
}

interface VisualPlotPreviewProps {
  farmName: string;
  location: string;
  totalArea: number;
  areaUnit: string;
  sections: SectionAssignment[];
  allCrops: Crop[];
  className?: string;
}

const PALETTE = [
  { bg: 'bg-emerald-900/40', border: 'border-emerald-500/50', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', accent: '#10b981' },
  { bg: 'bg-teal-900/40', border: 'border-teal-500/50', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30', accent: '#14b8a6' },
  { bg: 'bg-sky-900/40', border: 'border-sky-500/50', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30', accent: '#0284c7' },
  { bg: 'bg-amber-900/40', border: 'border-amber-500/50', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', accent: '#f59e0b' },
  { bg: 'bg-indigo-900/40', border: 'border-indigo-500/50', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', accent: '#6366f1' },
  { bg: 'bg-purple-900/40', border: 'border-purple-500/50', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', accent: '#a855f7' },
];

export const VisualPlotPreview: React.FC<VisualPlotPreviewProps> = ({
  farmName,
  location,
  totalArea,
  areaUnit,
  sections,
  allCrops,
  className = ''
}) => {
  const safeTotal = totalArea > 0 ? totalArea : 1;

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-slate-100 ${className}`}>
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-lg text-white tracking-tight">{farmName || 'Farmland Plot Schematic'}</h3>
          </div>
          <p className="text-xs text-slate-400 flex items-center mt-1 gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            {location || 'Precision Zone'} &bull; Total Land Area: <span className="font-semibold text-emerald-400">{totalArea} {areaUnit}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-lg text-xs text-emerald-300 font-semibold self-start sm:self-auto">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>2D Schematic Preview &bull; {sections.length} Allocated Sections</span>
        </div>
      </div>

      {/* 2D Block Layout Rendering */}
      {sections.length === 0 ? (
        <div className="h-48 border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-500 text-sm">
          No sections added yet
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[260px]">
            {sections.map((section, idx) => {
              const crop = allCrops.find(c => c.id === section.cropId) || section.cropObj;
              const pct = safeTotal > 0 ? ((section.area / safeTotal) * 100).toFixed(1) : '0';
              const color = PALETTE[idx % PALETTE.length];

              return (
                <div
                  key={section.code || idx}
                  style={{ flexGrow: Math.max(1, Math.round(section.area)) }}
                  className={`relative p-4 rounded-xl border ${color.bg} ${color.border} flex flex-col justify-between transition-all duration-200 hover:scale-[1.01] hover:shadow-lg group`}
                >
                  {/* Top Bar: Section Title & Area Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                        {section.code}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1 group-hover:text-emerald-300 transition-colors">
                        {section.name || `Section ${section.code}`}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${color.badge}`}>
                        {section.area} {areaUnit}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{pct}% of land</p>
                    </div>
                  </div>

                  {/* Visual Proportion Bar */}
                  <div className="w-full bg-slate-950/70 h-2 rounded-full my-3 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(5, parseFloat(pct)))}%`,
                        backgroundColor: color.accent
                      }}
                    />
                  </div>

                  {/* Bottom: Crop Details */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                    <div className="flex items-center space-x-2 text-slate-300">
                      <div className="p-1 rounded-md bg-slate-900 border border-slate-700 text-emerald-400">
                        <Sprout className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-white">
                        {crop ? `${crop.name}` : 'Unassigned Crop'}
                      </span>
                    </div>

                    {crop?.variety && (
                      <span className="text-[11px] text-slate-400 italic">
                        {crop.variety}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scale Legend */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 px-1">
            <span>Scale: Proportionally calculated by section acreage</span>
            <span className="font-mono text-emerald-400">Sum = {sections.reduce((acc, s) => acc + (Number(s.area) || 0), 0)} / {totalArea} {areaUnit}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualPlotPreview;
