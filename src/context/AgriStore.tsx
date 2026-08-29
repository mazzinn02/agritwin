import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Crop, Farmland, PlotBed, UserProfile, AuditLogEntry, TelemetryObservation, IoTSensor } from '../types';
import { saveFarmsToSupabase, savePlotsToSupabase, saveSensorsToSupabase, subscribeToSupabaseMultiTable, saveTelemetryObservationToSupabase, isSupabaseConfigured } from '../lib/supabase';
import { telemetrySimulator } from '../services/telemetrySimulator';
import { SEEDED_FARMS, SEEDED_PLOTS, SEEDED_SENSORS, generateSeededTelemetry, seedMultiFarmSystemToSupabase } from '../lib/multi-farm-seeder';

export const STORE_KEYS = {
  CROPS: 'agritwin_crops',
  FARMLANDS: 'agritwin_farmlands',
  PLOTS: 'agritwin_plots',
  SENSORS: 'agritwin_sensors',
  USERS: 'agritwin_users',
  AUDIT_LOGS: 'agritwin_audit_logs',
  TELEMETRY_OBSERVATIONS: 'agritwin_telemetry_observations',
  ACTIVE_FARM_ID: 'agritwin_active_farm_id',
  CURRENT_USER: 'agritwin_current_user_profile',
  DEMO_TELEMETRY_ACTIVE: 'agritwin_demo_telemetry_active'
} as const;

// 1. Seed Crop Cultivars
export const SEED_CROPS: Crop[] = [
  {
    id: 'crop_tomato_sarpan',
    name: 'Tomato',
    variety: 'Sarpan F1-STH-520',
    growthDurationDays: 105,
    waterRequirementLpd: 4.5,
    idealMoistureMin: 55,
    idealMoistureMax: 75,
    idealTempMin: 20,
    idealTempMax: 28,
    idealPhMin: 6.0,
    idealPhMax: 6.8,
    gddBaseTemp: 10,
    createdAt: new Date().toISOString()
  },
  {
    id: 'crop_chilli_byadgi',
    name: 'Chilli',
    variety: 'Byadgi Dabbi',
    growthDurationDays: 150,
    waterRequirementLpd: 3.2,
    idealMoistureMin: 50,
    idealMoistureMax: 70,
    idealTempMin: 22,
    idealTempMax: 32,
    idealPhMin: 6.2,
    idealPhMax: 7.2,
    gddBaseTemp: 12,
    createdAt: new Date().toISOString()
  },
  {
    id: 'crop_cotton_rch',
    name: 'Cotton',
    variety: 'Bt-Hybrid RCH-2',
    growthDurationDays: 165,
    waterRequirementLpd: 6.0,
    idealMoistureMin: 45,
    idealMoistureMax: 65,
    idealTempMin: 24,
    idealTempMax: 35,
    idealPhMin: 6.5,
    idealPhMax: 7.8,
    gddBaseTemp: 15,
    createdAt: new Date().toISOString()
  },
  {
    id: 'crop_corn_sugar',
    name: 'Sweet Corn / Maize',
    variety: 'Sugar-75',
    growthDurationDays: 90,
    waterRequirementLpd: 5.5,
    idealMoistureMin: 60,
    idealMoistureMax: 80,
    idealTempMin: 18,
    idealTempMax: 30,
    idealPhMin: 5.8,
    idealPhMax: 7.0,
    gddBaseTemp: 10,
    createdAt: new Date().toISOString()
  },
  {
    id: 'crop_groundnut_tmv',
    name: 'Groundnut / Peanut',
    variety: 'TMV-2',
    growthDurationDays: 115,
    waterRequirementLpd: 3.0,
    idealMoistureMin: 40,
    idealMoistureMax: 60,
    idealTempMin: 22,
    idealTempMax: 30,
    idealPhMin: 6.0,
    idealPhMax: 7.0,
    gddBaseTemp: 13,
    createdAt: new Date().toISOString()
  }
];

// 2. Seed Farmlands & Subdivisions (IIIT Dharwad 20 Acres)
export const SEED_FARMLAND: Farmland = {
  id: 'farm_iiit_dharwad',
  name: 'iiit dharwad',
  location: 'Dharwad, Karnataka',
  totalArea: 20,
  unit: 'acres',
  sectionsCount: 4,
  createdAt: new Date().toISOString()
};

