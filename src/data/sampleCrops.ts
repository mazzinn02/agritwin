import { DigitalTwinCropState, CropParameter } from '../types';

export const INITIAL_TWIN_STATE: DigitalTwinCropState = {
  cropType: 'Winter Wheat',
  plantingDate: '2026-05-15',
  currentDay: 48,
  stage: 'Flowering',
  healthScore: 92,
  plantHeightCm: 68.5,
  canopyCoveragePercent: 78.4,
  growthRateCmPerDay: 1.4,
  diseaseRiskPercent: 8.5,
  diseaseDetected: 'Healthy (Minor Spot Risk)',
  fruitRipenessPercent: 42.0,
  estimatedYieldKgPerM2: 7.8,
  sensors: {
    id: 'NODE-ALPHA-01',
    name: 'North Sector IoT Gateway',
    temperature: 24.5,
    humidity: 62,
    soilMoisture: 48,
    sunlightLux: 45000,
    co2Level: 412,
    lastUpdated: 'Just now',
    status: 'online',
  },
  alerts: [
    { id: 'a1', type: 'disease', severity: 'low', message: 'Minor leaf spot risk detected in North Sector', timestamp: '2h ago', isRead: false },
    { id: 'a2', type: 'moisture', severity: 'medium', message: 'Soil moisture dropping below optimal threshold', timestamp: '5h ago', isRead: false }
  ],
};

export const CROP_PRESETS: Record<string, DigitalTwinCropState> = {
  'Winter Wheat': INITIAL_TWIN_STATE,
  'Roma Tomatoes': {
    cropType: 'Roma Tomatoes',
    plantingDate: '2026-06-01',
    currentDay: 55,
    stage: 'Fruit Set',
    healthScore: 88,
    plantHeightCm: 112.0,
    canopyCoveragePercent: 82.5,
    growthRateCmPerDay: 2.1,
    diseaseRiskPercent: 14.0,
    diseaseDetected: 'Early Blight Warning',
    fruitRipenessPercent: 65.0,
    estimatedYieldKgPerM2: 12.4,
    sensors: {
      id: 'NODE-TOM-02',
      name: 'Polyhouse Zone B',
      temperature: 27.2,
      humidity: 68,
      soilMoisture: 55,
      sunlightLux: 52000,
      co2Level: 440,
      lastUpdated: '1 min ago',
      status: 'online',
    },
    alerts: [
      { id: 't1', type: 'disease', severity: 'medium', message: 'Early Blight Warning - Polyhouse Zone B', timestamp: '1h ago', isRead: false },
    ],
  },
  'Golden Corn (Maize)': {
    cropType: 'Golden Corn (Maize)',
    plantingDate: '2026-05-01',
    currentDay: 62,
    stage: 'Vegetative',
    healthScore: 95,
    plantHeightCm: 185.0,
    canopyCoveragePercent: 89.0,
    growthRateCmPerDay: 3.2,
    diseaseRiskPercent: 5.0,
    diseaseDetected: 'Optimal Health',
    fruitRipenessPercent: 30.0,
    estimatedYieldKgPerM2: 10.2,
    sensors: {
      id: 'NODE-CORN-03',
      name: 'South Basin Plot',
      temperature: 26.0,
      humidity: 58,
      soilMoisture: 50,
      sunlightLux: 61000,
      co2Level: 405,
      lastUpdated: 'Just now',
      status: 'online',
    },
    alerts: [],
  },
};

export const PARAMETER_METADATA = [
  {
    id: 'height',
    name: 'Plant Height Detection',
    unit: 'cm',
    description: 'Measures vertical size and stem elongation using LiDAR & computer vision camera array.',
    iconName: 'Ruler',
    color: '#10B981', // emerald
  },
  {
    id: 'canopy',
    name: 'Canopy Coverage Detection',
    unit: '%',
    description: 'Determines leaf surface area and NDVI ground coverage to evaluate light interception.',
    iconName: 'Maximize',
    color: '#84CC16', // lime
  },
  {
    id: 'growth',
    name: 'Growth Detection',
    unit: 'cm/day',
    description: 'Tracks temporal growth velocity and biometric biomass acceleration across crop cycles.',
    iconName: 'TrendingUp',
    color: '#06B6D4', // cyan
  },
  {
    id: 'disease',
    name: 'Disease Detection',
    unit: '% risk',
    description: 'AI vision spectral analysis for early pathogen identification, leaf lesions, and stress.',
    iconName: 'ShieldAlert',
    color: '#EF4444', // red
  },
  {
    id: 'ripeness',
    name: 'Fruit Ripeness Detection',
    unit: '% mature',
    description: 'HSV color indexing & spectral reflectance assessing fruit sugar/harvest maturity.',
    iconName: 'Apple',
    color: '#F59E0B', // amber
  },
  {
    id: 'yield',
    name: 'Crop Yield Estimation',
    unit: 'kg/m²',
    description: 'Predictive machine learning algorithm calculating final harvest yield based on twin metrics.',
    iconName: 'Sprout',
    color: '#8B5CF6', // purple
  },
];
