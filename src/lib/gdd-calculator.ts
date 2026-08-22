import { getPlots, getCrops } from './farm-storage';

export interface CropGddProfile {
  cropId: string;
  name: string;
  botanicalName: string;
  tBase: number; // Base temperature (°C)
  tUpper: number; // Upper cutoff temperature (°C)
  targetMaturityGdd: number; // Total GDD required for full harvest
  stageThresholdsGdd: {
    seedling: number;     // 0 -> seedling max
    vegetative: number;   // seedling -> vegetative max
    flowering: number;    // vegetative -> flowering max
    fruitSet: number;     // flowering -> fruit set max
    harvest: number;      // fruit set -> harvest maturity
  };
  durationDays: number;
}

export type PhenologicalStageKey = 'seedling' | 'vegetative' | 'flowering' | 'fruitSet' | 'harvest';

export interface PhenologicalStageInfo {
  key: PhenologicalStageKey;
  label: string;
  description: string;
  minGdd: number;
  maxGdd: number;
  stageIndex: number;
}

export const STAGES_ORDER: { key: PhenologicalStageKey; label: string; description: string }[] = [
  { key: 'seedling', label: 'Seedling', description: 'Emergence & early root establishment' },
  { key: 'vegetative', label: 'Vegetative', description: 'Rapid canopy expansion & stem elongation' },
  { key: 'flowering', label: 'Flowering', description: 'Anthesis, bloom & pollination' },
  { key: 'fruitSet', label: 'Fruit Set', description: 'Fruit development & breaker color change' },
  { key: 'harvest', label: 'Harvest Maturity', description: 'Optimal ripeness & harvest window' },
];

/**
 * Standard Daily GDD Equation:
 * GDD = max(0, ((T_max + T_min) / 2) - T_base)
 * with T_upper ceiling cap if specified.
 */
export function calculateDailyGdd(tMax: number, tMin: number, tBase: number, tUpper?: number): number {
  let effMax = tMax;
  let effMin = tMin;

  if (tUpper !== undefined) {
    effMax = Math.min(effMax, tUpper);
    effMin = Math.min(effMin, tUpper);
  }

  const avgTemp = (effMax + effMin) / 2;
  return Math.max(0, +(avgTemp - tBase).toFixed(2));
}

export interface GrowthStatusResult {
  currentStage: PhenologicalStageInfo;
  stageIndex: number; // 0 to 4
  stageCompletionPct: number; // 0 to 100
  totalMaturityPct: number; // 0 to 100
  accumulatedGdd: number;
  targetMaturityGdd: number;
  dap: number; // Days after planting
  totalDurationDays: number;
  daysToNextStage: number;
  dailyGddRate: number;
  stageHealthIndex: 'Ahead of Schedule' | 'On Track' | 'Delayed (Temp Stress)';
  stageHealthColor: string;
  stagesList: (PhenologicalStageInfo & { isCurrent: boolean; isCompleted: boolean; isUpcoming: boolean })[];
}

