import { ref, set, push, get, onValue } from './firebase';
import { db } from './firebase';
import { getPlots, getCrops, getFarmProfile } from './farm-storage';

let demoModeEnabled = true;
let currentDevicesMap: Record<string, any> = {};
let lastAlerts: any = {};

export const seedDatabase = async () => {
  // Seed Settings
  await set(ref(db, 'settings'), {
    demoMode: true
  });

  onValue(ref(db, 'settings/demoMode'), (snap) => {
    demoModeEnabled = snap.val();
  });

  // Seed System Status for Edge Resilience
  await set(ref(db, 'system_status'), {
    edge_online: true,
    last_cloud_sync: Date.now(),
    offline_buffer_count: 0
  });

  const profile = getFarmProfile();
  const farmName = profile?.name || 'AgriTwin Smart Farm';
  const farmLocation = profile?.location || 'Precision Agriculture Campus';

  await set(ref(db, 'farm_meta'), {
    farmName,
    location: farmLocation,
    established: 2026,
    totalArea: profile?.totalArea || 25,
    areaUnit: profile?.unit || 'acres',
    systemStatus: 'Online',
    firmwareVersion: 'v2.4.1-edge'
  });
};

export const startSimulator = () => {
  const loop = async () => {
    if (!demoModeEnabled) return;

    const plots = getPlots();
    const crops = getCrops();

    for (const plot of plots) {
      const assignedCrop = crops.find(c => c.id === plot.cropId);
      const optMoistMin = assignedCrop?.idealMoistureMin || 50;
      const optMoistMax = assignedCrop?.idealMoistureMax || 75;
      const optTempMin = assignedCrop?.idealTempMin || 18;
      const optTempMax = assignedCrop?.idealTempMax || 30;

      // Mild real-time sensor jitter
      const tempJitter = (Math.random() - 0.5) * 0.4;
      const moistJitter = (Math.random() - 0.5) * 0.3;

      const currentTemp = Number((plot.airTemp + tempJitter).toFixed(1));
      const currentMoisture = Number(Math.max(25, Math.min(90, plot.soilMoisture + moistJitter)).toFixed(1));
      const currentPh = plot.soilPh || 6.5;

      const liveReading = {
        airTemp: currentTemp,
        soilTemp: Number((currentTemp - 1.8).toFixed(1)),
        humidity: Number((62 + (Math.random() - 0.5) * 2).toFixed(0)),
        soilMoisture: currentMoisture,
        light: 48000,
        soilPh: currentPh,
        soilEc: 1.2,
        nitrogen: 45,
        phosphorus: 30,
        potassium: 50,
        vpd: 1.05,
        par: 650,
        dli: 18.5,
        timestamp: Date.now()
      };

      await set(ref(db, `live_readings/${plot.id}`), liveReading);
      await set(ref(db, `sensorReadings/${plot.id}`), liveReading);

      // AI Recommendations & Diagnosis
      let healthScore = 95;
      let yieldPotential = 92;
      const recs: any[] = [];

      if (currentMoisture < optMoistMin) {
        healthScore -= 15;
        yieldPotential -= 10;
        recs.push({
          issue: `Soil moisture low (${currentMoisture}% vs Target ${optMoistMin}%)`,
          solution: `Root zone moisture depleted. Transpiration requires 15-min precision pulse.`,
          priority: 'high'
        });
      }

      if (currentTemp > optTempMax) {
        healthScore -= 18;
        yieldPotential -= 12;
        recs.push({
          issue: `Canopy heat stress (${currentTemp}°C vs Max ${optTempMax}°C)`,
          solution: `High vapor pressure deficit. Turn on overhead shade fans.`,
          priority: 'high'
        });
      }

      await set(ref(db, `aiRecommendations/${plot.id}`), {
        healthScore: Math.max(20, healthScore),
        yieldPotential: Math.max(20, yieldPotential),
        recommendations: recs.length > 0 ? recs : [{
          issue: 'Micro-climate optimal',
          solution: 'All root zone and canopy parameters aligned with target variety tolerances.',
          priority: 'low'
        }],
        lastAnalyzed: Date.now()
      });
    }
  };

  loop();
  setInterval(loop, 4000);
};

export const analyzeCropSimulated = async (plotId: string) => {
  const plots = getPlots();
  const crops = getCrops();
  const plot = plots.find(p => p.id === plotId) || plots[0];
  const crop = plot && plot.cropId ? crops.find(c => c.id === plot.cropId) : crops[0];

  const daysPlanted = plot?.daysPlanted || 1;
  const duration = crop?.growthDurationDays || 90;

  const plantHeight = Math.round(15 + daysPlanted * 1.2);
  const canopyCoverage = Math.min(95, Math.round(20 + daysPlanted * 1.5));
  const fruitRipeness = Math.min(100, Math.round((daysPlanted / duration) * 100));
  const yieldEstimate = Number((3.2 + (daysPlanted / duration) * 2.2).toFixed(1));

  await set(ref(db, `crop_vision/${plotId}`), {
    plantHeight,
    canopyCoverage,
    growthStage: fruitRipeness > 80 ? 'Harvest Ready' : fruitRipeness > 50 ? 'Fruit Set' : fruitRipeness > 25 ? 'Flowering' : 'Vegetative',
    fruitRipeness,
    yieldEstimate,
    diseaseRisk: 3,
    lastAnalyzed: Date.now()
  });
};
