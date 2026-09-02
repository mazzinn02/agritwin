import { FieldActivity, ActivityEventType, ActivitySeverity } from '../types';

let activityLog: FieldActivity[] = [];
let onNewActivity: ((activity: FieldActivity) => void) | null = null;

export function setActivityCallback(cb: (activity: FieldActivity) => void) {
  onNewActivity = cb;
}

export function logActivity(params: {
  eventType: ActivityEventType;
  title: string;
  description: string;
  severity?: ActivitySeverity;
  farmId?: string;
  plotId?: string;
  sensorId?: string;
  createdBy?: string;
  metadata?: Record<string, any>;
}): FieldActivity {
  const activity: FieldActivity = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    eventType: params.eventType,
    title: params.title,
    description: params.description,
    severity: params.severity || 'info',
    farmId: params.farmId,
    plotId: params.plotId,
    sensorId: params.sensorId,
    createdBy: params.createdBy,
    metadata: params.metadata || {},
  };

  activityLog = [activity, ...activityLog].slice(0, 500);

  if (onNewActivity) {
    onNewActivity(activity);
  }

  return activity;
}

export function getActivityLog(): FieldActivity[] {
  return activityLog;
}

export function seedActivityLog(activities: FieldActivity[]) {
  activityLog = activities;
}

