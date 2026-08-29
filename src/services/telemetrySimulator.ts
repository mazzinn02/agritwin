import { PlotBed, Crop, TelemetryObservation } from '../types';
import { getParameterDefinition } from '../lib/parameters';
import { saveTelemetryBatchToFirestore } from '../lib/firebase';
import { saveTelemetryBatchToSupabase } from '../lib/supabase';

// ─── SIMULATION INTERVAL ────────────────────────────────────────────────────
// Data is generated every 12 seconds and written directly to:
//   Firestore DB → collection: "telemetry_observations"
// Each document has: farmId, plotId, sensorId, parameterKey, value, dataSource: "SIMULATED"
export const DEMO_TELEMETRY_INTERVAL_MS = 12000;

class TelemetrySimulatorService {
  private timerId: any = null;
  private intervalMs: number = DEMO_TELEMETRY_INTERVAL_MS;
  private isRunning: boolean = false;
  private simulationSessionId: string = `sim_session_${Date.now()}`;
  private plotParamState: Record<string, number> = {};
  private getPlotsFn: (() => PlotBed[]) | null = null;
  private getCropsFn: (() => Crop[]) | null = null;
  private lastCycleTime: number | null = null;

  public getSessionId(): string {
    return this.simulationSessionId;
  }

  public isSimulating(): boolean {
    return this.isRunning;
  }

  public getLastCycleTime(): number | null {
    return this.lastCycleTime;
  }

  public getIntervalMs(): number {
    return this.intervalMs;
  }

  public setIntervalMs(ms: number) {
    this.intervalMs = Math.max(5000, ms);
    if (this.isRunning) {
      this.stop();
    }
  }

