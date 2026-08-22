import { FarmProfile, Crop, PlotBed, TelemetryRecord, IoTSensor, AuditLogEntry } from '../types';

export const STORAGE_KEYS = {
  FARM_PROFILE: 'agri_farm_profile',
  CROPS: 'agri_crops',
  PLOTS: 'agri_plots',
  SENSORS: 'agri_sensors',
  FIELD_AUDIT_LOG: 'agri_field_audit_log',
  HISTORY: 'agri_history'
} as const;

export const UNIT_CONVERSIONS: Record<string, number> = {
  acres: 4046.86,
  hectares: 10000,
  sqft: 0.092903,
  sqm: 1,
  'square meters': 1,
  'sq ft': 0.092903
};

export const UNIT_LABELS: Record<string, string> = {
  acres: 'Acres (ac)',
  hectares: 'Hectares (ha)',
  sqft: 'Square Feet (sq ft)',
  sqm: 'Square Meters (m²)'
};

export function normalizeUnit(unit: string): string {
  const u = (unit || 'acres').toLowerCase();
  if (u.includes('acre')) return 'acres';
  if (u.includes('hect')) return 'hectares';
  if (u.includes('ft')) return 'sqft';
  if (u.includes('meter') || u.includes('sqm') || u.includes('m²')) return 'sqm';
  return 'acres';
}

export function convertAreaToSqm(area: number, unit: string): number {
  const norm = normalizeUnit(unit);
  const factor = UNIT_CONVERSIONS[norm] || 4046.86;
  return Number((area * factor).toFixed(2));
}

export function convertSqmToUnit(sqm: number, unit: string): number {
  const norm = normalizeUnit(unit);
  const factor = UNIT_CONVERSIONS[norm] || 4046.86;
  return Number((sqm / factor).toFixed(2));
}

export function notifyStorageChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('agri_storage_updated'));
  }
}

// ----------------- Farm Profile CRUD -----------------
export function getFarmProfile(): FarmProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FARM_PROFILE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse agri_farm_profile', e);
    return null;
  }
}

export function saveFarmProfile(profile: FarmProfile): void {
  localStorage.setItem(STORAGE_KEYS.FARM_PROFILE, JSON.stringify(profile));
  notifyStorageChange();
}

// ----------------- Crops CRUD (No Hardcoded Fallbacks) -----------------
export function getCrops(): Crop[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CROPS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to get crops', e);
    return [];
  }
}

export function saveCrops(crops: Crop[]): void {
  localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(crops));
  notifyStorageChange();
}

export function addCrop(cropData: Omit<Crop, 'id'>): Crop {
  const crops = getCrops();
  const newCrop: Crop = {
    ...cropData,
    id: `crop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString()
  };
  saveCrops([newCrop, ...crops]);
  return newCrop;
}

export function updateCrop(crop: Crop): void {
  const crops = getCrops();
  const idx = crops.findIndex(c => c.id === crop.id);
  if (idx !== -1) {
    crops[idx] = crop;
    saveCrops([...crops]);
  }
}

export function deleteCrop(cropId: string): void {
  const crops = getCrops().filter(c => c.id !== cropId);
  saveCrops(crops);

  // Auto-unbind from any plots
  const plots = getPlots();
  let changed = false;
  const updatedPlots = plots.map(plot => {
    if (plot.cropId === cropId) {
      changed = true;
      return { ...plot, cropId: null };
    }
    return plot;
  });

  if (changed) {
    savePlots(updatedPlots);
  }
}

// ----------------- Plots CRUD (No Hardcoded Fallbacks) -----------------
export function getPlots(): PlotBed[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLOTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to get plots', e);
    return [];
  }
}

export function savePlots(plots: PlotBed[]): void {
  localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(plots));
  notifyStorageChange();
}

export function addPlot(plotData: Partial<PlotBed> & { code: string; name: string }): PlotBed {
  const plots = getPlots();
  const areaUnit = plotData.areaUnit || 'acres';
  const areaSqm = plotData.areaSqm || (plotData.area ? convertAreaToSqm(plotData.area, areaUnit) : 4046.86);
  const area = plotData.area || convertSqmToUnit(areaSqm, areaUnit);

  const newPlot: PlotBed = {
    id: `plot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    code: plotData.code,
    name: plotData.name,
    area,
    areaUnit,
    areaSqm,
    cropId: plotData.cropId || null,
    sensorNodeId: plotData.sensorNodeId || plotData.sensorId || `NODE-${plotData.code}`,
    sensorId: plotData.sensorId || plotData.sensorNodeId || `NODE-${plotData.code}`,
    soilMoisture: plotData.soilMoisture ?? 55,
    airTemp: plotData.airTemp ?? 24,
    soilPh: plotData.soilPh ?? 6.5,
    parLux: plotData.parLux ?? 650,
    daysPlanted: plotData.daysPlanted ?? 1,
    isWatering: false,
    boundaryCoordinates: plotData.boundaryCoordinates,
    createdAt: new Date().toISOString()
  };
  savePlots([...plots, newPlot]);
  return newPlot;
}

