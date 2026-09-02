<div align="center">

# ?? AgriTwin — Smart Farm & Crop Digital Twin Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?style=for-the-badge&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime_PostgreSQL-3ECF8E.svg?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2.svg?style=for-the-badge&logo=google)](https://ai.google.dev/)

<p align="center">
  <strong>An enterprise-grade, farmer-friendly Digital Twin ecosystem for precision agriculture, combining real-time IoT sensor telemetry, biophysical crop growth modeling, automated threshold surveillance, and Gemini-powered computer vision diagnostics.</strong>
</p>

[Key Features](#-key-features) • [System Architecture](#-system-architecture) • [Live Demo & Quickstart](#-quickstart) • [Tech Stack](#-technology-stack) • [Deployment](#-deployment) • [Database Schema](#-database-schema)

</div>

---

## ?? Overview

**AgriTwin** bridges the physical field and digital intelligence. It captures real-time observations from on-field IoT nodes (soil moisture, temperature, humidity, pH, NPK nutrients), continuously computes phenological metrics using biophysical algorithms (Growing Degree Days, Canopy Dynamics, VPD), and projects yield and disease risks in real time.

Built for both **ground farmers** (large high-contrast cards, human-readable terms, one-click controls) and **agricultural researchers** (full audit trails, multi-parameter charting, raw CSV exports).

---

## ? Key Features

### 1. ?? Farmer-Friendly Operational Dashboard
- **Farm Summary Bar**: Instant status of Total Farms, Under-Cultivation Plots, Sensor Nodes, Online vs. Offline units, and Critical Alerts.
- **Live Field Health Grid**: Color-coded biophysical badges (**Green** = Optimal, **Yellow** = Caution, **Red** = Action Required) for Soil Moisture, Temperature, Humidity, and Soil pH.
- **Simplified Terminology**: Replaced engineering jargon with farmer-intuitive phrasing (*Field Sensor Data*, *Live Farm Status*, *Sensor Units*).

### 2. ?? Multi-Farm & Plot Hierarchy Management
- **Full Relational CRUD**: Create, edit, and manage multiple farms, plots, and sensor allocations.
- **Cascading Integrity**: Deleting or updating a farm safely cascades to plot beds and sensor units.
- **Crop Assignment**: Match plots with crop cultivars (Wheat, Rice, Maize, Tomato, Chilli, Cotton, Sugarcane, etc.).

### 3. ?? Field Activity Audit Log (`/activity-log`)
- **Complete Chronological Timeline**: Records sensor pings, automated irrigation cycles, HVAC activation, alerts generated/resolved, and operator actions.
- **Multi-Filter Engine**: Filter logs by Date Range (Today, Yesterday, 7 Days, 30 Days, Custom), Farm, Plot, Event Type, and Severity.
- **Universal CSV & Excel Exporter**: Export filtered activity logs and time-series telemetry with one click.

### 4. ?? Automated Threshold Surveillance (`/alerts`)
- **Real-Time Threshold Engine**: Continuously evaluates telemetry streams for:
  - ?? *Low Soil Moisture* (< 25% Critical, 25–35% Warning)
  - ??? *Extreme Heat Stress* (> 40°C Critical, 35–40°C Warning)
  - ?? *Atmospheric Humidity Deficits* (< 25%)
  - ?? *Abnormal Soil pH* (< 5.5 Acidic, > 8.0 Alkaline)
  - ?? *Offline Sensor & Data Dropout Detection*
- **Interactive Resolution**: Mark alerts as resolved with operator attribution and audit timestamps.

### 5. ?? AI Agronomic Advisor & Computer Vision (`/advisor` & `/vision`)
- **Biophysical Digital Twin Engine**: Computes canopy coverage, growth velocity, ripeness percentages, and yield projections ($kg/m^2$).
- **Gemini 2.5 Flash Vision**: Upload plant leaf photos for real-time disease detection, chlorosis identification, and pathogen risk mitigation.

### 6. ?? IoT Telemetry Simulator
- Built-in simulation service continuously broadcasting realistic perturbations across **150 sensor units** in **5 farms** every 10 seconds.
- Header controls allow one-click **Pause/Resume** and instantaneous manual pulse simulation (**? NOW**).

### 7. ?? Multi-Role Authentication & 7-Step Onboarding
- Role-Based Access Control (**Admin**, **Farm Manager**, **Worker**, **Viewer**, **Farmer**).
- 7-step guided setup wizard with OTP verification, farm assignments, and terms acceptance.

---

## ??? System Architecture

```
                                  AGRITWIN PLATFORM
+---------------------------------------------------------------------------------+
¦                              FRONTEND INTERFACE                                 ¦
¦  React 19 SPA • TailwindCSS 4 • Recharts Analytics • Responsive Mobile Drawer   ¦
+---------------------------------------------------------------------------------+
                                         ¦
                 +-----------------------------------------------+
                 ?                                               ?
+----------------------------------+            +----------------------------------+
¦         EXPRESS API &            ¦            ¦         AGRISTORE CONTEXT        ¦
¦        GEMINI AI SERVER          ¦            ¦     Single Source of Truth       ¦
¦  • /api/health                   ¦            ¦  • Real-time State Propagation   ¦
¦  • /api/analyze-plant            ¦            ¦  • Alert Evaluation Engine       ¦
¦  • Static Asset Delivery         ¦            ¦  • In-Memory Fallback Cache      ¦
+----------------------------------+            +----------------------------------+
                 ¦                                               ¦
                 ?                                               ?
+----------------------------------+            +----------------------------------+
¦       GOOGLE GEMINI 2.5          ¦            ¦       SUPABASE POSTGRESQL        ¦
¦  Biophysical Leaf Vision &       ¦            ¦  • farms, plots, sensors         ¦
¦  Plant Pathogen Classification   ¦            ¦  • telemetry_observations        ¦
¦                                  ¦            ¦  • field_activity_log, alerts    ¦
¦                                  ¦            ¦  • WebSocket Realtime Channels   ¦
+----------------------------------+            +----------------------------------+
```

---

## ?? Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite 6 | Fast single-page application |
| **Styling** | Tailwind CSS 4, Lucide Icons | Responsive, mobile-first design |
| **Visualizations**| Recharts | Interactive time-series & bar analytics |
| **Backend API** | Express.js, Node.js 20+ | REST endpoints & vision routing |
| **Database** | Supabase (PostgreSQL 15+) | Relational storage & Realtime WebSockets |
| **AI / Vision** | Google Gemini 2.5 Flash | Plant pathology & digital twin vision |
| **State & Sync** | React Context + LocalStorage | Dual-mode resilience (Cloud & Local) |

---

## ?? Quickstart

### Prerequisites
- **Node.js**: v18.0 or higher
- **npm** or **bun**

### 1. Clone the Repository
```bash
git clone https://github.com/Pranav-S-Chakrapani/agritwin-2.git
cd agritwin-2
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:
```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Supabase (Local memory fallback operates if omitted)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server
```bash
npm run dev
```
Open your browser at: **`http://localhost:3001`**

### Demo Login Credentials:
- **Admin**: `admin@agritwin.com` / `admin123`
- **Farmer**: `farmer@agritwin.com` / `farmer123`

---

## ?? Production Build & Deployment

### Build the Application
```bash
npm run build
```
This builds both the Vite frontend bundle (`dist/`) and the standalone Node server (`dist/server.cjs`).

### Deploy to Render or Railway (Continuous Deployment)
1. Link your GitHub repository (`Pranav-S-Chakrapani/agritwin-2`) on [Render.com](https://render.com).
2. Configure settings:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
   - **Environment Variable**: `GEMINI_API_KEY`
3. Every `git push` to `main` will automatically build and deploy the updated application!

---

## ??? Database Schema

The complete database migration script is provided in [`supabase_schema.sql`](./supabase_schema.sql):

- `public.farms`: Farm property boundaries, acreages, and owners.
- `public.plots`: Individual field sections, crop varieties, and soil metrics.
- `public.sensors`: IoT hardware transceivers, battery levels, and ping health.
- `public.telemetry_observations`: Time-series sensor observations.
- `public.field_activity_log`: Complete system and field event audit trail.
- `public.alerts`: Automated threshold warnings and resolution status.
- `public.users`: Multi-role user profiles and farm permissions.

---

## ?? License
This project is developed for educational and commercial precision agriculture research.
