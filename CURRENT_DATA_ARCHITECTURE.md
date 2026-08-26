# CURRENT DATA ARCHITECTURE SPECIFICATION

**Application**: AgriTwin Crop Digital Twin Platform  
**Version**: 2.5 (Phase 1 Unified Data Engine)  
**Date**: August 2026  

---

## 1. Executive Summary & Authoritative Store Model

AgriTwin utilizes a **Single Source of Truth** architecture powered by `AgriStore` (`src/context/AgriStore.tsx`). All modules (Dashboard, Virtual Farm, Map View, Field Log, Analytics, Research Workspace, AI Advisor, Crop Comparison, and Device Control) consume identical reactive state streams with zero independent mock generation.

```
                  +-----------------------------------+
                  |   AgriStore Global Data Engine    |
                  |     (src/context/AgriStore.tsx)   |
                  +-----------------+-----------------+
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
+---------v---------+     +---------v---------+     +---------v---------+
|   Farmlands Store |     |    Plots Store    |     |  Telemetry Store  |
| (agritwin_farms)  |     | (agritwin_plots)  |     | (agritwin_telem)  |
+-------------------+     +-------------------+     +-------------------+
          |                         |                         |
          +-------------------------+-------------------------+
                                    |
            +-----------------------+-----------------------+
            |                       |                       |
   +--------v-------+      +--------v-------+      +--------v-------+
   |  Virtual Farm  |      |   Analytics    |      |  Field Log &   |
   | & Dashboard UI |      |  & Comparison  |      |  Research Data |
   +----------------+      +----------------+      +----------------+
```

---

## 2. Canonical Domain Models (`src/types.ts`)

### A. Farm Entity (`Farmland`)
- **Storage Key**: `agritwin_farmlands` & Firebase Firestore `farms/{farmId}`
- **Fields**:
  - `id`: Unique string (e.g., `farm_dharwad_001`)
  - `name`: Human-readable farm title (e.g., `IIIT Agricultural Research Campus`)
  - `location`: Region/City string (e.g., `Dharwad, Karnataka`)
  - `address`: Full text address (e.g., `Dharwad Agriculture Campus, Plot 12, Hubli-Dharwad Road`)
  - `contactPerson`: Designated farm supervisor (e.g., `Dr. Ramesh Kumar`)
  - `contactPhone`: Phone contact (e.g., `+91 98765 43210`)
  - `contactRole`: `'Owner' | 'Manager' | 'Worker'`
  - `hasMapCoordinates`: Boolean flag (`false` indicates skippable map setup)
  - `latitude` / `longitude`: Optional coordinates
  - `totalArea`: Numerical area
  - `unit`: Area unit (`'acres' | 'hectares' | 'sq ft'`)
  - `sectionsCount`: Total partitioned plots

### B. Plot Entity (`PlotBed`)
- **Storage Key**: `agritwin_plots`
- **Fields**:
  - `id`: Plot UUID
  - `farmId`: Parent farm link
  - `code`: Section code (e.g., `SEC-A`)
  - `name`: Section title (e.g., `Section A (North Canopy)`)
  - `area`: Plot size in parent unit
  - `cropId`: Assigned crop reference
  - `cropCycleId`: Active phenological cycle UUID
  - `geometryType`: `'RECTANGLE' | 'POLYGON'`
  - `soilMoisture`: Current Digital Twin moisture level (%)
  - `airTemp`: Current Digital Twin air temperature (°C)
  - `soilPh`: Current Digital Twin soil pH

### C. Telemetry Observation (`TelemetryObservation`)
- **Storage Key**: `agritwin_telemetry` & Firebase Firestore `live_readings/{plotId}`
- **Fields**:
  - `id`: Observation UUID
  - `farmId`: Associated farm ID
  - `plotId`: Associated plot ID
  - `sensorId`: Associated sensor node ID
  - `parameterKey`: Biophysical metric key (`soil_moisture`, `air_temperature`, `soil_ph`, `humidity`, `nitrogen`, etc.)
  - `displayName`: Human-readable title
  - `value`: Numerical reading
  - `unit`: Unit of measurement
  - `measurementTimestamp`: ISO date-time string
  - `qualityStatus`: `'VALID' | 'WARNING' | 'INVALID'`
  - `dataSource`: `'MANUAL_PROTOTYPE' | 'LIVE_SENSOR' | 'DERIVED' | 'SIMULATION'`

---

## 3. Storage Layer & Persistence Infrastructure

1. **`localStorage` Key Registry**:
   - `agritwin_farmlands`: Array of all active farms
   - `agritwin_plots`: Complete partitioned plot inventory
   - `agritwin_telemetry`: Immutable raw telemetry observation append log
   - `agritwin_crops`: Seeded 5-crop agronomic library
   - `agritwin_credentials`: Firebase Auth user registry
   - `agritwin_active_session`: Currently authenticated user session

2. **Firebase Auth & Firestore Schema**:
   - `users/{uid}`: Authenticated user profiles with strict role (`admin` vs `farmer`)
   - `farms/{farmId}`: Persistent farm records
   - `plots/{plotId}`: Partitioned section metadata
   - `live_readings/{plotId}`: Latest telemetry observation state
   - `history/{plotId}`: Historical telemetry observations stream

---

## 4. Module-by-Module Data Pipeline Audit

| Module | Data Source | Mutation Behavior |
| :--- | :--- | :--- |
| **Dashboard** | `AgriStore` (`activeFarmland`, `activeSections`) | Triggers edge hardware actuators (irrigation pulse, canopy fan) |
| **Virtual Farm** | `AgriStore` (`activeSections`) | Renders proportional rectangular 2D layout grid |
| **Map View** | `AgriStore` (`activeFarmland`, `activeSections`) | Renders geographic coordinates if configured; fallback notice if skipped |
| **Field Log** | `AgriStore` (`telemetryObservations`) | Displays immutable audit log of manual prototype & sensor observations |
| **Analytics** | `AgriStore` (`telemetryObservations`) | Computes real min/max/avg over selected date range |
| **Research Workspace** | `AgriStore` (`telemetryObservations`) | Filters, sorts, and exports dataset as raw CSV / JSON |
| **What-If Simulator** | Local simulation engine | Clearly tagged `SIMULATION` (does NOT mutate actual telemetry) |
