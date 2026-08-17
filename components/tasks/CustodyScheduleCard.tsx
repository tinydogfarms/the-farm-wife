import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { UserSettings } from '../../lib/types';

interface CustodyScheduleCardProps {
  settings: UserSettings | null;
  onSave: (custodyWeekStart: string, custodyAlternates: boolean) => Promise<void>;
}

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export default function CustodyScheduleCard({ settings, onSave }: CustodyScheduleCardProps) {
  const [startDate, setStartDate] = useState(settings?.custody_week_start ?? '');
  const [alternates, setAlternates] = useState(settings?.custody_alternates ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!dateRegex.test(startDate)) {
      Alert.alert('Invalid Date', 'Enter the custody week start date as YYYY-MM-DD.');
      return;
    }
    setSaving(true);
    try {
      await onSave(startDate, alternates);
      Alert.alert('Saved', 'Custody schedule updated.');
    } catch (error) {
      Alert.alert('Error', 'Could not save custody schedule.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Custody Schedule</Text>
      <Text style={styles.subtitle}>
        Needed for "custody week" tasks to know when they're next due.
      </Text>

      <Text style={styles.label}>Start of your first custody week</Text>
      <TextInput
        style={styles.input}
        value={startDate}
        onChangeText={setStartDate}
        placeholder="YYYY-MM-DD"
      />

      <TouchableOpacity style={styles.toggleRow} onPress={() => setAlternates(!alternates)}>
        <View style={[styles.checkbox, alternates && styles.checkboxChecked]} />
        <Text style={styles.toggleLabel}>Custody alternates weekly</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.saveButton, saving && styles.disabledButton]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  toggleLabel: {
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
