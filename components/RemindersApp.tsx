import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/hooks/auth';
import type { useReminders } from '../lib/hooks/reminders';
import { requestNotificationPermission } from '../lib/services/notifications';
import type { Reminder } from '../lib/types';

import ReminderForm from './reminders/ReminderForm';
import ReminderList from './reminders/ReminderList';

interface RemindersAppProps {
  reminders: ReturnType<typeof useReminders>;
}

export default function RemindersApp({ reminders }: RemindersAppProps) {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { reminders: reminderList, addReminder, updateReminder, deleteReminder } = reminders;

  const [editingReminder, setEditingReminder] = useState<Reminder | undefined>(undefined);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) Alert.alert('Error', error.message);
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteReminder(id);
    if (error) Alert.alert('Error', error);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Reminders</Text>
        <View style={styles.headerRight}>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <TouchableOpacity onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ReminderForm
        onSubmit={async (data) => {
          const { error } = await addReminder(data);
          if (error) throw new Error(error);
        }}
        editReminder={editingReminder}
        onUpdate={async (id, data) => {
          const { error } = await updateReminder(id, data);
          if (error) throw new Error(error);
        }}
        onCancel={() => setEditingReminder(undefined)}
      />

      <ReminderList
        reminders={reminderList}
        onEdit={setEditingReminder}
        onDelete={handleDelete}
      />
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
});
