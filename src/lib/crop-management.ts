export interface CropData {
  id: string;
  name: string;
  botanical_name: string;
  growth_duration_days: number;
  expected_yield_per_sqm: number;
  water_requirement_note: string;
  ideal_conditions: {
    temp_min_c: number;
    temp_max_c: number;
    humidity_min_pct: number;
    humidity_max_pct: number;
  };
  inherited_properties: {
    t_base_c: number;
    t_upper_c: number;
    lai_max_min: number;
    lai_max_max: number;
    spacing_row_ft: number;
    spacing_plant_ft: number;
    bred_disease_tolerance: string;
    bred_pest_tolerance: string;
    source: string;
  };
  is_custom: boolean;
  created_at: number;
}

export const SEEDED_CROPS: Record<string, Omit<CropData, 'id'>> = {
  crop_tomato_sth520: {
    name: "Tomato (Sarpan F1-STH-520)",
    botanical_name: "Solanum lycopersicum",
    growth_duration_days: 105,
    expected_yield_per_sqm: 4.8,
    water_requirement_note: "Moderate to high; regular drip cycles during flowering & fruit set",
    ideal_conditions: {
      temp_min_c: 20,
      temp_max_c: 28,
      humidity_min_pct: 55,
      humidity_max_pct: 70
    },
    inherited_properties: {
      t_base_c: 10,
      t_upper_c: 33,
      lai_max_min: 3.5,
      lai_max_max: 4.5,
      spacing_row_ft: 3.0,
      spacing_plant_ft: 1.5,
      bred_disease_tolerance: "Good foliage disease tolerance; thick skin green shoulder",
      bred_pest_tolerance: "Standard semi-indeterminate vigor",
      source: "sarpanseeds.com/collections/tomato/products/sarpan-f1-sth-520"
    },
    is_custom: false,
    created_at: 1700000000000
  },
  crop_chilli_92: {
    name: "Chilli (Sarpan F1-92)",
    botanical_name: "Capsicum annuum",
    growth_duration_days: 195,
    expected_yield_per_sqm: 3.6,
    water_requirement_note: "Moderate; avoid waterlogging during early vegetative phase",
    ideal_conditions: {
      temp_min_c: 22,
      temp_max_c: 32,
      humidity_min_pct: 50,
      humidity_max_pct: 65
    },
    inherited_properties: {
      t_base_c: 10,
      t_upper_c: 35,
      lai_max_min: 3.0,
      lai_max_max: 4.0,
      spacing_row_ft: 2.8,
      spacing_plant_ft: 1.0,
      bred_disease_tolerance: "High ASTA colour retention; good resistance to damping off",
      bred_pest_tolerance: "Thrips & mite resilience in upright canopy",
      source: "sarpanseeds.com/collections/chilli-1/products/sarpan-f1-92-super"
    },
    is_custom: false,
    created_at: 1700000000000
  },
  crop_brinjal_501: {
    name: "Brinjal (Sarpan Kudachi 501)",
    botanical_name: "Solanum melongena",
    growth_duration_days: 155,
    expected_yield_per_sqm: 4.2,
    water_requirement_note: "Consistent moisture required throughout extended fruiting window",
    ideal_conditions: {
      temp_min_c: 22,
      temp_max_c: 30,
      humidity_min_pct: 60,
      humidity_max_pct: 75
    },
    inherited_properties: {
      t_base_c: 10,
      t_upper_c: 35,
      lai_max_min: 5.0,
      lai_max_max: 7.5,
      spacing_row_ft: 2.7,
      spacing_plant_ft: 2.0,
      bred_disease_tolerance: "Good tolerance to little leaf (phytoplasma); good general foliage tolerance",
      bred_pest_tolerance: "Standard shoot & fruit borer monitoring advised",
      source: "sarpanseeds.com/collections/brinjal/products/sarpan-kudachi-501"
    },
    is_custom: false,
    created_at: 1700000000000
  },
  crop_okra_airavat: {
    name: "Okra (Sarpan Airavat)",
    botanical_name: "Abelmoschus esculentus",
    growth_duration_days: 120,
    expected_yield_per_sqm: 3.2,
    water_requirement_note: "Low to moderate; drought hardy with deep taproot system",
    ideal_conditions: {
      temp_min_c: 25,
      temp_max_c: 35,
      humidity_min_pct: 50,
      humidity_max_pct: 70
    },
    inherited_properties: {
      t_base_c: 12,
      t_upper_c: 35,
      lai_max_min: 3.0,
      lai_max_max: 4.4,
      spacing_row_ft: 1.8,
      spacing_plant_ft: 1.0,
      bred_disease_tolerance: "Highly tolerant to Yellow Vein Mosaic Virus (YVMV) and Enation Leaf Curl Virus (ELCV)",
      bred_pest_tolerance: "Glossy pod cuticle discourages borer entry",
      source: "sarpanseeds.com/collections/okra-beans-and-clusterbean/products/sarpan-airavat-bhendi-seeds"
    },
    is_custom: false,
    created_at: 1700000000000
  }
};

