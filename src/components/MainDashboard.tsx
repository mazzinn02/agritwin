import React, { useState, useEffect } from 'react';
import { DigitalTwinCropState } from '../types';
import { Leaf, Ruler, Maximize, ShieldAlert, Sprout, Thermometer, Droplets, Droplet, Bell, Cloud, Sun, Wind, CloudRain, Sunrise, Sunset } from 'lucide-react';

interface Props {
  twinState: DigitalTwinCropState;
}

export const MainDashboard: React.FC<Props> = ({ twinState }) => {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [weatherError, setWeatherError] = useState('');

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoadingWeather(true);
        const res = await fetch('/api/weather', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location: 'Dharwad, Karnataka, India' })
        });
        
        const data = await res.json();
        
        if (res.status === 429 || data.isQuotaExhausted) {
          throw new Error('Weather data unavailable (API Quota Exhausted). Please try again later.');
        }
        
        if (!res.ok) throw new Error(data.error || 'Failed to fetch weather');
        
        if (data.success && data.weather) {
          setWeatherData(data.weather);
        } else {
          throw new Error('Invalid weather data');
        }
      } catch (err: any) {
        console.error(err);
        setWeatherError(err.message || 'Error loading weather');
      } finally {
        setLoadingWeather(false);
      }
    };
    
    fetchWeather();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">Farm Overview Dashboard</h2>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Plants Monitored', value: '12,450', icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Average Plant Height', value: `${twinState.plantHeightCm.toFixed(1)} cm`, icon: Ruler, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Canopy Coverage', value: `${twinState.canopyCoveragePercent.toFixed(1)}%`, icon: Maximize, color: 'text-indigo-600', bg: 'bg-indigo-100' },
          { label: 'Predicted Yield', value: `${twinState.estimatedYieldKgPerM2.toFixed(1)} kg/m²`, icon: Sprout, color: 'text-purple-600', bg: 'bg-purple-100' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
              <div className={`w-10 h-10 ${kpi.bg} rounded-lg flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
                <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weather Intelligence Panel */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>Local Weather</span>
            <Cloud className="w-5 h-5 text-slate-400" />
          </h3>
          {loadingWeather ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : weatherError ? (
            <div className="text-sm text-red-500 p-4 text-center border border-red-100 rounded-lg bg-red-50">
              {weatherError}
            </div>
          ) : weatherData ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-sky-50 rounded-lg border border-sky-100 flex items-center space-x-3">
                <Sun className="w-6 h-6 text-sky-500" />
                <div>
                  <p className="text-xs text-slate-500">Air Temp</p>
                  <p className="text-sm font-bold text-slate-900">{weatherData.airTemp}°C</p>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center space-x-3">
                <CloudRain className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="text-xs text-slate-500">Humidity</p>
                  <p className="text-sm font-bold text-slate-900">{weatherData.humidity}%</p>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center space-x-3">
                <Wind className="w-6 h-6 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Wind</p>
                  <p className="text-sm font-bold text-slate-900">{weatherData.windSpeed} km/h</p>
                </div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 flex items-center space-x-3">
                <Sun className="w-6 h-6 text-orange-500" />
                <div>
                  <p className="text-xs text-slate-500">UV Index</p>
                  <p className="text-sm font-bold text-slate-900 capitalize">{weatherData.uvIndex}</p>
                </div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-center space-x-3">
                <Sunrise className="w-6 h-6 text-amber-500" />
                <div>
                  <p className="text-xs text-slate-500">Sunrise</p>
                  <p className="text-sm font-bold text-slate-900">{weatherData.sunrise}</p>
                </div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center space-x-3">
                <Sunset className="w-6 h-6 text-indigo-500" />
                <div>
                  <p className="text-xs text-slate-500">Sunset</p>
                  <p className="text-sm font-bold text-slate-900">{weatherData.sunset}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Live Sensor Data Panel */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Live Sensor Data - {twinState.sensors.name}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
              <Thermometer className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-slate-500">Temperature</p>
                <p className="text-lg font-bold text-slate-900">{twinState.sensors.temperature}°C</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
              <Droplets className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-slate-500">Humidity</p>
                <p className="text-lg font-bold text-slate-900">{twinState.sensors.humidity}%</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
              <Droplet className="w-8 h-8 text-cyan-500" />
              <div>
                <p className="text-sm text-slate-500">Soil Moisture</p>
                <p className="text-lg font-bold text-slate-900">{twinState.sensors.soilMoisture}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Farm Status & Alerts */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>Recent Alerts</span>
            <Bell className="w-5 h-5 text-slate-400" />
          </h3>
          <div className="space-y-3">
            {twinState.alerts && twinState.alerts.length > 0 ? (
              twinState.alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-start space-x-3">
                  <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">{alert.message}</p>
                    <p className="text-xs text-red-500 mt-1">{alert.timestamp}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">No active alerts. Farm is operating optimally.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
