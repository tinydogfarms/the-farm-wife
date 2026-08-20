import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { Livestock, LivestockCareRecord, LivestockCareRecordInput, RecurrenceType } from '../../lib/types';
import { CARE_TYPES } from '../../lib/constants';
import { getReadableError } from '../../lib/utils/errorHandler';
import Dropdown from '../Dropdown';

interface CareRecordFormProps {
  livestock: Livestock[];
  onSubmit: (data: LivestockCareRecordInput, livestockName: string) => Promise<void>;
  editRecord?: LivestockCareRecord;
  onUpdate?: (id: string, data: LivestockCareRecordInput, livestockName: string) => Promise<void>;
  onCancel?: () => void;
}

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'none', label: 'One-time' },
  { value: 'interval', label: 'Every N days' },
  { value: 'monthly', label: 'Monthly' },
];

function emptyForm(): LivestockCareRecordInput {
  return {
    livestock_id: '',
    care_type: '',
    notes: '',
    recurrence_type: 'none',
    recurrence_interval: null,
    recurrence_day: null,
    next_due: new Date().toISOString().split('T')[0],
  };
}

function validate(input: LivestockCareRecordInput): string | null {
  if (!input.livestock_id) return 'Livestock is required.';
  if (!input.care_type.trim()) return 'Care type is required.';

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(input.next_due)) return 'Please enter a valid due date in YYYY-MM-DD format.';

  if (input.recurrence_type === 'interval') {
    if (!input.recurrence_interval || input.recurrence_interval <= 0) {
      return 'Enter how many days between care events.';
    }
  }
  if (input.recurrence_type === 'monthly') {
    if (!input.recurrence_day || input.recurrence_day < 1 || input.recurrence_day > 31) {
      return 'Enter a day of the month between 1 and 31.';
    }
  }
  return null;
}

export default function CareRecordForm({ livestock, onSubmit, editRecord, onUpdate, onCancel }: CareRecordFormProps) {
  const [formData, setFormData] = useState<LivestockCareRecordInput>(emptyForm());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editRecord) {
      setFormData({
        livestock_id: editRecord.livestock_id,
        care_type: editRecord.care_type,
        notes: editRecord.notes || '',
        recurrence_type: editRecord.recurrence_type,
        recurrence_interval: editRecord.recurrence_interval ?? null,
        recurrence_day: editRecord.recurrence_day ?? null,
        next_due: editRecord.next_due.split('T')[0],
      });
    }
  }, [editRecord]);

  const selectedLivestock = livestock.find(l => l.id === formData.livestock_id);
  const livestockNameToId = new Map(livestock.map(l => [l.name, l.id]));

  const handleSubmit = async () => {
    const validationError = validate(formData);
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    const livestockName = selectedLivestock?.name || '';

    setLoading(true);
    try {
      if (editRecord && onUpdate) {
        await onUpdate(editRecord.id, formData, livestockName);
        Alert.alert('Success', 'Care record updated!');
        onCancel?.();
      } else {
        await onSubmit(formData, livestockName);
        setFormData(emptyForm());
        Alert.alert('Success', 'Care record added!');
      }
    } catch (error) {
      Alert.alert('Error', getReadableError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>{editRecord ? 'Edit Care Record' : 'Add Care Record'}</Text>

      <Dropdown
        label="Livestock"
        value={selectedLivestock?.name || ''}
        options={livestock.map(l => l.name)}
        onSelect={(name) => setFormData({ ...formData, livestock_id: livestockNameToId.get(name) || '' })}
        placeholder="Select livestock"
      />

      <Dropdown
        label="Care Type"
        value={formData.care_type}
        options={CARE_TYPES}
        onSelect={(care_type) => setFormData({ ...formData, care_type })}
        placeholder="Select a care type"
      />

      <Text style={styles.label}>Recurrence</Text>
      <View style={styles.recurrenceButtons}>
        {RECURRENCE_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[styles.recurrenceButton, formData.recurrence_type === option.value && styles.activeRecurrence]}
            onPress={() => setFormData({ ...formData, recurrence_type: option.value })}
          >
            <Text style={[styles.recurrenceButtonText, formData.recurrence_type === option.value && styles.activeRecurrenceText]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {formData.recurrence_type === 'interval' && (
        <>
          <Text style={styles.label}>Days Between Care Events</Text>
          <TextInput
            style={styles.input}
            value={formData.recurrence_interval?.toString() || ''}
            onChangeText={(text) => setFormData({ ...formData, recurrence_interval: parseInt(text, 10) || null })}
            placeholder="e.g., 90"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
        </>
      )}

      {formData.recurrence_type === 'monthly' && (
        <>
          <Text style={styles.label}>Day of Month</Text>
          <TextInput
            style={styles.input}
            value={formData.recurrence_day?.toString() || ''}
            onChangeText={(text) => setFormData({ ...formData, recurrence_day: parseInt(text, 10) || null })}
            placeholder="e.g., 1"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
        </>
      )}

      <Text style={styles.label}>Next Due Date</Text>
      <TextInput
        style={styles.input}
        value={formData.next_due}
        onChangeText={(text) => setFormData({ ...formData, next_due: text })}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#9ca3af"
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={styles.input}
        value={formData.notes}
        onChangeText={(text) => setFormData({ ...formData, notes: text })}
        placeholder="Optional notes"
        placeholderTextColor="#9ca3af"
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.addButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>
            {loading ? (editRecord ? 'Updating...' : 'Adding...') : (editRecord ? 'Update Record' : 'Add Record')}
          </Text>
        </TouchableOpacity>
        {editRecord && (
          <TouchableOpacity style={styles.cancelButton} onPress={() => onCancel?.()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#111827',
  },
  recurrenceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  recurrenceButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  activeRecurrence: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  recurrenceButtonText: {
    fontSize: 13,
  },
  activeRecurrenceText: {
    color: 'white',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
