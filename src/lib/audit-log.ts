import { AuditLogEntry } from '../types';
import { addFieldAuditLog, getFieldAuditLogs as getStorageAuditLogs } from './farm-storage';
import { supabase, isSupabaseConfigured } from './supabase';

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

  // 2. Save to Supabase PostgreSQL
  if (isSupabaseConfigured) {
    try {
      await supabase.from('audit_logs').insert({
        id: localEntry.id,
        plot_id,
        plot_code: code,
        action_type,
        triggered_by,
        details,
        created_at: timestamp
      });
    } catch (err) {
      console.warn('Failed to log field action to Supabase:', err);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('agri_audit_logged', { detail: localEntry }));
  }

  return localEntry.id;
};

export const getFieldAuditLogs = async (): Promise<AuditLogEntry[]> => {
  const localLogs = getStorageAuditLogs();
  if (localLogs.length > 0) return localLogs;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          plot_id: d.plot_id,
          plot_code: d.plot_code,
          action_type: d.action_type,
          triggered_by: d.triggered_by,
          timestamp: d.created_at,
          details: d.details
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch audit logs from Supabase:', err);
    }
  }

  return [];
};
