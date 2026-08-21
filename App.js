import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from './lib/hooks/auth';
import { useUserSettings } from './lib/hooks/userSettings';
import { useWeather } from './lib/hooks/weather';
import { useReminders } from './lib/hooks/reminders';
import { registerNotificationResponseHandler } from './lib/services/notifications';
import LoginScreen from './app/auth/login';
import WelcomeScreen from './components/WelcomeScreen';
import MainTabs from './components/MainTabs';

export default function App() {
  const { user, loading } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);

  // Fetched once here and passed down, so the Welcome screen and the Home
  // tab share the same forecast instead of each re-fetching from scratch
  // (which meant paying the network delay twice per launch).
  const userSettings = useUserSettings();
  const weather = useWeather(userSettings.settings?.latitude ?? null, userSettings.settings?.longitude ?? null);
  const reminders = useReminders();

  // Registered exactly once — a second registration would handle every
  // Snooze/Dismiss tap multiple times.
  useEffect(() => {
    return registerNotificationResponseHandler({ onCascadeDismiss: reminders.dismissCascade });
  }, []);

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {!user ? (
        <LoginScreen />
      ) : showWelcome ? (
        <WelcomeScreen onContinue={() => setShowWelcome(false)} settings={userSettings.settings} weather={weather} />
      ) : (
        <MainTabs userSettings={userSettings} weather={weather} reminders={reminders} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
});