export const SEED_SECTIONS: PlotBed[] = [
  {
    id: 'sec_a_tomato',
    code: 'SEC-A',
    name: 'Section A - Tomato (Sarpan F1)',
    area: 5,
    areaUnit: 'acres',
    areaSqm: 20234.3,
    cropId: 'crop_tomato_sarpan',
    farmId: 'farm_iiit_dharwad',
    sensorNodeId: 'NODE-01',
    sensorId: 'NODE-01',
    soilMoisture: 66.9,
    airTemp: 24.2,
    soilPh: 6.5,
    parLux: 850,
    daysPlanted: 45,
    isWatering: false,
    hvacActive: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sec_b_chilli',
    code: 'SEC-B',
    name: 'Section B - Chilli (Byadgi Dabbi)',
    area: 5,
    areaUnit: 'acres',
    areaSqm: 20234.3,
    cropId: 'crop_chilli_byadgi',
    farmId: 'farm_iiit_dharwad',
    sensorNodeId: 'NODE-02',
    sensorId: 'NODE-02',
    soilMoisture: 54.2,
    airTemp: 26.5,
    soilPh: 6.8,
    parLux: 920,
    daysPlanted: 60,
    isWatering: false,
    hvacActive: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sec_c_cotton',
    code: 'SEC-C',
    name: 'Section C - Bt-Cotton (RCH-2)',
    area: 5,
    areaUnit: 'acres',
    areaSqm: 20234.3,
    cropId: 'crop_cotton_rch',
    farmId: 'farm_iiit_dharwad',
    sensorNodeId: 'NODE-03',
    sensorId: 'NODE-03',
    soilMoisture: 48.0,
    airTemp: 28.1,
    soilPh: 7.0,
    parLux: 750,
    daysPlanted: 75,
    isWatering: false,
    hvacActive: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sec_d_corn',
    code: 'SEC-D',
    name: 'Section D - Sweet Corn (Sugar-75)',
    area: 5,
    areaUnit: 'acres',
    areaSqm: 20234.3,
    cropId: 'crop_corn_sugar',
    farmId: 'farm_iiit_dharwad',
    sensorNodeId: 'NODE-04',
    sensorId: 'NODE-04',
    soilMoisture: 62.5,
    airTemp: 23.8,
    soilPh: 6.2,
    parLux: 650,
    daysPlanted: 30,
    isWatering: false,
    hvacActive: false,
    createdAt: new Date().toISOString()
  }
];

// 3. Seed User Accounts
export const SEED_USERS: UserProfile[] = [
  {
    uid: 'usr_admin_001',
    email: 'admin@agritwin.com',
    full_name: 'System Administrator',
    role: 'admin',
    assigned_farm_ids: ['farm_iiit_dharwad'],
    created_at: new Date().toISOString()
  },
  {
    uid: 'usr_farmer_002',
    email: 'farmer@agritwin.com',
    full_name: 'irappa',
    role: 'farmer',
    assigned_farm_ids: ['farm_iiit_dharwad'],
    created_at: new Date().toISOString()
  }
];

export const SEED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit_01',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    plot_id: 'sec_a_tomato',
    plot_code: 'SEC-A',
    action_type: 'irrigation',
    triggered_by: 'manual',
    details: 'System Administrator executed 15-min precision pulse on SEC-A (Tomato). Soil moisture set to 66.9%.'
  },
  {
    id: 'audit_02',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    plot_id: 'sec_b_chilli',
    plot_code: 'SEC-B',
    action_type: 'hvac',
    triggered_by: 'manual',
    details: 'irappa activated Canopy Ventilation Fan on SEC-B (Chilli).'
  }
];

