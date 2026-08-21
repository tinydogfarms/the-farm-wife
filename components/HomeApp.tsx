import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/hooks/auth';
import type { useUserSettings } from '../lib/hooks/userSettings';
import type { useWeather } from '../lib/hooks/weather';
import { formatBlurb } from '../lib/services/weather';
import { requestNotificationPermission } from '../lib/services/notifications';
import LocationSetupForm from './home/LocationSetupForm';

interface HomeAppProps {
  userSettings: ReturnType<typeof useUserSettings>;
  weather: ReturnType<typeof useWeather>;
}

export default function HomeApp({ userSettings, weather }: HomeAppProps) {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { settings, loading: settingsLoading, setFarmLocation } = userSettings;
  const { forecast, showLoading, error, hasLocation } = weather;
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
          ) : (
            <View style={styles.weatherSkeleton} />
          )}
          <TouchableOpacity onPress={() => setEditingLocation(true)}>
            <Text style={styles.changeLocationText}>Change location</Text>
          </TouchableOpacity>
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
  weatherSkeleton: {
    marginTop: 8,
    height: 20,
    width: '60%',
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
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
});
