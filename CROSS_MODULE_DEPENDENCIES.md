# AGRITWIN — CROSS-MODULE DEPENDENCIES & AUDIT MATRIX

## 1. Executive Summary
This document provides a full audit of all application pages, components, data stores, direct `localStorage` access points, and hardcoded structures in AgriTwin. It specifies the exact cross-module dependency matrix and the file refactoring roadmap required to achieve a **100% interconnected, Single Source of Truth architecture**.

---

## 2. Comprehensive Module Audit & Refactoring Matrix

| Module / File Path | Current Data Source | Current Duplication / Hardcoding Issues | Target Single Source of Truth Hook / Service | Action Required |
|---|---|---|---|---|
| **Dashboard**<br>`src/pages/Dashboard.tsx` | Partial `useAgriStore` + hardcoded farm header strings | Hardcoded "iiit dharwad" default strings in header; independent plot selection state | `useAgriStore()` + `useSelectedFarm()` + `useSelectedPlot()` | Bind farm header dynamically to `activeFarmland`. Synchronize plot selection with global state. |
| **Virtual Farm**<br>`src/components/virtual-farm/VirtualFarmView.tsx` | `useAgriStore` | Local selected plot state; does not update `activePlotId` globally | `useAgriStore()` + `DigitalTwinService` | Synchronize plot selection with global `selectedPlotId`. Render section canvas strictly from `DigitalTwinState`. |
| **Add New Farmland Wizard**<br>`src/components/farmland/AddNewFarmlandWizard.tsx` | `useAgriStore` | Uses local form state during partitioning wizard | `FarmService` + `PlotService` + `useAgriStore` | Execute atomic farmland + sections creation. Update global `farmlands` & `plots` state upon save. |
| **Map View**<br>`src/pages/MapView.tsx` | Empty / mock wrapper component | Placeholder stub; does not render real section boundary coordinates or active farm plots | `useAgriStore()` + `DigitalTwinService` | Refactor to render active farm plots, geofences, and live digital twin status overlays dynamically. |
| **My Sensors**<br>`src/pages/MySensors.tsx` | Direct calls to `farm-storage.ts` (`getSensors()`, `getPlots()`) | Bypasses `useAgriStore()`; maintains duplicate sensor list in `localStorage` key `agri_sensors` | `useAgriStore()` (`plots`, `sensors`) | Refactor to consume `plots` and `sensors` directly from `useAgriStore()`. Add sensor node assignment dispatch. |
| **Field Telemetry Log**<br>`src/pages/FieldLog.tsx` | Direct calls to `farm-storage.ts` (`getHistory()`, `getPlots()`) | Bypasses `useAgriStore()`; reads `agri_history` instead of unified `telemetryObservations` | `useAgriStore()` (`telemetryObservations`, `plots`) | Refactor to consume `telemetryObservations` directly from `useAgriStore()`. |
| **Device Control**<br>`src/pages/DeviceControl.tsx` | Direct calls to `farm-storage.ts` & Firebase `devices/${plotId}` | Bypasses `useAgriStore()`; maintains separate Firebase listener per page view | `useAgriStore()` + `ActuatorService` | Refactor to dispatch actuator commands through `triggerActuator` in `useAgriStore()`. |
| **AI Advisor**<br>`src/pages/AIAdvisor.tsx` | Direct calls to `farm-storage.ts` (`getPlots()`, `getCrops()`) | Bypasses `useAgriStore()`; contains local action triggers | `useAgriStore()` + `DigitalTwinService` | Refactor to pull `activePlot`, `assignedCrop`, and latest biophysical telemetry from `useAgriStore()`. |
| **Analytics**<br>`src/pages/Analytics.tsx` | `useAgriStore` + legacy Firebase helper | Historical query logic had synthetic math fallbacks | `useAgriStore()` (`telemetryObservations`) | Bind Recharts time-series directly to stored `telemetryObservations`. |
| **Crop Comparison**<br>`src/pages/CropComparison.tsx` | Direct calls to `farm-storage.ts` | Bypasses `useAgriStore()`; loads plot list independently | `useAgriStore()` (`plots`, `crops`) | Refactor to consume `plots` and `crops` from `useAgriStore()`. |
| **What-If Simulator**<br>`src/pages/WhatIfSimulator.tsx` | Local state sliders | Standalone simulation logic; needs explicit `dataSource = 'SIMULATION'` tag | `useAgriStore()` | Tag simulation output with `dataSource = 'SIMULATION'` without overwriting actual observations. |
| **Crop Management**<br>`src/pages/farm-management/Crops.tsx` | `useAgriStore` | Operates on crop cultivars library | `useAgriStore()` (`crops`) | Fully connected. Ensure updates update linked plot thresholds in real time. |
| **Field Audit Log**<br>`src/pages/farm-management/FieldAuditLog.tsx` | `useAgriStore` | Displays audit log entries | `useAgriStore()` (`auditLogs`) | Fully connected. Add telemetry observation log tab. |
| **Manual Telemetry Admin Page**<br>`src/pages/ManualTelemetryPage.tsx` | `useAgriStore` | Submits manual observations | `useAgriStore()` (`addTelemetryObservation`) | Fully connected to `TelemetryObservation` pipeline. |
| **Research Workspace**<br>`src/pages/ResearchView.tsx` | `useAgriStore` | Filters and exports raw dataset | `useAgriStore()` (`telemetryObservations`) | Fully connected to raw telemetry dataset. |

