import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/hooks/auth';
import type { useUserSettings } from '../lib/hooks/userSettings';
import type { useWeather } from '../lib/hooks/weather';
import type { useReminders } from '../lib/hooks/reminders';
import { formatBlurb } from '../lib/services/weather';
import { requestNotificationPermission } from '../lib/services/notifications';
import LocationSetupForm from './home/LocationSetupForm';

interface HomeAppProps {
  userSettings: ReturnType<typeof useUserSettings>;
  weather: ReturnType<typeof useWeather>;
  reminders: ReturnType<typeof useReminders>;
}

function formatDaysUntil(occurrence: Date): string {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysUntil = Math.round((occurrence.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  return `In ${daysUntil} days`;
}

export default function HomeApp({ userSettings, weather, reminders }: HomeAppProps) {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { settings, loading: settingsLoading, setFarmLocation } = userSettings;
  const { forecast, showLoading, error, hasLocation } = weather;
  const { upcomingReminders } = reminders;
  const [editingLocation, setEditingLocation] = useState(false);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) Alert.alert('Error', error.message);
  };

  const [today] = forecast?.periods ?? [];

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Home</Text>
        <View style={styles.headerRight}>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <TouchableOpacity onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {settingsLoading ? null : !hasLocation || editingLocation ? (
        <LocationSetupForm
          initialZip={settings?.zip_code || ''}
          onSave={setFarmLocation}
          onSaved={() => setEditingLocation(false)}
          onCancel={hasLocation ? () => setEditingLocation(false) : undefined}
        />
      ) : (
        <View style={styles.weatherCard}>
          <Text style={styles.weatherLocation}>{settings?.location_label}</Text>
          {!!error && <Text style={styles.weatherError}>{error}</Text>}
          {today ? (
            <Text style={styles.weatherBlurb}>{formatBlurb(today)}</Text>
          ) : showLoading ? (
            <Text style={styles.weatherStatus}>Checking today's weather...</Text>
          ) : null}
          <TouchableOpacity onPress={() => setEditingLocation(true)}>
            <Text style={styles.changeLocationText}>Change location</Text>
          </TouchableOpacity>
        </View>
      )}

      {upcomingReminders.length > 0 && (
        <View style={styles.remindersCard}>
          <Text style={styles.remindersTitle}>Upcoming Reminders</Text>
          {upcomingReminders.map(({ reminder, occurrence }) => (
            <View key={reminder.id} style={styles.reminderRow}>
              <View>
                <Text style={styles.reminderName}>{reminder.name}</Text>
                <Text style={styles.reminderType}>{reminder.event_type}</Text>
              </View>
              <Text style={styles.reminderDue}>{formatDaysUntil(occurrence)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  signOutText: {
    color: '#2563eb',
    fontSize: 12,
  },
  weatherCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  weatherLocation: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  weatherStatus: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  weatherError: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 8,
  },
  weatherBlurb: {
    fontSize: 16,
    color: '#374151',
    marginTop: 8,
  },
  changeLocationText: {
    fontSize: 13,
    color: '#2563eb',
    marginTop: 12,
  },
  remindersCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
  },
  remindersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  reminderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  reminderType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  reminderDue: {
    fontSize: 13,
    color: '#6b7280',
  },
});
