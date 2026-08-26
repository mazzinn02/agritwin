import { ParameterDefinition } from '../types';

export const AGRICULTURAL_PARAMETERS: ParameterDefinition[] = [
  {
    key: 'soil_moisture',
    displayName: 'Soil Volumetric Water Content',
    unit: '%',
    category: 'soil',
    minRange: 0,
    maxRange: 100
  },
  {
    key: 'air_temperature',
    displayName: 'Ambient Air Temperature',
    unit: '°C',
    category: 'atmosphere',
    minRange: -10,
    maxRange: 60
  },
  {
    key: 'soil_temperature',
    displayName: 'Root Zone Soil Temperature',
    unit: '°C',
    category: 'soil',
    minRange: -10,
    maxRange: 50
  },
  {
    key: 'humidity',
    displayName: 'Relative Air Humidity',
    unit: '%',
    category: 'atmosphere',
    minRange: 0,
    maxRange: 100
  },
  {
    key: 'soil_ph',
    displayName: 'Soil Acidity / pH Level',
    unit: 'pH',
    category: 'soil',
    minRange: 0,
    maxRange: 14
  },
  {
    key: 'nitrogen',
    displayName: 'Available Nitrogen (N)',
    unit: 'mg/kg',
    category: 'soil',
    minRange: 0,
    maxRange: 300
  },
  {
    key: 'phosphorus',
    displayName: 'Available Phosphorus (P)',
    unit: 'mg/kg',
    category: 'soil',
    minRange: 0,
    maxRange: 200
  },
  {
    key: 'potassium',
    displayName: 'Available Potassium (K)',
    unit: 'mg/kg',
    category: 'soil',
    minRange: 0,
    maxRange: 400
  },
  {
    key: 'rainfall',
    displayName: 'Cumulative Rainfall',
    unit: 'mm',
    category: 'atmosphere',
    minRange: 0,
    maxRange: 500
  },
  {
    key: 'solar_radiation',
    displayName: 'Solar Irradiance',
    unit: 'W/m²',
    category: 'atmosphere',
    minRange: 0,
    maxRange: 1500
  },
  {
    key: 'wind_speed',
    displayName: 'Wind Velocity',
    unit: 'km/h',
    category: 'atmosphere',
    minRange: 0,
    maxRange: 150
  },
  {
    key: 'leaf_wetness',
    displayName: 'Canopy Leaf Wetness',
    unit: '%',
    category: 'crop',
    minRange: 0,
    maxRange: 100
  }
];

export function getParameterDefinition(key: string): ParameterDefinition {
  const found = AGRICULTURAL_PARAMETERS.find(p => p.key === key);
  if (found) return found;

  return {
    key,
    displayName: key.replace(/_/g, ' ').toUpperCase(),
    unit: '',
    category: 'soil',
    minRange: 0,
    maxRange: 1000
  };
}