// 4. Seed Telemetry Observations
export const SEED_TELEMETRY_OBSERVATIONS: TelemetryObservation[] = [
  {
    id: 'obs_seed_01',
    farmId: 'farm_iiit_dharwad',
    plotId: 'sec_a_tomato',
    deviceId: 'NODE-01',
    sensorId: 'NODE-01',
    parameterKey: 'soil_moisture',
    displayName: 'Soil Volumetric Water Content',
    value: 66.9,
    unit: '%',
    measurementTimestamp: new Date(Date.now() - 1800000).toISOString(),
    receivedTimestamp: new Date(Date.now() - 1800000).toISOString(),
    qualityStatus: 'VALID',
    dataSource: 'MANUAL_PROTOTYPE',
    metadata: { operator: 'System Administrator', notes: 'Initial baseline calibration observation' }
  },
  {
    id: 'obs_seed_02',
    farmId: 'farm_iiit_dharwad',
    plotId: 'sec_a_tomato',
    deviceId: 'NODE-01',
    sensorId: 'NODE-01',
    parameterKey: 'air_temperature',
    displayName: 'Ambient Air Temperature',
    value: 24.2,
    unit: '°C',
    measurementTimestamp: new Date(Date.now() - 1800000).toISOString(),
    receivedTimestamp: new Date(Date.now() - 1800000).toISOString(),
    qualityStatus: 'VALID',
    dataSource: 'MANUAL_PROTOTYPE',
    metadata: { operator: 'System Administrator' }
  },
  {
    id: 'obs_seed_03',
    farmId: 'farm_iiit_dharwad',
    plotId: 'sec_b_chilli',
    deviceId: 'NODE-02',
    sensorId: 'NODE-02',
    parameterKey: 'soil_moisture',
    displayName: 'Soil Volumetric Water Content',
    value: 54.2,
    unit: '%',
    measurementTimestamp: new Date(Date.now() - 3600000).toISOString(),
    receivedTimestamp: new Date(Date.now() - 3600000).toISOString(),
    qualityStatus: 'VALID',
    dataSource: 'MANUAL_PROTOTYPE',
    metadata: { operator: 'irappa' }
  }
];

interface AgriStoreContextType {
  crops: Crop[];
  farmlands: Farmland[];
  plots: PlotBed[];
  sensors: IoTSensor[];
  users: UserProfile[];
  auditLogs: AuditLogEntry[];
  telemetryObservations: TelemetryObservation[];
  activeFarmland: Farmland | null;
  activeSections: PlotBed[];
  currentUser: UserProfile | null;
  isAdmin: boolean;
  isWorker: boolean;
  isDemoTelemetryActive: boolean;
  toggleDemoTelemetry: (enable: boolean) => void;
  seedMultiFarmSystem: () => Promise<any>;
  setCurrentUser: (u: UserProfile | null) => void;
  selectFarmland: (farmId: string) => void;
  addFarmland: (farmData: Omit<Farmland, 'id' | 'createdAt'>, sectionsData: Array<Partial<PlotBed> & { code: string; name: string; area: number; cropId?: string | null }>) => void;
  addCrop: (cropData: Omit<Crop, 'id'>) => Crop;
  updateCrop: (cropData: Crop) => void;
  deleteCrop: (cropId: string) => void;
  assignCropToSection: (sectionId: string, cropId: string | null) => void;
  triggerActuator: (sectionId: string, type: 'irrigation' | 'hvac' | 'growLight', mode?: 'manual' | 'auto') => Promise<void>;
  addTelemetryObservation: (obsData: Omit<TelemetryObservation, 'id' | 'receivedTimestamp'>) => TelemetryObservation;
  addUser: (userData: Omit<UserProfile, 'uid' | 'created_at'>) => UserProfile;
  updateUserRole: (uid: string, role: 'admin' | 'farmer') => void;
  deleteUser: (uid: string) => void;
  exportFarmlandCsv: () => void;
}

const AgriStoreContext = createContext<AgriStoreContextType | undefined>(undefined);

const loadInitialState = <T,>(key: string, seed: T): T => {
  if (typeof window === 'undefined') return seed;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(seed) ? ((Array.isArray(parsed) ? parsed : seed) as unknown as T) : ((parsed || seed) as T);
  } catch (e) {
    return seed;
  }
};

// ── One-time migration: stamp farmId onto any stored plots that are missing it.
// Maps known seed plot IDs → their owning farm ID so existing localStorage
// data gets repaired without deleting any user-created plots.
const SEED_PLOT_FARM_MAP: Record<string, string> = {
  sec_a_tomato: 'farm_iiit_dharwad',
  sec_b_chilli: 'farm_iiit_dharwad',
  sec_c_cotton: 'farm_iiit_dharwad',
  sec_d_corn:   'farm_iiit_dharwad',
};

