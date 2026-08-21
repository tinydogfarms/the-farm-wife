import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/client';
import { useAuth } from './auth';
import { getReadableError } from '../utils/errorHandler';
import { nextAnnualOccurrence } from '../utils/annualRecurrence';
import { cancelNotifications, scheduleReminderCascade, scheduleReminderCustom } from '../services/notifications';
import type { Reminder, ReminderInput } from '../types';

function occurrenceOf(reminder: Reminder, from: Date): Date {
  return nextAnnualOccurrence({ month: reminder.event_month, day: reminder.event_day }, from);
}

function sortByOccurrence(a: Reminder, b: Reminder): number {
  const today = new Date();
  return occurrenceOf(a, today).getTime() - occurrenceOf(b, today).getTime();
}

// If a critical reminder's notifications are stale (never scheduled, or
// scheduled for a year that's already passed), cancels the old ones and
// schedules the current year's set, persisting the result. Non-critical
// reminders are left as-is — they're computed live for display, nothing
// to schedule.
async function reconcileReminder(reminder: Reminder): Promise<Reminder> {
  if (!reminder.is_critical) return reminder;

  const occurrence = occurrenceOf(reminder, new Date());
  const targetYear = occurrence.getFullYear();

  if (reminder.scheduled_year === targetYear && reminder.notification_ids.length > 0) {
    return reminder;
  }

  await cancelNotifications(reminder.notification_ids);

  let newIds: string[] = [];
  if (reminder.schedule_type === 'all') {
    newIds = await scheduleReminderCascade(reminder.id, reminder.name, reminder.event_type, occurrence);
  } else if (reminder.schedule_type === 'custom' && reminder.custom_offset_amount && reminder.custom_offset_unit) {
    const id = await scheduleReminderCustom(
      reminder.id,
      reminder.name,
      reminder.event_type,
      occurrence,
      reminder.custom_offset_amount,
      reminder.custom_offset_unit
    );
    newIds = id ? [id] : [];
  }

  const { data, error } = await supabase
    .from('reminders')
    .update({ scheduled_year: targetYear, notification_ids: newIds })
    .eq('id', reminder.id)
    .select()
    .single();

  if (error) {
    console.error('Error persisting reminder schedule:', error);
    return reminder;
  }
  return data;
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadReminders = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('event_month', { ascending: true })
      .order('event_day', { ascending: true });

    if (error) {
      console.error('Error loading reminders:', error);
      setLoading(false);
      return;
    }

    const reconciled = await Promise.all((data || []).map(reconcileReminder));
    setReminders(reconciled.sort(sortByOccurrence));
    setLoading(false);
  };

  const addReminder = async (input: ReminderInput) => {
    if (!user) return { data: null, error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('reminders')
      .insert([{ ...input, user_id: user.id }])
      .select()
      .single();

    if (error) return { data: null, error: getReadableError(error) };

    const reconciled = await reconcileReminder(data);
    setReminders(prev => [...prev, reconciled].sort(sortByOccurrence));
    return { data: reconciled, error: null };
  };

  const updateReminder = async (id: string, input: ReminderInput) => {
    if (!user) return { data: null, error: 'User not authenticated' };

    const existing = reminders.find(r => r.id === id);
    if (existing?.notification_ids?.length) {
      await cancelNotifications(existing.notification_ids);
    }

    const { data, error } = await supabase
      .from('reminders')
      .update({ ...input, scheduled_year: null, notification_ids: [] })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return { data: null, error: getReadableError(error) };

    const reconciled = await reconcileReminder(data);
    setReminders(prev => prev.map(r => (r.id === id ? reconciled : r)).sort(sortByOccurrence));
    return { data: reconciled, error: null };
  };

  const deleteReminder = async (id: string) => {
    const existing = reminders.find(r => r.id === id);

    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id);

    if (!error) {
      if (existing?.notification_ids?.length) {
        await cancelNotifications(existing.notification_ids);
      }
      setReminders(prev => prev.filter(r => r.id !== id));
    }

    return { error: error ? getReadableError(error) : null };
  };

  // Called from the app-wide notification response handler when Dismiss
  // is tapped on a cascade step — cancels the remaining scheduled steps
  // for this occurrence only; next year's cascade still fires normally.
  const dismissCascade = async (reminderId: string, firedNotificationId: string) => {
    let target = reminders.find(r => r.id === reminderId);

    if (!target) {
      const { data } = await supabase.from('reminders').select('*').eq('id', reminderId).maybeSingle();
      target = data ?? undefined;
    }
    if (!target) return;

    const remaining = target.notification_ids.filter(id => id !== firedNotificationId);
    await cancelNotifications(remaining);

    const { data: updated, error } = await supabase
      .from('reminders')
      .update({ notification_ids: [] })
      .eq('id', reminderId)
      .select()
      .single();

    if (!error && updated) {
      setReminders(prev => prev.map(r => (r.id === reminderId ? updated : r)));
    }
  };

  useEffect(() => {
    loadReminders();
  }, [user]);

  const upcomingReminders = useMemo(() => {
    const today = new Date();
    return reminders
      .map(reminder => ({ reminder, occurrence: occurrenceOf(reminder, today) }))
      .sort((a, b) => a.occurrence.getTime() - b.occurrence.getTime())
      .slice(0, 5);
  }, [reminders]);

  return {
    reminders,
    loading,
    addReminder,
    updateReminder,
    deleteReminder,
    dismissCascade,
    upcomingReminders,
    refreshReminders: loadReminders,
  };
}
