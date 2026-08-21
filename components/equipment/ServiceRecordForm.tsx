import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { Equipment, ServiceRecord, ServiceRecordInput, RecurrenceType } from '../../lib/types';
import { SERVICE_TYPES } from '../../lib/constants';
import { getReadableError } from '../../lib/utils/errorHandler';
import Dropdown from '../Dropdown';
import DatePicker from '../DatePicker';

interface ServiceRecordFormProps {
  equipment: Equipment[];
  onSubmit: (data: ServiceRecordInput, equipmentName: string) => Promise<void>;
  editRecord?: ServiceRecord;
  onUpdate?: (id: string, data: ServiceRecordInput, equipmentName: string) => Promise<void>;
  onCancel?: () => void;
}

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'none', label: 'One-time' },
  { value: 'interval', label: 'Every N days' },
  { value: 'monthly', label: 'Monthly' },
];

function emptyForm(): ServiceRecordInput {
  return {
    equipment_id: '',
    service_type: '',
    notes: '',
    recurrence_type: 'none',
    recurrence_interval: null,
    recurrence_day: null,
    next_due: new Date().toISOString().split('T')[0],
  };
}

function validate(input: ServiceRecordInput): string | null {
  if (!input.equipment_id) return 'Equipment is required.';
  if (!input.service_type.trim()) return 'Service type is required.';

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(input.next_due)) return 'Please enter a valid due date in YYYY-MM-DD format.';

  if (input.recurrence_type === 'interval') {
    if (!input.recurrence_interval || input.recurrence_interval <= 0) {
      return 'Enter how many days between services.';
    }
  }
  if (input.recurrence_type === 'monthly') {
    if (!input.recurrence_day || input.recurrence_day < 1 || input.recurrence_day > 31) {
      return 'Enter a day of the month between 1 and 31.';
    }
  }
  return null;
}

export default function ServiceRecordForm({ equipment, onSubmit, editRecord, onUpdate, onCancel }: ServiceRecordFormProps) {
  const [formData, setFormData] = useState<ServiceRecordInput>(emptyForm());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editRecord) {
      setFormData({
        equipment_id: editRecord.equipment_id,
        service_type: editRecord.service_type,
        notes: editRecord.notes || '',
        recurrence_type: editRecord.recurrence_type,
        recurrence_interval: editRecord.recurrence_interval ?? null,
        recurrence_day: editRecord.recurrence_day ?? null,
        next_due: editRecord.next_due.split('T')[0],
      });
    }
  }, [editRecord]);

  const selectedEquipment = equipment.find(e => e.id === formData.equipment_id);
  const equipmentNameToId = new Map(equipment.map(e => [e.name, e.id]));

  const handleSubmit = async () => {
    const validationError = validate(formData);
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    const equipmentName = selectedEquipment?.name || '';

    setLoading(true);
    try {
      if (editRecord && onUpdate) {
        await onUpdate(editRecord.id, formData, equipmentName);
        Alert.alert('Success', 'Service record updated!');
        onCancel?.();
      } else {
        await onSubmit(formData, equipmentName);
        setFormData(emptyForm());
        Alert.alert('Success', 'Service record added!');
      }
    } catch (error) {
      Alert.alert('Error', getReadableError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>{editRecord ? 'Edit Service Record' : 'Add Service Record'}</Text>

      <Dropdown
        label="Equipment"
        value={selectedEquipment?.name || ''}
        options={equipment.map(e => e.name)}
        onSelect={(name) => setFormData({ ...formData, equipment_id: equipmentNameToId.get(name) || '' })}
        placeholder="Select equipment"
      />

      <Dropdown
        label="Service Type"
        value={formData.service_type}
        options={SERVICE_TYPES}
        onSelect={(service_type) => setFormData({ ...formData, service_type })}
        placeholder="Select a service type"
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
          <Text style={styles.label}>Days Between Services</Text>
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

      <DatePicker
        label="Next Due Date"
        value={formData.next_due}
        onChange={(next_due) => setFormData({ ...formData, next_due })}
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