const migratePlotFarmIds = (plots: PlotBed[]): PlotBed[] => {
  if (!Array.isArray(plots)) return SEED_SECTIONS;
  let patched = false;
  const result = plots.map(p => {
    if (!p) return p;
    if (!p.farmId && SEED_PLOT_FARM_MAP[p.id]) {
      patched = true;
      return { ...p, farmId: SEED_PLOT_FARM_MAP[p.id] };
    }
    return p;
  });
  if (patched) {
    console.log('[FARM RELATIONSHIP] Migrated stored plots — stamped missing farmId values.');
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORE_KEYS.PLOTS, JSON.stringify(result));
    }
  }
  return result;
};

export const AgriStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [crops, setCrops] = useState<Crop[]>(() => loadInitialState(STORE_KEYS.CROPS, SEED_CROPS));
  const [farmlands, setFarmlands] = useState<Farmland[]>(() => loadInitialState(STORE_KEYS.FARMLANDS, SEEDED_FARMS));
  const [plots, setPlots] = useState<PlotBed[]>(() => loadInitialState(STORE_KEYS.PLOTS, SEEDED_PLOTS));
  const [sensors, setSensors] = useState<IoTSensor[]>(() => loadInitialState(STORE_KEYS.SENSORS, SEEDED_SENSORS));
  const [users, setUsers] = useState<UserProfile[]>(() => loadInitialState(STORE_KEYS.USERS, SEED_USERS));
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => loadInitialState(STORE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS));
  const [telemetryObservations, setTelemetryObservations] = useState<TelemetryObservation[]>(() => loadInitialState(STORE_KEYS.TELEMETRY_OBSERVATIONS, generateSeededTelemetry()));

  const [activeFarmId, setActiveFarmId] = useState<string>(() => {
    if (typeof window === 'undefined') return SEEDED_FARMS[0].id;
    return localStorage.getItem(STORE_KEYS.ACTIVE_FARM_ID) || SEEDED_FARMS[0].id;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return loadInitialState(STORE_KEYS.CURRENT_USER, SEED_USERS[0]);
  });

  const [isDemoTelemetryActive, setIsDemoTelemetryActive] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(STORE_KEYS.DEMO_TELEMETRY_ACTIVE);
    return stored === null ? true : stored === 'true';
  });

  // Automated Demo Data Seeder function
  const seedMultiFarmSystem = async () => {
    const res = await seedMultiFarmSystemToSupabase();
    setFarmlands(SEEDED_FARMS);
    setPlots(SEEDED_PLOTS);
    setSensors(SEEDED_SENSORS);
    setTelemetryObservations(generateSeededTelemetry());

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORE_KEYS.FARMLANDS, JSON.stringify(SEEDED_FARMS));
      localStorage.setItem(STORE_KEYS.PLOTS, JSON.stringify(SEEDED_PLOTS));
      localStorage.setItem(STORE_KEYS.SENSORS, JSON.stringify(SEEDED_SENSORS));
      localStorage.setItem(STORE_KEYS.TELEMETRY_OBSERVATIONS, JSON.stringify(generateSeededTelemetry()));
    }
    return res;
  };

  // 0. Seed farms, plots, and sensors to Supabase on mount
  useEffect(() => {
    saveFarmsToSupabase(farmlands);
    savePlotsToSupabase(plots);
    saveSensorsToSupabase(sensors);

    if (typeof window !== 'undefined') {
      (window as any).__agriSimulator = telemetrySimulator;
      console.log(
        '%c[AgriTwin Multi-Farm Engine] Active',
        'color: #3ecf8e; font-weight: bold; font-size: 12px;'
      );
      console.log(`  🟢 Supabase Status: ${isSupabaseConfigured ? 'CONNECTED' : 'STANDBY'}`);
      console.log('  📂 public.farms (5) | public.plots (25) | public.sensors (150) | public.telemetry_observations (1000+)');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1. Real-time Telemetry Subscription (Supabase Realtime)
  useEffect(() => {
    // Helper to merge incoming telemetry observations into state
    const processIncomingTelemetry = (incomingObs: TelemetryObservation[]) => {
      setTelemetryObservations(prev => {
        const obsMap = new Map<string, TelemetryObservation>();
        (prev || []).forEach(o => { if (o && o.id) obsMap.set(o.id, o); });
        (incomingObs || []).forEach(o => { if (o && o.id) obsMap.set(o.id, o); });

        const validObs = Array.from(obsMap.values()).filter(o => o && o.id && o.measurementTimestamp);
        const mergedList = validObs.sort((a, b) => {
          const tA = new Date(a.measurementTimestamp).getTime() || 0;
          const tB = new Date(b.measurementTimestamp).getTime() || 0;
          return tB - tA;
        });

        // Update active plot state from latest telemetry
        setPlots(prevPlots => prevPlots.map(plot => {
          const plotObs = mergedList.filter(o => o.plotId === plot.id || o.plotId === plot.code);
          if (plotObs.length === 0) return plot;

          const latestSm = plotObs.find(o => o.parameterKey === 'soil_moisture');
          const latestTemp = plotObs.find(o => o.parameterKey === 'air_temperature' || o.parameterKey === 'soil_temperature');
          const latestPh = plotObs.find(o => o.parameterKey === 'soil_ph');

          return {
            ...plot,
            soilMoisture: latestSm ? latestSm.value : plot.soilMoisture,
            airTemp: latestTemp ? latestTemp.value : plot.airTemp,
            soilPh: latestPh ? latestPh.value : plot.soilPh
          };
        }));

        return mergedList;
      });
    };

    const unsubSupabase = subscribeToSupabaseMultiTable(processIncomingTelemetry);

    return () => {
      unsubSupabase();
    };
  }, []);

  // 2. Control Telemetry Simulator Lifecycle based on isDemoTelemetryActive state
  useEffect(() => {
    if (isDemoTelemetryActive) {
      telemetrySimulator.start(
        () => plots,
        () => crops
      );
    } else {
      telemetrySimulator.stop();
    }
  }, [isDemoTelemetryActive, plots, crops]);

  const toggleDemoTelemetry = (enable: boolean) => {
    setIsDemoTelemetryActive(enable);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORE_KEYS.DEMO_TELEMETRY_ACTIVE, String(enable));
    }
  };

  // Save changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORE_KEYS.CROPS, JSON.stringify(crops));
      localStorage.setItem('agri_crops', JSON.stringify(crops));
    }
  }, [crops]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORE_KEYS.FARMLANDS, JSON.stringify(farmlands));
    }
  }, [farmlands]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORE_KEYS.PLOTS, JSON.stringify(plots));
      localStorage.setItem('agri_plots', JSON.stringify(plots));
      window.dispatchEvent(new Event('agri_storage_updated'));
    }
  }, [plots]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORE_KEYS.USERS, JSON.stringify(users));
    }
  }, [users]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
      localStorage.setItem('agri_field_audit_log', JSON.stringify(auditLogs));
    }
  }, [auditLogs]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORE_KEYS.TELEMETRY_OBSERVATIONS, JSON.stringify(telemetryObservations));
      window.dispatchEvent(new Event('agri_storage_updated'));
    }
  }, [telemetryObservations]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORE_KEYS.ACTIVE_FARM_ID, activeFarmId);
    }
  }, [activeFarmId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentUser) {
        localStorage.setItem(STORE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
        localStorage.setItem('agritwin_active_session', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORE_KEYS.CURRENT_USER);
        localStorage.removeItem('agritwin_active_session');
      }
    }
  }, [currentUser]);

  const activeFarmland = useMemo(() => {
    return farmlands.find(f => f.id === activeFarmId) || farmlands[0] || null;
  }, [farmlands, activeFarmId]);

  const activeSections = useMemo(() => {
    if (!activeFarmland) return [];
    const farmPlots = plots.filter(p => p.farmId === activeFarmland.id);
    const missingFarmId = farmPlots.filter(p => !p.farmId).length;
    // ── DIAGNOSTIC: Step 7 ──────────────────────────────────────────────────
    console.log(
      `[FARM RELATIONSHIP] farmId: ${activeFarmland.id} | farmName: "${activeFarmland.name}" | ` +
      `plots: ${farmPlots.length} | plotsMissingFarmId: ${missingFarmId}`
    );
    return farmPlots;
  }, [plots, activeFarmland]);

  const isAdmin = currentUser?.role === 'admin';
  const isWorker = currentUser?.role === 'farmer';

  const selectFarmland = (farmId: string) => {
    setActiveFarmId(farmId);
  };

  const addFarmland = (
    farmData: Omit<Farmland, 'id' | 'createdAt'>,
    sectionsData: Array<Partial<PlotBed> & { code: string; name: string; area: number; cropId?: string | null }>
  ) => {
    const farmId = `farm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newFarmland: Farmland = {
      ...farmData,
      id: farmId,
      createdAt: new Date().toISOString()
    };

    const newSections: PlotBed[] = sectionsData.map((sec, idx) => ({
      id: `plot_${farmId}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      farmId,
      code: sec.code,
      name: sec.name,
      area: sec.area,
      areaUnit: sec.areaUnit || farmData.unit || 'acres',
      areaSqm: sec.areaSqm || sec.area * 4046.86,
      cropId: sec.cropId || null,
      sensorNodeId: `NODE-${farmId.slice(-4)}-${sec.code}`,
      sensorId: `NODE-${farmId.slice(-4)}-${sec.code}`,
      soilMoisture: sec.soilMoisture ?? 62,
      airTemp: sec.airTemp ?? 25,
      soilPh: sec.soilPh ?? 6.5,
      parLux: sec.parLux ?? 680,
      daysPlanted: sec.daysPlanted ?? 1,
      isWatering: false,
      hvacActive: false,
      createdAt: new Date().toISOString()
    } as any));

    setFarmlands(prev => [newFarmland, ...prev]);
    setPlots(prev => [...prev, ...newSections]);
    setActiveFarmId(farmId);
  };

  const addCrop = (cropData: Omit<Crop, 'id'>): Crop => {
    const newCrop: Crop = {
      ...cropData,
      id: `crop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    setCrops(prev => [newCrop, ...prev]);
    return newCrop;
  };

  const updateCrop = (cropData: Crop) => {
    setCrops(prev => prev.map(c => c.id === cropData.id ? cropData : c));
  };

  const deleteCrop = (cropId: string) => {
    setCrops(prev => prev.filter(c => c.id !== cropId));
    setPlots(prev => prev.map(p => p.cropId === cropId ? { ...p, cropId: null } : p));
  };

  const assignCropToSection = (sectionId: string, cropId: string | null) => {
    setPlots(prev => prev.map(p => p.id === sectionId ? { ...p, cropId } : p));
  };

  const triggerActuator = async (
    sectionId: string, 
    type: 'irrigation' | 'hvac' | 'growLight', 
    mode: 'manual' | 'auto' = 'manual'
  ) => {
    const plot = plots.find(p => p.id === sectionId);
    const operator = currentUser?.full_name || 'System Operator';

    if (!plot) return;

    let updatedPlot = { ...plot };
    let details = '';

    if (type === 'irrigation') {
      const boostedMoisture = Math.min(95, Number((plot.soilMoisture + 8.5).toFixed(1)));
      updatedPlot = { ...plot, isWatering: true, soilMoisture: boostedMoisture };
      details = `${operator} executed 15-Min Precision Pulse on ${plot.code}. Moisture set to ${boostedMoisture}%. (${mode.toUpperCase()})`;
    } else if (type === 'hvac') {
      const nextHvac = !plot.hvacActive;
      const reducedTemp = nextHvac ? Number((plot.airTemp - 2.0).toFixed(1)) : plot.airTemp;
      updatedPlot = { ...plot, hvacActive: nextHvac, airTemp: reducedTemp };
      details = `${operator} toggled Canopy Fan ${nextHvac ? 'ON' : 'OFF'} on ${plot.code}. Temp adjusted to ${reducedTemp}°C. (${mode.toUpperCase()})`;
    } else {
      details = `${operator} toggled Grow Light on ${plot.code}. (${mode.toUpperCase()})`;
    }

    setPlots(prev => prev.map(p => p.id === sectionId ? updatedPlot : p));

    if (type === 'irrigation') {
      setTimeout(() => {
        setPlots(prev => prev.map(p => p.id === sectionId ? { ...p, isWatering: false } : p));
      }, 2000);
    }

    const newLog: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      plot_id: plot.id,
      plot_code: plot.code,
      action_type: type === 'growLight' ? 'grow_light' : type,
      triggered_by: mode,
      details
    };

    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addTelemetryObservation = (
    obsData: Omit<TelemetryObservation, 'id' | 'receivedTimestamp'>
  ): TelemetryObservation => {
    const id = `obs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newObs: TelemetryObservation = {
      ...obsData,
      id,
      receivedTimestamp: new Date().toISOString()
    };

    setTelemetryObservations(prev => [newObs, ...prev]);

    // Save directly to Supabase PostgreSQL database
    saveTelemetryObservationToSupabase(newObs);

    // Update target plot's Digital Twin state
    setPlots(prev => prev.map(p => {
      if (p.id === obsData.plotId || p.code === obsData.plotId) {
        const updated = { ...p };
        if (obsData.parameterKey === 'soil_moisture') updated.soilMoisture = obsData.value;
        if (obsData.parameterKey === 'air_temperature') updated.airTemp = obsData.value;
        if (obsData.parameterKey === 'soil_ph') updated.soilPh = obsData.value;
        return updated;
      }
      return p;
    }));

    // Record Audit Log Entry for manual observation
    const newAuditLog: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      plot_id: obsData.plotId,
      plot_code: obsData.plotId,
      action_type: 'manual_note',
      triggered_by: 'manual',
      details: `Manual Observation Submitted: ${obsData.displayName} = ${obsData.value} ${obsData.unit} [${obsData.dataSource}]`
    };

    setAuditLogs(prev => [newAuditLog, ...prev]);

    return newObs;
  };

  const addUser = (userData: Omit<UserProfile, 'uid' | 'created_at'>): UserProfile => {
    const uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newUser: UserProfile = {
      ...userData,
      uid,
      created_at: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUserRole = (uid: string, role: 'admin' | 'farmer') => {
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
    if (currentUser?.uid === uid) {
      setCurrentUser(prev => prev ? { ...prev, role } : null);
    }
  };

  const deleteUser = (uid: string) => {
    setUsers(prev => prev.filter(u => u.uid !== uid));
  };

  const exportFarmlandCsv = () => {
    if (!activeFarmland) return;
    const headers = ['Farmland Name', 'Location', 'Section Code', 'Section Name', 'Area', 'Unit', 'Assigned Crop', 'Node ID', 'Soil Moisture (%)', 'Air Temp (°C)', 'Soil pH'];
    const rows = activeSections.map(s => {
      const crop = crops.find(c => c.id === s.cropId);
      return [
        activeFarmland.name,
        activeFarmland.location,
        s.code,
        s.name,
        s.area,
        s.areaUnit,
        crop ? `${crop.name} (${crop.variety})` : 'Fallow Land',
        s.sensorNodeId,
        s.soilMoisture,
        s.airTemp,
        s.soilPh
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeFarmland.name.replace(/\s+/g, '_')}_manifest.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AgriStoreContext.Provider
      value={{
        crops,
        farmlands,
        plots,
        sensors,
        users,
        auditLogs,
        telemetryObservations,
        activeFarmland,
        activeSections,
        currentUser,
        isAdmin,
        isWorker,
        isDemoTelemetryActive,
        toggleDemoTelemetry,
        seedMultiFarmSystem,
        setCurrentUser,
        selectFarmland,
        addFarmland,
        addCrop,
        updateCrop,
        deleteCrop,
        assignCropToSection,
        triggerActuator,
        addTelemetryObservation,
        addUser,
        updateUserRole,
        deleteUser,
        exportFarmlandCsv
      }}
    >
      {children}
    </AgriStoreContext.Provider>
  );
};

export const useAgriStore = () => {
  const context = useContext(AgriStoreContext);
  if (!context) {
    throw new Error('useAgriStore must be used within an AgriStoreProvider');
  }
  return context;
};

export default useAgriStore;