---

## 3. Propagation Verification Checklist

### Test Case 1: Create Farm Propagation
When a user creates a new Farm (e.g., **"South Campus Research Hub"**, 20 Acres, 4 Plots):
1. `FarmService.createFarm()` validates total area math.
2. `AgriStore` receives new `Farm` and `Plot` records.
3. **Dashboard**: Farm name dropdown adds "South Campus Research Hub".
4. **Virtual Farm**: Canvas switches to the new farm and renders 4 section slots.
5. **Map View**: Centering and boundary polygons update to new farm coordinates.
6. **Analytics**: Plot dropdown updates to include new section codes.
7. **Crop Library**: Assigned plot counters increment accordingly.
8. **My Sensors**: Sensor node assignment dropdown lists new section codes.
9. **Device Control**: Hardware relay matrix lists new section nodes.
10. **Research Workspace**: Dataset farm filter dropdown includes "South Campus Research Hub".

### Test Case 2: Plot Resizing & Re-allocation
When Admin resizes **SEC-A** from 5 Acres to 7 Acres:
1. `PlotService.updatePlotArea()` validates $\sum \text{Section Area} \le 20 \text{ Acres}$.
2. `AgriStore` updates `SEC-A` area to 7 Acres.
3. **Virtual Farm**: SEC-A visual slot resizes proportionally to 35% of total canvas.
4. **Dashboard**: Allocated Cultivation & Remaining Unallocated metric cards update automatically.
5. **Research Workspace**: Observation metadata updates plot area to 7 Acres while retaining historical telemetry.

### Test Case 3: Crop Re-assignment
When Admin changes **SEC-A** crop from **Tomato** to **Chilli**:
1. Active `CropCycle` for Tomato closes; new `CropCycle` for Chilli initializes.
2. `AgriStore` updates `SEC-A.cropId = "crop_chilli_byadgi"`.
3. **Virtual Farm**: Top-down canopy overlay switches from Tomato SVG to Chilli SVG.
4. **Dashboard**: Target moisture (50%–70%) & temperature (22°C–32°C) threshold cards update.
5. **AI Advisor**: Context switch updates disease risk analysis for Chilli.
6. **Historical Integrity**: Historical Tomato observations retain Tomato crop tag in Field Log & Research export.

---

## 4. Architectural Summary
By migrating all page-level `localStorage` access to `AgriStore.tsx` and centralized domain services (`FarmService`, `PlotService`, `TelemetryService`), AgriTwin operates as **ONE unified system** where every operation updates every dependent module automatically.
