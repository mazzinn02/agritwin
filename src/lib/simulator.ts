import { getPlots, getCrops, getFarmProfile } from './farm-storage';

let demoModeEnabled = true;

export const seedDatabase = async () => {
  console.log('[SIMULATOR] Database seeded');
};

export const startSimulation = () => {
  console.log('[SIMULATOR] Legacy simulation started');
};
export const startSimulator = startSimulation;