export const ActivityLogger = {
  farmCreated: (farmName: string, farmId: string, by?: string) =>
    logActivity({
      eventType: 'farm_created',
      title: `New Farm Added: ${farmName}`,
      description: `Farm "${farmName}" was successfully registered in the system.`,
      severity: 'success',
      farmId,
      createdBy: by,
    }),

  farmUpdated: (farmName: string, farmId: string, changes: string, by?: string) =>
    logActivity({
      eventType: 'farm_updated',
      title: `Farm Updated: ${farmName}`,
      description: `Farm details updated — ${changes}`,
      severity: 'info',
      farmId,
      createdBy: by,
    }),

  farmDeleted: (farmName: string, farmId: string, by?: string) =>
    logActivity({
      eventType: 'farm_deleted',
      title: `Farm Deleted: ${farmName}`,
      description: `Farm "${farmName}" and its associated plots were removed.`,
      severity: 'warning',
      farmId,
      createdBy: by,
    }),

  plotCreated: (plotName: string, farmId: string, plotId: string, by?: string) =>
    logActivity({
      eventType: 'plot_created',
      title: `New Plot Added: ${plotName}`,
      description: `Plot "${plotName}" was created and assigned to farm.`,
      severity: 'success',
      farmId,
      plotId,
      createdBy: by,
    }),

  plotUpdated: (plotName: string, farmId: string, plotId: string, changes: string, by?: string) =>
    logActivity({
      eventType: 'plot_updated',
      title: `Plot Updated: ${plotName}`,
      description: `Plot details updated — ${changes}`,
      severity: 'info',
      farmId,
      plotId,
      createdBy: by,
    }),

  plotDeleted: (plotName: string, farmId: string, plotId: string, by?: string) =>
    logActivity({
      eventType: 'plot_deleted',
      title: `Plot Deleted: ${plotName}`,
      description: `Plot "${plotName}" was deleted.`,
      severity: 'warning',
      farmId,
      plotId,
      createdBy: by,
    }),

  sensorAdded: (sensorId: string, plotCode: string, farmId?: string, by?: string) =>
    logActivity({
      eventType: 'sensor_added',
      title: `Sensor Unit Added: ${sensorId}`,
      description: `Sensor unit ${sensorId} assigned to plot ${plotCode}.`,
      severity: 'success',
      farmId,
      sensorId,
      createdBy: by,
    }),

  sensorOffline: (sensorId: string, farmId?: string, plotId?: string) =>
    logActivity({
      eventType: 'sensor_offline',
      title: `Sensor Offline: ${sensorId}`,
      description: `Sensor unit ${sensorId} went offline. Check power and wireless signal.`,
      severity: 'warning',
      farmId,
      plotId,
      sensorId,
    }),

  sensorOnline: (sensorId: string, farmId?: string, plotId?: string) =>
    logActivity({
      eventType: 'sensor_online',
      title: `Sensor Online: ${sensorId}`,
      description: `Sensor unit ${sensorId} is back online and broadcasting telemetry.`,
      severity: 'success',
      farmId,
      plotId,
      sensorId,
    }),

  telemetryUpdate: (paramName: string, value: number, unit: string, plotCode: string, farmId?: string, plotId?: string, sensorId?: string) =>
    logActivity({
      eventType: 'telemetry_update',
      title: `Field Sensor Data: ${paramName}`,
      description: `${paramName} reading updated to ${value}${unit} on plot ${plotCode}.`,
      severity: 'info',
      farmId,
      plotId,
      sensorId,
      metadata: { paramName, value, unit, plotCode },
    }),

  alertGenerated: (alertTitle: string, farmId?: string, plotId?: string, sensorId?: string) =>
    logActivity({
      eventType: 'alert_generated',
      title: `Alert: ${alertTitle}`,
      description: `New warning/alert triggered: ${alertTitle}`,
      severity: 'warning',
      farmId,
      plotId,
      sensorId,
    }),

  alertResolved: (alertTitle: string, by: string, farmId?: string) =>
    logActivity({
      eventType: 'alert_resolved',
      title: `Alert Resolved: ${alertTitle}`,
      description: `Alert "${alertTitle}" was marked as resolved by ${by}.`,
      severity: 'success',
      farmId,
      createdBy: by,
    }),

  irrigationTriggered: (plotCode: string, moisture: number, by: string, farmId?: string, plotId?: string) =>
    logActivity({
      eventType: 'irrigation_triggered',
      title: `Irrigation Activated: ${plotCode}`,
      description: `Precision irrigation pulsed on ${plotCode}. Moisture elevated to ${moisture}%. Triggered by ${by}.`,
      severity: 'info',
      farmId,
      plotId,
      createdBy: by,
      metadata: { moisture, plotCode },
    }),

  hvacTriggered: (plotCode: string, state: boolean, temp: number, by: string, farmId?: string, plotId?: string) =>
    logActivity({
      eventType: 'hvac_triggered',
      title: `Canopy Fan ${state ? 'ON' : 'OFF'}: ${plotCode}`,
      description: `Ventilation fan switched ${state ? 'ON' : 'OFF'} on ${plotCode}. Temperature adjusted to ${temp}°C. By ${by}.`,
      severity: 'info',
      farmId,
      plotId,
      createdBy: by,
      metadata: { state, temp, plotCode },
    }),

  userLogin: (userName: string, email: string) =>
    logActivity({
      eventType: 'user_login',
      title: `User Logged In: ${userName}`,
      description: `${userName} (${email}) authenticated into AgriTwin.`,
      severity: 'info',
      createdBy: email,
    }),

  userLogout: (userName: string, email: string) =>
    logActivity({
      eventType: 'user_logout',
      title: `User Logged Out: ${userName}`,
      description: `${userName} (${email}) signed out.`,
      severity: 'info',
      createdBy: email,
    }),

  csvExported: (dataType: string, recordCount: number, by?: string) =>
    logActivity({
      eventType: 'csv_export',
      title: `Data Exported: ${dataType}`,
      description: `Downloaded ${recordCount} records as CSV/Excel for ${dataType}. By ${by || 'User'}.`,
      severity: 'info',
      createdBy: by,
      metadata: { dataType, recordCount },
    }),

  manualObservation: (paramName: string, value: number, unit: string, plotCode: string, by: string, farmId?: string, plotId?: string) =>
    logActivity({
      eventType: 'manual_observation',
      title: `Manual Reading: ${paramName}`,
      description: `Manual sensor observation recorded — ${paramName}: ${value}${unit} on plot ${plotCode}. By ${by}.`,
      severity: 'info',
      farmId,
      plotId,
      createdBy: by,
      metadata: { paramName, value, unit, plotCode },
    }),
};

export default ActivityLogger;
