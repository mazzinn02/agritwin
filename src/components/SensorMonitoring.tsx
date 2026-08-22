import React from 'react';
import { DigitalTwinCropState } from '../types';
import { Activity, Thermometer, Droplets, Droplet, Sun, Wind, Wifi, BatteryMedium, Cpu } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  twinState: DigitalTwinCropState;
}

export const SensorMonitoring: React.FC<Props> = ({ twinState }) => {
  const { sensors } = twinState;

  // Generate some fake historical data for the chart
  const historyData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    temp: sensors.temperature + (Math.sin(i * 0.5) * 2),
    humidity: sensors.humidity + (Math.cos(i * 0.5) * 5),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">IoT Sensor Monitoring</h2>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-slate-700">Gateway {sensors.id} Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-2.5 bg-orange-100 text-orange-600 rounded-lg"><Thermometer className="w-5 h-5" /></div>
          <div>
            <p className="text-sm text-slate-500">Air Temp</p>
            <p className="text-xl font-bold text-slate-900">{sensors.temperature}°C</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg"><Droplets className="w-5 h-5" /></div>
          <div>
            <p className="text-sm text-slate-500">Humidity</p>
            <p className="text-xl font-bold text-slate-900">{sensors.humidity}%</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-2.5 bg-cyan-100 text-cyan-600 rounded-lg"><Droplet className="w-5 h-5" /></div>
          <div>
            <p className="text-sm text-slate-500">Soil Moisture</p>
            <p className="text-xl font-bold text-slate-900">{sensors.soilMoisture}%</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-2.5 bg-amber-100 text-amber-600 rounded-lg"><Sun className="w-5 h-5" /></div>
          <div>
            <p className="text-sm text-slate-500">Light Lux</p>
            <p className="text-xl font-bold text-slate-900">{(sensors.sunlightLux / 1000).toFixed(1)}k</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">24h Environmental Trends</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line yAxisId="left" type="monotone" dataKey="temp" name="Temperature (°C)" stroke="#f97316" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Hardware Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Wifi className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Signal Strength</span>
              </div>
              <span className="text-sm font-bold text-emerald-600">-64 dBm</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BatteryMedium className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Battery Level</span>
              </div>
              <span className="text-sm font-bold text-emerald-600">82%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Cpu className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">MCU Uptime</span>
              </div>
              <span className="text-sm font-bold text-slate-900">14d 6h</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Wind className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">CO2 Sensor</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{sensors.co2Level} ppm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
