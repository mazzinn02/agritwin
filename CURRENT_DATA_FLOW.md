# AgriTwin Data Flow Architecture (`CURRENT_DATA_FLOW.md`)

## 1. Executive Summary & Architecture Overview

The AgriTwin Agricultural Digital Twin Platform is built on a full-stack TypeScript architecture:
- **Frontend Layer**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts.
- **Backend API & Service Layer**: Express.js (`server.ts`) providing health, AI vision analysis, search-grounded weather telemetry, and Google Slides presentation generation.
- **Database & Persistence Layer**:
  - **Relational DB**: Drizzle ORM + PostgreSQL schema (`src/db/schema.ts`).
  - **Document DB & Auth**: Firebase Auth + Firestore (`users`, `farms`, `plots`, `sensors`).
  - **Realtime DB**: Firebase Realtime DB / Local Event Storage (`live_readings`, `crop_vision`, `device_commands`, `yield_log`).
  - **Reactive State Engine**: Centralized store (`src/context/AgriStore.tsx`) synchronizing models across all views.

---

## 2. End-to-End Data Pipeline Flow

```
+-----------------------------------------------------------------------------------+
| 1. DATA SOURCE LAYER                                                              |
|  - Physical IoT Sensors / Gateways (ESP32, MQTT/HTTP Ingestion)                  |
|  - Edge Hardware Actuators (Irrigation Solenoids, HVAC Fans, Grow Lights)         |
|  - External AI/ML Services (Gemini Vision AI, Google Search Grounding Weather)    |
|  - User Inputs (Farmland Provisioning Wizard, Crop Threshold Modifications)       |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 2. BACKEND API & INGESTION LAYER (server.ts / Firebase Admin)                     |
|  - Express Server Endpoints:                                                      |
|    - POST /api/analyze-plant -> Gemini 2.5 Vision AI Analysis                     |
|    - POST /api/weather       -> Realtime Grounded Weather API                     |
|    - POST /api/devices/{id}/commands -> Device Hardware Command Dispatch          |
|  - Ingestion Handlers -> Validates Telemetry, Timestamps & Quality Flags           |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 3. DATABASE & PERSISTENCE LAYER                                                   |
|  - PostgreSQL / Drizzle ORM Schema (`src/db/schema.ts`)                           |
|  - Firestore (`users`, `farms`, `plots`, `crops`, `sensors`)                      |
|  - Realtime DB (`live_readings/{plotId}`, `crop_vision/{plotId}`, `audit_logs`)    |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 4. DIGITAL TWIN REACTION & STATE ENGINE (`src/context/AgriStore.tsx`)             |
|  - Unified Single Source of Truth (`useAgriStore()`)                              |
|  - Manages DigitalTwinState:                                                      |
|    - activeFarmland                                                               |
|    - activeSections (geometry, area, assigned crop, telemetry, node ID)           |
|    - crops (cultivar thresholds, GDD base temp)                                   |
|    - users (RBAC credentials, permissions)                                        |
|    - auditLogs (immutable hardware relay history)                                 |
|  - Deterministic Biophysical Engine (evaluates live telemetry against thresholds) |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 5. FRONTEND PRESENTATION & REALTIME UI                                            |
|  - Virtual Farm Top-Down Soil Matrix (`VirtualFarmView.tsx`)                      |
|  - Main Operational Dashboard (`Dashboard.tsx`)                                   |
|  - Vision AI Phenology HUD (`CropVision.tsx`)                                     |
|  - User Management Directory (`UserManagement.tsx`)                               |
|  - Field Audit Ledger (`FieldAuditLog.tsx`)                                       |
|  - Live Camera Feed (`CameraFeed.tsx`)                                            |
+-----------------------------------------------------------------------------------+
```

---

## 3. Authoritative Source of Truth Matrix

| Entity | Authoritative Source | Data Consumption Across System |
| :--- | :--- | :--- |
| **Farmland** | Database / `AgriStore` | Virtual Farm, Dashboard, Provisioning Wizard, Analytics, Map |
| **Plot / Section** | Database / `AgriStore` | Virtual Farm, Dashboard, Plot List, Crop Management, Map |
| **Crop Cultivar** | Database / `AgriStore` | Crop Library, Dashboard, Biophysical Engine, What-If Simulator |
| **Sensor Node** | Backend Ingestion / Database | Virtual Farm, Dashboard, My Sensors, Research View |
| **Telemetry Metric** | Realtime Ingestion Pipeline | Telemetry Cards, Virtual Farm, Analytics, Research View |
| **Actuator Status** | Physical Device ACK / Backend API | Device Control, Dashboard, Field Audit Log |
| **AI/ML Result** | AI/ML Service Response (`/api/analyze-plant`) | Crop Vision HUD, Phenology Tracker |
| **Audit Log** | Backend Immutable Ledger | Field Audit Log, Device Control, Dashboard |

---

## 4. Execution Modes & Environmental Isolation

- **PRODUCTION Mode**:
  - Synthetic data generation (`Math.random()`, fake stream loops) is strictly disabled.
  - Telemetry cards display actual incoming sensor values or explicit status banners:
    - `"No sensor data available"`
    - `"Waiting for gateway sync"`
    - `"Sensor offline"`
    - `"Data stale (last observed X min ago)"`
    - `"AI/ML service unavailable"`
    - `"Command pending acknowledgement"`
- **DEMO Mode**:
  - Synthetic telemetry is explicitly labeled with a `DEMO / SYNTHETIC DATA` badge.
- **DEVELOPMENT Mode**:
  - Full local execution with local backend and SQLite/PostgreSQL/Firestore emulators.
