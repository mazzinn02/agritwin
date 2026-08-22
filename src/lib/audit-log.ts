import { ref, push, get } from './firebase';
import { db } from './firebase';
import { AuditLogEntry } from '../types';
import { addFieldAuditLog, getFieldAuditLogs as getStorageAuditLogs } from './farm-storage';

export type FieldAuditLogEntry = AuditLogEntry;

export const logFieldAction = async (
  plot_id: string,
  action_type: 'irrigation' | 'hvac' | 'grow_light' | 'manual_note',
  triggered_by: 'auto' | 'manual',
  details: string,
  plot_code?: string
): Promise<string> => {
  const timestamp = new Date().toISOString();
  const code = plot_code || plot_id;

  // 1. Save to Unified LocalStorage
  const localEntry = addFieldAuditLog({
    plot_id,
    plot_code: code,
    action_type,
    triggered_by,
    timestamp,
    details
  });

  // 2. Save to Firebase
  try {
    const auditRef = ref(db, 'field_audit_log');
    await push(auditRef, localEntry);
  } catch (err) {
    console.error('Failed to log field action to Firebase:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('agri_audit_logged', { detail: localEntry }));
  }

  return localEntry.id;
};

export const getFieldAuditLogs = async (): Promise<AuditLogEntry[]> => {
  const localLogs = getStorageAuditLogs();
  if (localLogs.length > 0) return localLogs;

  try {
    const auditRef = ref(db, 'field_audit_log');
    const snapshot = await get(auditRef);
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.entries(val).map(([k, v]: [string, any]) => ({
      id: k,
      plot_code: v.plot_code || v.plot_id || 'S-01',
      ...v
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.error('Failed to fetch field audit logs:', err);
    return [];
  }
};
