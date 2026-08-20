import { useEffect, useState } from 'react';
import { supabase } from '../services/client';
import { useAuth } from './auth';
import { getReadableError } from '../utils/errorHandler';
import { calculateNextDue } from '../utils/recurrence';
import { scheduleServiceDueNotification, cancelNotification } from '../services/notifications';
import type { ServiceRecord, ServiceRecordInput } from '../types';

export function useServiceRecords() {
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadRecords = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('equipment_service_records')
      .select('*')
      .eq('user_id', user.id)
      .order('next_due', { ascending: true });

    if (error) {
      console.error('Error loading service records:', error);
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  };

  const addServiceRecord = async (input: ServiceRecordInput, equipmentName: string) => {
    if (!user) return { data: null, error: 'User not authenticated' };

    const notificationId = await scheduleServiceDueNotification(equipmentName, input);

    const { data, error } = await supabase
      .from('equipment_service_records')
      .insert([{ ...input, user_id: user.id, notification_id: notificationId }])
      .select()
      .single();

    if (error) {
      await cancelNotification(notificationId);
      return { data: null, error: getReadableError(error) };
    }

    setRecords(prev => [...prev, data].sort((a, b) => a.next_due.localeCompare(b.next_due)));
    return { data, error: null };
  };

  const updateServiceRecord = async (id: string, input: ServiceRecordInput, equipmentName: string) => {
    if (!user) return { data: null, error: 'User not authenticated' };

    const existing = records.find(r => r.id === id);
    const notificationId = await scheduleServiceDueNotification(equipmentName, input);

    const { data, error } = await supabase
      .from('equipment_service_records')
      .update({ ...input, notification_id: notificationId })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      await cancelNotification(notificationId);
      return { data: null, error: getReadableError(error) };
    }

    await cancelNotification(existing?.notification_id);
    setRecords(prev =>
      prev.map(r => (r.id === id ? data : r)).sort((a, b) => a.next_due.localeCompare(b.next_due))
    );
    return { data, error: null };
  };

  const deleteServiceRecord = async (id: string) => {
    const existing = records.find(r => r.id === id);

    const { error } = await supabase
      .from('equipment_service_records')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id);

    if (!error) {
      await cancelNotification(existing?.notification_id);
      setRecords(prev => prev.filter(r => r.id !== id));
    }

    return { error: error ? getReadableError(error) : null };
  };

  // Marks a service record complete and, if it recurs, inserts a fresh
  // pending row for the next occurrence — the completed row is never
  // mutated beyond its own status, so full service history is preserved.
  const completeServiceRecord = async (id: string, equipmentName: string) => {
    const record = records.find(r => r.id === id);
    if (!record || !user) return { data: null, nextRecord: null, error: 'Service record not found' };

    const completedAt = new Date();

    const { data: updated, error: updateError } = await supabase
      .from('equipment_service_records')
      .update({ status: 'complete', completed_at: completedAt.toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return { data: null, nextRecord: null, error: getReadableError(updateError) };
    }

    await cancelNotification(record.notification_id);
    setRecords(prev => prev.map(r => (r.id === id ? updated : r)));

    if (record.recurrence_type === 'none') {
      return { data: updated, nextRecord: null, error: null };
    }

    const nextDue = calculateNextDue(record, completedAt);
    if (!nextDue) {
      return { data: updated, nextRecord: null, error: null };
    }

    const nextInput: ServiceRecordInput = {
      equipment_id: record.equipment_id,
      service_type: record.service_type,
      notes: record.notes,
      recurrence_type: record.recurrence_type,
      recurrence_interval: record.recurrence_interval,
      recurrence_day: record.recurrence_day,
      next_due: nextDue.toISOString(),
    };

    const notificationId = await scheduleServiceDueNotification(equipmentName, nextInput);

    const { data: nextRecord, error: insertError } = await supabase
      .from('equipment_service_records')
      .insert([{ ...nextInput, user_id: user.id, notification_id: notificationId }])
      .select()
      .single();

    if (insertError) {
      await cancelNotification(notificationId);
      return { data: updated, nextRecord: null, error: getReadableError(insertError) };
    }

    setRecords(prev => [...prev, nextRecord].sort((a, b) => a.next_due.localeCompare(b.next_due)));
    return { data: updated, nextRecord, error: null };
  };

  useEffect(() => {
    loadRecords();
  }, [user]);

  return {
    records,
    loading,
    addServiceRecord,
    updateServiceRecord,
    deleteServiceRecord,
    completeServiceRecord,
    refreshServiceRecords: loadRecords,
  };
}
