import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { computeCascadeFireDates, computeCustomFireDate, describeCascadeStep, describeCustomOffset } from '../utils/reminderSchedule';
import type { CustomOffsetUnit } from '../types';

const SERVICE_REMINDERS_CHANNEL = 'service-reminders';
const REMINDERS_CHANNEL = 'reminders';

const NOTIFICATION_CATEGORY = 'farmwife.actionable';
const SNOOZE_1_DAY = 'snooze_1_day';
const SNOOZE_1_WEEK = 'snooze_1_week';
const DISMISS = 'dismiss';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = ONE_DAY_MS * 7;

export type NotificationKind = 'service_due' | 'care_due' | 'reminder_cascade' | 'reminder_custom';

export interface NotificationPayload {
  kind: NotificationKind;
  title: string;
  body: string;
  // Only present for reminder_cascade/reminder_custom — lets the Dismiss
  // action find and cancel sibling notifications for this occurrence.
  reminderId?: string;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const channelReady = new Map<string, Promise<void>>();

function ensureAndroidChannel(channelId: string, name: string): Promise<void> {
  if (Platform.OS !== 'android') return Promise.resolve();

  if (!channelReady.has(channelId)) {
    channelReady.set(
      channelId,
      Notifications.setNotificationChannelAsync(channelId, {
        name,
        importance: Notifications.AndroidImportance.DEFAULT,
      }).then(() => undefined)
    );
  }

  return channelReady.get(channelId)!;
}

let categoryReady: Promise<void> | null = null;

function ensureNotificationCategory(): Promise<void> {
  if (!categoryReady) {
    categoryReady = Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORY, [
      { identifier: SNOOZE_1_DAY, buttonTitle: 'Snooze 1 Day' },
      { identifier: SNOOZE_1_WEEK, buttonTitle: 'Snooze 1 Week' },
      { identifier: DISMISS, buttonTitle: 'Dismiss', options: { isDestructive: true } },
    ]).then(() => undefined);
  }
  return categoryReady;
}

export async function requestNotificationPermission(): Promise<boolean> {
  await ensureAndroidChannel(SERVICE_REMINDERS_CHANNEL, 'Service Reminders');

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function scheduleActionableNotification(
  channelId: string,
  channelName: string,
  date: Date,
  payload: NotificationPayload
): Promise<string | null> {
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
    return null;
  }

  await ensureAndroidChannel(channelId, channelName);
  await ensureNotificationCategory();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: payload.title,
      body: payload.body,
      categoryIdentifier: NOTIFICATION_CATEGORY,
      data: payload as unknown as Record<string, unknown>,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId },
  });
}

export async function scheduleServiceDueNotification(
  entityName: string,
  record: { label: string; next_due: string },
  titleSuffix: string = 'service due'
): Promise<string | null> {
  const kind: NotificationKind = titleSuffix === 'care due' ? 'care_due' : 'service_due';
  const dueDate = new Date(record.next_due);

  return scheduleActionableNotification(SERVICE_REMINDERS_CHANNEL, 'Service Reminders', dueDate, {
    kind,
    title: `${entityName} ${titleSuffix}`,
    body: record.label,
  });
}

/**
 * Schedules the "all the reminders" cascade (30/21/14/7 days before, then
 * daily down to the day before, then the day itself) for a critical
 * reminder's next occurrence. Steps already in the past are skipped.
 * Returns the ids that were actually scheduled.
 */
export async function scheduleReminderCascade(
  reminderId: string,
  name: string,
  eventType: string,
  occurrence: Date
): Promise<string[]> {
  const steps = computeCascadeFireDates(occurrence);
  const ids: string[] = [];

  for (const step of steps) {
    const id = await scheduleActionableNotification(REMINDERS_CHANNEL, 'Reminders', step.fireAt, {
      kind: 'reminder_cascade',
      title: `${name} — ${eventType}`,
      body: describeCascadeStep(step.offsetDays),
      reminderId,
    });
    if (id) ids.push(id);
  }

  return ids;
}

/**
 * Schedules a single custom lead-time reminder for a critical reminder's
 * next occurrence.
 */
export async function scheduleReminderCustom(
  reminderId: string,
  name: string,
  eventType: string,
  occurrence: Date,
  amount: number,
  unit: CustomOffsetUnit
): Promise<string | null> {
  const fireAt = computeCustomFireDate(occurrence, amount, unit);
  return scheduleActionableNotification(REMINDERS_CHANNEL, 'Reminders', fireAt, {
    kind: 'reminder_custom',
    title: `${name} — ${eventType}`,
    body: describeCustomOffset(amount, unit),
    reminderId,
  });
}

export async function cancelNotification(notificationId: string | null | undefined): Promise<void> {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelNotifications(notificationIds: (string | null | undefined)[]): Promise<void> {
  await Promise.all(notificationIds.map(cancelNotification));
}

interface NotificationResponseHandlerOptions {
  onCascadeDismiss?: (reminderId: string, firedNotificationId: string) => Promise<void>;
}

/**
 * Registers the single app-wide notification response listener — must be
 * called exactly once (e.g. in App.js), not per-screen, or Snooze/Dismiss
 * taps would each be handled multiple times. Returns a cleanup function.
 */
export function registerNotificationResponseHandler(
  options: NotificationResponseHandlerOptions = {}
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(async response => {
    const payload = response.notification.request.content.data as Partial<NotificationPayload> | undefined;
    if (!payload?.kind) return;

    const firedId = response.notification.request.identifier;
    const channelId = payload.kind === 'service_due' || payload.kind === 'care_due'
      ? SERVICE_REMINDERS_CHANNEL
      : REMINDERS_CHANNEL;

    switch (response.actionIdentifier) {
      case SNOOZE_1_DAY:
        await scheduleActionableNotification(channelId, channelId === REMINDERS_CHANNEL ? 'Reminders' : 'Service Reminders', new Date(Date.now() + ONE_DAY_MS), payload as NotificationPayload);
        break;
      case SNOOZE_1_WEEK:
        await scheduleActionableNotification(channelId, channelId === REMINDERS_CHANNEL ? 'Reminders' : 'Service Reminders', new Date(Date.now() + ONE_WEEK_MS), payload as NotificationPayload);
        break;
      case DISMISS:
        if (payload.kind === 'reminder_cascade' && payload.reminderId && options.onCascadeDismiss) {
          await options.onCascadeDismiss(payload.reminderId, firedId);
        }
        break;
      default:
        break; // plain tap (Notifications.DEFAULT_ACTION_IDENTIFIER) — just opens the app
    }
  });

  return () => subscription.remove();
}
