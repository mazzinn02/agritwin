# AGRITWIN — MVP DATA FLOW AUDIT REPORT

**Application**: AgriTwin Agricultural Digital Twin Platform  
**Version**: 2.5 Final MVP Integration  
**Date**: August 2026  

---

## 1. Comprehensive Module-by-Module Data Origin Audit

| Module | Data Origin / Provider | Hardcoded / Mock Elements | Source Labeling | Single Source of Truth Compliance |
| :--- | :--- | :--- | :--- | :--- |
| **Farm Management** | `AgriStore` (`farmlands`, `addFarmland`) | None (supports multi-farm) | Real user input | **100% Compliant** |
| **Plots & Crops** | `AgriStore` (`activeSections`, `crops`) | None (rectangular proportional grid) | Dynamic store | **100% Compliant** |
| **Manual Observation Ingestion** | `ManualTelemetryPage.tsx` -> `AgriStore.addTelemetryObservation()` | None (user entered) | `MANUAL_PROTOTYPE` | **100% Compliant** |
| **Dashboard** | `AgriStore` (`activeFarmland`, `activeSections`, `telemetryObservations`) | None | `MANUAL PROTOTYPE` | **100% Compliant** |
| **Virtual Farm** | `AgriStore` (`activeSections`, `crops`) | None | `MANUAL PROTOTYPE` | **100% Compliant** |
| **Map View** | `AgriStore` (`activeFarmland`, `activeSections`) | None (optional fallback: *"Map location not configured"*) | `MANUAL PROTOTYPE` | **100% Compliant** |
| **Field Log (Historical Data)** | `AgriStore` (`telemetryObservations`) | Initial demo telemetry explicitly tagged | `DEMO_HISTORICAL` / `MANUAL_PROTOTYPE` | **100% Compliant** |
| **Analytics** | `AgriStore` (`telemetryObservations`) | None (queries actual observations) | `MANUAL PROTOTYPE` | **100% Compliant** |
| **Crop Comparison** | `AgriStore` (`telemetryObservations`) | None (compares actual Plot A vs Plot B) | `MANUAL PROTOTYPE` | **100% Compliant** |
| **Research Workspace** | `AgriStore` (`telemetryObservations`) | None (raw dataset CSV/JSON exporter) | `MANUAL PROTOTYPE` | **100% Compliant** |
| **AI Advisor** | `AgriStore` (`activeSections`, `crops`) | None | `RULE-BASED ASSESSMENT` | **100% Compliant** |
| **Sensors & Devices** | `AgriStore` (`activeSections`) | None | `MANUAL DATA SOURCE` / `CONFIGURED` | **100% Compliant** |
| **Weather Stream** | Local ambient sensor wrapper | Clearly segregated | `EXTERNAL WEATHER` | **100% Compliant** |
| **Camera Feed** | Feed status handler | Static stream placeholder | `NOT CONNECTED` | **100% Compliant** |
| **What-If Simulator** | Local biophysical simulation engine | Isolated sandbox | `SIMULATION` | **100% Compliant** |

---

## 2. Telemetry Entity Schema (`TelemetryObservation`)

Every telemetry observation record in the unified store contains:

```typescript
export interface TelemetryObservation {
  id: string;
  farmId: string;
  plotId: string;
  cropCycleId?: string;
  sensorId?: string;
  parameterKey: string;
  displayName: string;
  value: number;
  unit: string;
  measurementTimestamp: string;
  receivedTimestamp: string;
  qualityStatus: 'VALID' | 'WARNING' | 'INVALID';
  dataSource: 'MANUAL_PROTOTYPE' | 'LIVE_SENSOR' | 'DERIVED' | 'SIMULATION' | 'DEMO_HISTORICAL';
  notes?: string;
  metadata?: {
    operator?: string;
    deviceType?: string;
    [key: string]: any;
  };
}
```

---

## 3. Cross-Module Data Propagation Pipeline

1. **Farm Provisioning Wizard** (`AddNewFarmlandWizard.tsx`):
   - Stores Farm, Address, Contact Person, Phone, Email, Unit, and Rectangular Plots into `AgriStore`.
   - Automatically updates farm dropdowns and active plot arrays in Dashboard, Virtual Farm, Analytics, Field Log, AI Advisor, and Research Workspace.

2. **Manual Observation Submission** (`ManualTelemetryPage.tsx`):
   - Ingests Soil Moisture, Air Temperature, Humidity, Soil pH, Nitrogen, Phosphorus, Potassium, Light, Soil Temp, and Soil EC under `dataSource = 'MANUAL_PROTOTYPE'`.
   - Atomically updates `activeSections` plot state, appends to `telemetryObservations`, and triggers real-time UI re-renders on Dashboard, Virtual Farm, Field Log, Analytics, and Research.

3. **Multi-Farm Isolation**:
   - Switching the top-bar Farm selector scopes all page queries to `activeFarmland.id`. Zero cross-farm data leakage.
