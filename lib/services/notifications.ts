import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const SERVICE_REMINDERS_CHANNEL = 'service-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let channelReady: Promise<void> | null = null;

function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return Promise.resolve();

  if (!channelReady) {
    channelReady = Notifications.setNotificationChannelAsync(SERVICE_REMINDERS_CHANNEL, {
      name: 'Service Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    }).then(() => undefined);
  }

  return channelReady;
}

export async function requestNotificationPermission(): Promise<boolean> {
  await ensureAndroidChannel();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleServiceDueNotification(
  entityName: string,
  record: { label: string; next_due: string },
  titleSuffix: string = 'service due'
): Promise<string | null> {
  const dueDate = new Date(record.next_due);

  // Don't schedule a notification for a date that's already passed —
  // it would either fire immediately or silently be dropped depending
  // on platform, neither of which is useful here.
  if (Number.isNaN(dueDate.getTime()) || dueDate.getTime() <= Date.now()) {
    return null;
  }

  await ensureAndroidChannel();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: `${entityName} ${titleSuffix}`,
      body: record.label,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dueDate },
  });
}

export async function cancelNotification(notificationId: string | null | undefined): Promise<void> {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