export const COMMON_CROP_PRESETS = [
  {
    name: "Lettuce (Butterhead Green)",
    botanical_name: "Lactuca sativa",
    growth_duration_days: 55,
    expected_yield_per_sqm: 3.5,
    water_requirement_note: "High surface soil moisture; cool-season root zone",
    temp_min_c: 16,
    temp_max_c: 24,
    humidity_min_pct: 60,
    humidity_max_pct: 80,
    t_base_c: 4,
    t_upper_c: 26,
    lai_max_min: 2.5,
    lai_max_max: 3.5,
    spacing_row_ft: 1.0,
    spacing_plant_ft: 0.8,
    bred_disease_tolerance: "Downy mildew race 1-16 resistance",
    bred_pest_tolerance: "Aphid non-preference trait"
  },
  {
    name: "Bell Pepper (Red Cardinal)",
    botanical_name: "Capsicum annuum var. grossum",
    growth_duration_days: 110,
    expected_yield_per_sqm: 4.0,
    water_requirement_note: "Consistent moisture; sensitive to blossom end rot",
    temp_min_c: 20,
    temp_max_c: 28,
    humidity_min_pct: 55,
    humidity_max_pct: 70,
    t_base_c: 10,
    t_upper_c: 32,
    lai_max_min: 3.0,
    lai_max_max: 4.0,
    spacing_row_ft: 2.5,
    spacing_plant_ft: 1.5,
    bred_disease_tolerance: "Tobamovirus (Tm:0-3) and TSWV resistance",
    bred_pest_tolerance: "Sturdy thick pericarp"
  },
  {
    name: "Strawberry (Chandler Sweet)",
    botanical_name: "Fragaria × ananassa",
    growth_duration_days: 90,
    expected_yield_per_sqm: 2.8,
    water_requirement_note: "Frequent low-volume drip irrigation",
    temp_min_c: 15,
    temp_max_c: 25,
    humidity_min_pct: 55,
    humidity_max_pct: 75,
    t_base_c: 3,
    t_upper_c: 28,
    lai_max_min: 2.0,
    lai_max_max: 3.0,
    spacing_row_ft: 1.5,
    spacing_plant_ft: 1.0,
    bred_disease_tolerance: "Phytophthora crown rot tolerance",
    bred_pest_tolerance: "Spider mite tolerance in high canopy vigor"
  },
  {
    name: "Cucumber (Beit Alpha Greenhouse)",
    botanical_name: "Cucumis sativus",
    growth_duration_days: 50,
    expected_yield_per_sqm: 6.5,
    water_requirement_note: "Very high water demand throughout rapid vine growth",
    temp_min_c: 22,
    temp_max_c: 30,
    humidity_min_pct: 65,
    humidity_max_pct: 85,
    t_base_c: 12,
    t_upper_c: 34,
    lai_max_min: 3.5,
    lai_max_max: 5.0,
    spacing_row_ft: 3.0,
    spacing_plant_ft: 1.2,
    bred_disease_tolerance: "Powdery mildew, Cucumber Mosaic Virus (CMV)",
    bred_pest_tolerance: "Parthenocarpic non-bitter foliage"
  }
];

export const ensureCropsSeeded = async (): Promise<Record<string, CropData>> => {
  const result: Record<string, CropData> = {};
  for (const [id, data] of Object.entries(SEEDED_CROPS)) {
    result[id] = { id, ...data };
  }
  return result;
};

export const checkCropAssignedToPlot = async (cropId: string, cropName: string): Promise<string | null> => {
  return null;
};