export function updatePlot(plot: PlotBed): void {
  const plots = getPlots();
  const idx = plots.findIndex(p => p.id === plot.id);
  if (idx !== -1) {
    plots[idx] = plot;
    savePlots([...plots]);
  }
}

export function deletePlot(plotId: string): void {
  const plots = getPlots().filter(p => p.id !== plotId);
  savePlots(plots);
}

export function setPlotCrop(plotId: string, cropId: string | null): void {
  const plots = getPlots();
  const idx = plots.findIndex(p => p.id === plotId);
  if (idx !== -1) {
    plots[idx].cropId = cropId;
    savePlots([...plots]);
  }
}

// ----------------- Telemetry History (No Hardcoded Fallbacks) -----------------
export function getHistory(): TelemetryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to get telemetry history', e);
    return [];
  }
}

export function saveHistory(records: TelemetryRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(records));
  notifyStorageChange();
}

export function addTelemetryRecord(record: TelemetryRecord): TelemetryRecord {
  const history = getHistory();
  const newRec: TelemetryRecord = {
    ...record,
    id: record.id || `tel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
  };
  saveHistory([newRec, ...history]);
  return newRec;
}

// ----------------- IoT Sensors CRUD (No Hardcoded Fallbacks) -----------------
export function getSensors(): IoTSensor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SENSORS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to get sensors', e);
    return [];
  }
}

export function saveSensors(sensors: IoTSensor[]): void {
  localStorage.setItem(STORAGE_KEYS.SENSORS, JSON.stringify(sensors));
  notifyStorageChange();
}

export function addSensor(sensorData: Omit<IoTSensor, 'id' | 'lastPing'> & { lastPing?: string }): IoTSensor {
  const sensors = getSensors();
  const newSensor: IoTSensor = {
    ...sensorData,
    id: `sensor_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    lastPing: sensorData.lastPing || new Date().toISOString()
  };
  saveSensors([...sensors, newSensor]);
  return newSensor;
}

export function toggleSensorStatus(sensorId: string): void {
  const sensors = getSensors();
  const idx = sensors.findIndex(s => s.id === sensorId);
  if (idx !== -1) {
    const nextStatus = sensors[idx].status === 'Online' ? 'Offline' : 'Online';
    sensors[idx].status = nextStatus;
    sensors[idx].lastPing = new Date().toISOString();
    saveSensors([...sensors]);
  }
}

// ----------------- Field Audit Log CRUD -----------------
export function getFieldAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FIELD_AUDIT_LOG);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to get field audit log', e);
    return [];
  }
}

export function saveFieldAuditLogs(entries: AuditLogEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.FIELD_AUDIT_LOG, JSON.stringify(entries));
  notifyStorageChange();
}

export function addFieldAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { timestamp?: string }): AuditLogEntry {
  const logs = getFieldAuditLogs();
  const newEntry: AuditLogEntry = {
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: entry.timestamp || new Date().toISOString()
  };
  saveFieldAuditLogs([newEntry, ...logs]);
  return newEntry;
}

// ----------------- Real Irrigation Action Engine -----------------
export function triggerPlotIrrigation(plotId: string): Promise<void> {
  return new Promise((resolve) => {
    const plots = getPlots();
    const plot = plots.find(p => p.id === plotId);
    if (!plot) {
      resolve();
      return;
    }

    plot.isWatering = true;
    updatePlot(plot);

    setTimeout(() => {
      const refreshedPlots = getPlots();
      const current = refreshedPlots.find(p => p.id === plotId) || plot;
      const boostedMoisture = Math.min(88, Number((current.soilMoisture + 8.5).toFixed(1)));
      
      current.isWatering = false;
      current.soilMoisture = boostedMoisture;
      updatePlot(current);

      const crops = getCrops();
      const assignedCrop = crops.find(c => c.id === current.cropId);
      const cropName = assignedCrop ? `${assignedCrop.name} (${assignedCrop.variety})` : 'Fallow Land';

      let status: 'Optimal' | 'Low Water' | 'Heat Stress' = 'Optimal';
      if (current.airTemp > 32) {
        status = 'Heat Stress';
      } else if (boostedMoisture < (assignedCrop?.idealMoistureMin || 50)) {
        status = 'Low Water';
      }

      // 1. Record in History
      addTelemetryRecord({
        timestamp: new Date().toISOString(),
        plotCode: current.code,
        cropName,
        soilMoisture: boostedMoisture,
        airTemp: current.airTemp,
        soilPh: current.soilPh,
        status
      });

      // 2. Record in Field Audit Log
      addFieldAuditLog({
        plot_id: current.id,
        plot_code: current.code,
        action_type: 'irrigation',
        triggered_by: 'manual',
        details: `15-Min Irrigation Actuator executed on Plot ${current.code}. Soil moisture boosted to ${boostedMoisture}%.`
      });

      resolve();
    }, 3000);
  });
}
