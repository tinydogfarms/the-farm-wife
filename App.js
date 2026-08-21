import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from './lib/hooks/auth';
import LoginScreen from './app/auth/login';
import WelcomeScreen from './components/WelcomeScreen';
import MainTabs from './components/MainTabs';

export default function App() {
  const { user, loading } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);

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
        <WelcomeScreen onContinue={() => setShowWelcome(false)} />
      ) : (
        <MainTabs />
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