export function computeGrowthStatus(
  plotId?: string,
  currentTemp: number = 24.5,
  simulatedDapOffset?: number
): GrowthStatusResult {
  const plots = getPlots();
  const crops = getCrops();
  
  const plot = (plotId ? plots.find(p => p.id === plotId || p.code === plotId) : plots[0]) || plots[0];
  const crop = plot && plot.cropId ? crops.find(c => c.id === plot.cropId) : crops[0];

  const durationDays = crop?.growthDurationDays || 90;
  const tBase = crop?.idealTempMin ? Math.max(5, crop.idealTempMin - 10) : 10.0;
  const tUpper = crop?.idealTempMax ? crop.idealTempMax + 5 : 33.0;
  const targetMaturityGdd = durationDays * 14;

  const thresholds = {
    seedling: Math.round(targetMaturityGdd * 0.15),
    vegetative: Math.round(targetMaturityGdd * 0.40),
    flowering: Math.round(targetMaturityGdd * 0.65),
    fruitSet: Math.round(targetMaturityGdd * 0.88),
    harvest: targetMaturityGdd,
  };

  const dap = simulatedDapOffset ?? (plot?.daysPlanted || 1);

  // Daily GDD rate based on current temp
  const tMax = currentTemp + 4.5;
  const tMin = currentTemp - 4.5;
  const dailyRate = calculateDailyGdd(tMax, tMin, tBase, tUpper) || 12.5;

  // Accumulated GDD estimation
  const expectedGddPace = dap * dailyRate;
  const accumulatedGdd = Math.min(targetMaturityGdd, +expectedGddPace.toFixed(1));

  // Determine stage boundaries
  const stageRanges: PhenologicalStageInfo[] = [
    { key: 'seedling', label: 'Seedling', description: 'Emergence & early root establishment', minGdd: 0, maxGdd: thresholds.seedling, stageIndex: 0 },
    { key: 'vegetative', label: 'Vegetative', description: 'Canopy expansion & stem elongation', minGdd: thresholds.seedling, maxGdd: thresholds.vegetative, stageIndex: 1 },
    { key: 'flowering', label: 'Flowering', description: 'Anthesis & pollination phase', minGdd: thresholds.vegetative, maxGdd: thresholds.flowering, stageIndex: 2 },
    { key: 'fruitSet', label: 'Fruit Set', description: 'Fruit development & ripening', minGdd: thresholds.flowering, maxGdd: thresholds.fruitSet, stageIndex: 3 },
    { key: 'harvest', label: 'Harvest Maturity', description: 'Optimal harvest readiness', minGdd: thresholds.fruitSet, maxGdd: thresholds.harvest, stageIndex: 4 },
  ];

  let currentStage = stageRanges[0];
  let stageIndex = 0;

  for (let i = 0; i < stageRanges.length; i++) {
    const s = stageRanges[i];
    if (accumulatedGdd >= s.minGdd && (accumulatedGdd < s.maxGdd || i === stageRanges.length - 1)) {
      currentStage = s;
      stageIndex = i;
      break;
    }
  }

  // Calculate completion within current stage
  const stageRangeSpan = Math.max(1, currentStage.maxGdd - currentStage.minGdd);
  const stageProgressGdd = Math.max(0, accumulatedGdd - currentStage.minGdd);
  const stageCompletionPct = Math.min(100, Math.max(0, +( (stageProgressGdd / stageRangeSpan) * 100 ).toFixed(1)));

  // Total maturity percentage
  const totalMaturityPct = Math.min(100, +( (accumulatedGdd / targetMaturityGdd) * 100 ).toFixed(1));

  // Days to next stage
  const gddRemainingInStage = Math.max(0, currentStage.maxGdd - accumulatedGdd);
  const daysToNextStage = dailyRate > 0 ? Math.ceil(gddRemainingInStage / dailyRate) : 0;

  let stageHealthIndex: 'Ahead of Schedule' | 'On Track' | 'Delayed (Temp Stress)' = 'On Track';
  let stageHealthColor = '#06b6d4'; // Cyan

  const expectedDapForGdd = (accumulatedGdd / targetMaturityGdd) * durationDays;
  if (dap < expectedDapForGdd - 3) {
    stageHealthIndex = 'Ahead of Schedule';
    stageHealthColor = '#10b981'; // Emerald
  } else if (dap > expectedDapForGdd + 4 || currentTemp < tBase + 3) {
    stageHealthIndex = 'Delayed (Temp Stress)';
    stageHealthColor = '#f59e0b'; // Amber
  }

  const stagesList = stageRanges.map((st, idx) => ({
    ...st,
    isCurrent: idx === stageIndex,
    isCompleted: idx < stageIndex,
    isUpcoming: idx > stageIndex,
  }));

  return {
    currentStage,
    stageIndex,
    stageCompletionPct,
    totalMaturityPct,
    accumulatedGdd,
    targetMaturityGdd,
    dap,
    totalDurationDays: durationDays,
    daysToNextStage,
    dailyGddRate: +(dailyRate).toFixed(1),
    stageHealthIndex,
    stageHealthColor,
    stagesList,
  };
}