  public start(
    getPlots: () => PlotBed[],
    getCrops: () => Crop[],
    onGenerated?: (observations: TelemetryObservation[]) => void
  ) {
    this.getPlotsFn = getPlots;
    this.getCropsFn = getCrops;

    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.simulationSessionId = `sim_session_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    console.log(`TelemetrySimulator STARTED [Session: ${this.simulationSessionId}, Interval: ${this.intervalMs}ms]`);

    // Run first generation cycle immediately after 1 second delay
    setTimeout(() => {
      if (this.isRunning) {
        this.generateAndPersistCycle(onGenerated);
      }
    }, 1000);

    // Set recurring timer
    this.timerId = setInterval(() => {
      if (this.isRunning) {
        this.generateAndPersistCycle(onGenerated);
      }
    }, this.intervalMs);
  }

  public stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.isRunning) {
      this.isRunning = false;
      console.log('TelemetrySimulator STOPPED cleanly.');
    }
  }

  private async generateAndPersistCycle(
    onGenerated?: (observations: TelemetryObservation[]) => void
  ) {
    const plots = this.getPlotsFn ? this.getPlotsFn() : [];
    const crops = this.getCropsFn ? this.getCropsFn() : [];

    if (!plots || plots.length === 0) {
      console.log('TelemetrySimulator: No active plots found for generation cycle.');
      return;
    }

    const generatedObs: TelemetryObservation[] = [];
    const nowIso = new Date().toISOString();
    const currentHour = new Date().getHours() + new Date().getMinutes() / 60;
    this.lastCycleTime = Date.now();


    let eligibleCount = 0;
    let skippedNoFarm = 0;
    let skippedNoSensor = 0;
    let skippedNoCrop = 0;

    for (const plot of plots) {
      // ── GUARD 1: farm ownership ────────────────────────────────────────────
      const farmId = plot.farmId;
      if (!farmId) {
        console.log(`TelemetrySimulator: Skipping plot ${plot.id} — no farmId configured.`);
        skippedNoFarm++;
        continue;
      }

      // ── GUARD 2: sensor ownership ──────────────────────────────────────────
      const nodeCode = plot.sensorNodeId || plot.sensorId;
      if (!nodeCode) {
        console.log(`TelemetrySimulator: Skipping plot ${plot.id} — no sensor configured.`);
        skippedNoSensor++;
        continue;
      }

      // ── GUARD 3: crop ownership (fallow plots produce no crop telemetry) ───
      if (!plot.cropId) {
        skippedNoCrop++;
        continue;
      }

      eligibleCount++;
      const crop = crops.find(c => c.id === plot.cropId) || null;
      const plotId = plot.id;

      // 1. Soil Moisture (%)
      const moistureKey = `${plotId}_soil_moisture`;
      const prevMoisture = this.plotParamState[moistureKey] ?? plot.soilMoisture ?? 62.0;
      let nextMoisture = prevMoisture - (0.15 + Math.random() * 0.25);
      if (plot.isWatering) nextMoisture += 6.5;
      const minM = crop ? crop.idealMoistureMin - 5 : 40;
      const maxM = crop ? crop.idealMoistureMax + 5 : 85;
      nextMoisture = Math.max(minM, Math.min(maxM, Number(nextMoisture.toFixed(1))));
      this.plotParamState[moistureKey] = nextMoisture;

      const pDefMoisture = getParameterDefinition('soil_moisture');
      generatedObs.push({
        id: `sim_${Date.now()}_${plot.code}_sm_${Math.random().toString(36).substring(2, 6)}`,
        farmId,
        plotId,
        deviceId: nodeCode,
        sensorId: nodeCode,
        parameterKey: 'soil_moisture',
        displayName: pDefMoisture.displayName,
        value: nextMoisture,
        unit: pDefMoisture.unit,
        measurementTimestamp: nowIso,
        receivedTimestamp: nowIso,
        qualityStatus: 'VALID',
        dataSource: 'SIMULATED',
        notes: 'Simulated real-time prototype telemetry reading',
        metadata: {
          generated: true,
          generatorVersion: '1.0',
          simulationSessionId: this.simulationSessionId,
          generatedAt: nowIso
        }
      });

      // 2. Air Temperature (°C)
      const tempKey = `${plotId}_air_temperature`;
      const diurnalTemp = 20 + 7 * Math.sin(((currentHour - 8) / 24) * 2 * Math.PI);
      const randomNoise = (Math.random() - 0.5) * 0.6;
      let nextTemp = diurnalTemp + randomNoise;
      if (plot.hvacActive) nextTemp -= 2.0;
      nextTemp = Math.max(15.0, Math.min(42.0, Number(nextTemp.toFixed(1))));
      this.plotParamState[tempKey] = nextTemp;

      const pDefTemp = getParameterDefinition('air_temperature');
      generatedObs.push({
        id: `sim_${Date.now()}_${plot.code}_temp_${Math.random().toString(36).substring(2, 6)}`,
        farmId,
        plotId,
        deviceId: nodeCode,
        sensorId: nodeCode,
        parameterKey: 'air_temperature',
        displayName: pDefTemp.displayName,
        value: nextTemp,
        unit: pDefTemp.unit,
        measurementTimestamp: nowIso,
        receivedTimestamp: nowIso,
        qualityStatus: 'VALID',
        dataSource: 'SIMULATED',
        notes: 'Simulated real-time ambient canopy temperature',
        metadata: {
          generated: true,
          generatorVersion: '1.0',
          simulationSessionId: this.simulationSessionId,
          generatedAt: nowIso
        }
      });

      // 3. Soil pH
      const phKey = `${plotId}_soil_ph`;
      const prevPh = this.plotParamState[phKey] ?? plot.soilPh ?? 6.5;
      const phDrift = (Math.random() - 0.5) * 0.04;
      const idealPh = crop ? (crop.idealPhMin + crop.idealPhMax) / 2 : 6.5;
      let nextPh = prevPh + phDrift + (idealPh - prevPh) * 0.05;
      nextPh = Math.max(5.5, Math.min(8.0, Number(nextPh.toFixed(2))));
      this.plotParamState[phKey] = nextPh;

      const pDefPh = getParameterDefinition('soil_ph');
      generatedObs.push({
        id: `sim_${Date.now()}_${plot.code}_ph_${Math.random().toString(36).substring(2, 6)}`,
        farmId,
        plotId,
        deviceId: nodeCode,
        sensorId: nodeCode,
        parameterKey: 'soil_ph',
        displayName: pDefPh.displayName,
        value: nextPh,
        unit: pDefPh.unit,
        measurementTimestamp: nowIso,
        receivedTimestamp: nowIso,
        qualityStatus: 'VALID',
        dataSource: 'SIMULATED',
        notes: 'Simulated real-time soil pH value',
        metadata: {
          generated: true,
          generatorVersion: '1.0',
          simulationSessionId: this.simulationSessionId,
          generatedAt: nowIso
        }
      });

      // 4. Humidity (%)
      const pDefHum = getParameterDefinition('humidity');
      let nextHum = Math.max(40, Math.min(90, 92 - (nextTemp - 15) * 2.2 + (Math.random() - 0.5) * 2));
      nextHum = Number(nextHum.toFixed(1));

      generatedObs.push({
        id: `sim_${Date.now()}_${plot.code}_hum_${Math.random().toString(36).substring(2, 6)}`,
        farmId,
        plotId,
        deviceId: nodeCode,
        sensorId: nodeCode,
        parameterKey: 'humidity',
        displayName: pDefHum.displayName,
        value: nextHum,
        unit: pDefHum.unit,
        measurementTimestamp: nowIso,
        receivedTimestamp: nowIso,
        qualityStatus: 'VALID',
        dataSource: 'SIMULATED',
        notes: 'Simulated real-time atmospheric humidity',
        metadata: {
          generated: true,
          generatorVersion: '1.0',
          simulationSessionId: this.simulationSessionId,
          generatedAt: nowIso
        }
      });
    }

    console.log(
      `%c[🌱 TELEMETRY SIMULATOR] Cycle fired at ${new Date().toLocaleTimeString()}`,
      'color: #10b981; font-weight: bold; font-size: 11px;'
    );
    console.log(
      `  eligible plots: ${eligibleCount} | ` +
      `skipped(no farmId): ${skippedNoFarm} | ` +
      `skipped(no sensor): ${skippedNoSensor} | ` +
      `skipped(fallow): ${skippedNoCrop} | ` +
      `observations generated: ${generatedObs.length}`
    );
    console.log(
      `  📦 Writing ${generatedObs.length} docs → Firestore collection: "telemetry_observations" [dataSource: SIMULATED]`
    );

    if (generatedObs.length === 0) return;

    // 1. Persist generated observations to Supabase PostgreSQL
    try {
      await saveTelemetryBatchToSupabase(generatedObs);
    } catch (err: any) {
      console.warn('TelemetrySimulator: Supabase write notice:', err?.message);
    }

    // 2. Persist to Firestore (fallback/secondary)
    try {
      await saveTelemetryBatchToFirestore(generatedObs);
      console.log(`TelemetrySimulator: Persisted ${generatedObs.length} simulated observations.`);
    } catch (err: any) {
      console.error('TelemetrySimulator: Firestore write failed:', err);
    }

    // Trigger local callback if provided
    if (onGenerated) {
      onGenerated(generatedObs);
    }
  }
}

export const telemetrySimulator = new TelemetrySimulatorService();
export default telemetrySimulator;
