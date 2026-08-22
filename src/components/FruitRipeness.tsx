import React from 'react';
import { DigitalTwinCropState } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Apple, Calendar, Layers } from 'lucide-react';

interface Props {
  twinState: DigitalTwinCropState;
}

export const FruitRipeness: React.FC<Props> = ({ twinState }) => {
  const ripenessPercent = twinState.fruitRipenessPercent;
  const isHarvestReady = ripenessPercent >= 85;

  const data = [
    { name: 'Mature / Ripe', value: ripenessPercent, color: '#f59e0b' }, // Amber
    { name: 'Unripe / Green', value: 100 - ripenessPercent, color: '#84cc16' }, // Lime
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">Fruit Ripeness Analysis</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4 lg:col-span-1">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 bg-amber-100 text-amber-600 rounded-lg">
              <Apple className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Average Ripeness</p>
              <p className="text-2xl font-bold text-slate-900">{ripenessPercent.toFixed(1)}%</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Estimated Fruit Count</p>
              <p className="text-2xl font-bold text-slate-900">{Math.floor(twinState.estimatedYieldKgPerM2 * 8.5)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-lg ${isHarvestReady ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Harvest Readiness</p>
              <p className={`text-xl font-bold ${isHarvestReady ? 'text-emerald-600' : 'text-slate-900'}`}>
                {isHarvestReady ? 'Ready for Harvest' : 'Not Ready'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Ripeness Distribution Categories</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
