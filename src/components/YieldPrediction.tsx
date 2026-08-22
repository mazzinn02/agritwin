import React from 'react';
import { DigitalTwinCropState } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { Sprout, TrendingUp, CalendarDays, Droplets, Sun, Wind } from 'lucide-react';

interface Props {
  twinState: DigitalTwinCropState;
}

export const YieldPrediction: React.FC<Props> = ({ twinState }) => {
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const week = Math.max(1, Math.floor(twinState.currentDay / 7) - 5 + i);
    const baseYield = twinState.estimatedYieldKgPerM2;
    // Simulate some variance
    const variance = (Math.sin(week * 1.5) * 0.1) + 1;
    
    return {
      name: `Week ${week}`,
      yieldVal: i === 5 ? baseYield : baseYield * variance * (0.5 + (i * 0.1)),
    };
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">Yield Prediction Module</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 lg:col-span-1 space-y-4">
          <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-100">
            <Sprout className="w-10 h-10 text-purple-600 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-purple-800 uppercase tracking-wider mb-1">Predicted Crop Yield</h3>
            <p className="text-3xl font-bold text-purple-900">{twinState.estimatedYieldKgPerM2.toFixed(1)} <span className="text-lg text-purple-700">kg/m²</span></p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">Key Influencing Factors</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="text-sm">Solar Radiation</span>
                </div>
                <span className="text-sm font-medium text-emerald-600">+12%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Soil Hydration</span>
                </div>
                <span className="text-sm font-medium text-emerald-600">+5%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Wind className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">Pathogen Stress</span>
                </div>
                <span className="text-sm font-medium text-red-500">-{twinState.diseaseRiskPercent.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center space-x-3">
            <CalendarDays className="w-8 h-8 text-indigo-500 shrink-0" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Est. Harvest Date</p>
              <p className="text-lg font-bold text-slate-900">
                {new Date(Date.now() + (90 - twinState.currentDay) * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">Yield Trend Graph</h3>
            <div className="flex items-center space-x-2 text-sm text-emerald-600 font-medium bg-emerald-50 px-3 py-1 rounded-full">
              <TrendingUp className="w-4 h-4" />
              <span>Trending Up</span>
            </div>
          </div>
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <RechartsTooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value.toFixed(1)} kg/m²`, 'Predicted Yield']}
                />
                <Bar dataKey="yieldVal" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#8b5cf6' : '#c4b5fd'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
