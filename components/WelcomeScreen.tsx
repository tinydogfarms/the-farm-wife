import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatBlurb } from '../lib/services/weather';
import type { UserSettings } from '../lib/types';
import type { useWeather } from '../lib/hooks/weather';

interface WelcomeScreenProps {
  onContinue: () => void;
  settings: UserSettings | null;
  weather: ReturnType<typeof useWeather>;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getDateLine(): string {
  const formatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  return `Today is ${formatted}`;
}

export default function WelcomeScreen({ onContinue, settings, weather }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { forecast, showLoading, hasLocation } = weather;
  const [today] = forecast?.periods ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.content}>
        <Text style={styles.greeting}>{getGreeting()} 😘</Text>
        <Text style={styles.dateLine}>{getDateLine()}</Text>

        {!hasLocation ? (
          <Text style={styles.weatherBlurb}>
            Set your farm's ZIP code on the Home tab to see today's weather here.
          </Text>
        ) : today ? (
          <Text style={styles.weatherBlurb}>
            {formatBlurb(today)} — {settings?.location_label}
          </Text>
        ) : showLoading ? (
          <Text style={styles.weatherBlurb}>Checking today's weather...</Text>
        ) : null}
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  content: {
    marginTop: 60,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  dateLine: {
    fontSize: 18,
    color: '#374151',
    marginTop: 8,
  },
  weatherBlurb: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 24,
    lineHeight: 22,
  },
  continueButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
