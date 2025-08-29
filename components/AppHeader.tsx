import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { User } from '@supabase/supabase-js';

interface AppHeaderProps {
  user: User | null;
  onSignOut: () => void;
}

export default function AppHeader({ user, onSignOut }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.title}>The Farm Wife</Text>
      <View style={styles.headerRight}>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <TouchableOpacity onPress={onSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  signOutButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  signOutText: {
    color: '#2563eb',
    fontSize: 12,
  },
});