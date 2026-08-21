import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { Reminder, ReminderInput, ReminderScheduleType, CustomOffsetUnit } from '../../lib/types';
import { REMINDER_EVENT_TYPES, CUSTOM_OFFSET_UNITS } from '../../lib/constants';
import { getReadableError } from '../../lib/utils/errorHandler';
import Dropdown from '../Dropdown';
import DatePicker from '../DatePicker';

interface ReminderFormProps {
  onSubmit: (data: ReminderInput) => Promise<void>;
  editReminder?: Reminder;
  onUpdate?: (id: string, data: ReminderInput) => Promise<void>;
  onCancel?: () => void;
}

const SCHEDULE_OPTIONS: { value: ReminderScheduleType; label: string }[] = [
  { value: 'all', label: 'All the Reminders' },
  { value: 'custom', label: 'Custom' },
];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function emptyForm(): ReminderInput {
  return {
    name: '',
    event_type: 'Birthday',
    event_month: 0,
    event_day: 0,
    event_year: null,
    is_critical: false,
    schedule_type: 'all',
    custom_offset_amount: null,
    custom_offset_unit: null,
    notes: '',
  };
}

function dateStringFor(input: ReminderInput): string {
  if (!input.event_month || !input.event_day) return '';
  const year = input.event_year || new Date().getFullYear();
  return `${year}-${pad(input.event_month)}-${pad(input.event_day)}`;
}

function validate(input: ReminderInput): string | null {
  if (!input.name.trim()) return 'Name is required.';
  if (!input.event_month || !input.event_day) return 'Date is required.';
  if (input.is_critical) {
    if (input.schedule_type === 'custom') {
      if (!input.custom_offset_amount || input.custom_offset_amount <= 0) {
        return 'Enter how many days/weeks/months before to remind you.';
      }
      if (!input.custom_offset_unit) return 'Select a unit for the custom reminder.';
    }
  }
  return null;
}

export default function ReminderForm({ onSubmit, editReminder, onUpdate, onCancel }: ReminderFormProps) {
  const [formData, setFormData] = useState<ReminderInput>(emptyForm());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editReminder) {
      setFormData({
        name: editReminder.name,
        event_type: editReminder.event_type,
        event_month: editReminder.event_month,
        event_day: editReminder.event_day,
        event_year: editReminder.event_year ?? null,
        is_critical: editReminder.is_critical,
        schedule_type: editReminder.schedule_type ?? 'all',
        custom_offset_amount: editReminder.custom_offset_amount ?? null,
        custom_offset_unit: editReminder.custom_offset_unit ?? null,
        notes: editReminder.notes || '',
      });
    }
  }, [editReminder]);

  const handleDateChange = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    setFormData({ ...formData, event_year: year || null, event_month: month || 0, event_day: day || 0 });
  };

  const handleSubmit = async () => {
    const validationError = validate(formData);
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    const submission: ReminderInput = {
      ...formData,
      schedule_type: formData.is_critical ? formData.schedule_type : null,
      custom_offset_amount: formData.is_critical && formData.schedule_type === 'custom' ? formData.custom_offset_amount : null,
      custom_offset_unit: formData.is_critical && formData.schedule_type === 'custom' ? formData.custom_offset_unit : null,
    };

    setLoading(true);
    try {
      if (editReminder && onUpdate) {
        await onUpdate(editReminder.id, submission);
        Alert.alert('Success', 'Reminder updated!');
        onCancel?.();
      } else {
        await onSubmit(submission);
        setFormData(emptyForm());
        Alert.alert('Success', 'Reminder added!');
      }
    } catch (error) {
      Alert.alert('Error', getReadableError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>{editReminder ? 'Edit Reminder' : 'Add Reminder'}</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        placeholder="e.g., Mom"
        placeholderTextColor="#9ca3af"
        autoCapitalize="words"
      />

      <Dropdown
        label="Event Type"
        value={formData.event_type}
        options={REMINDER_EVENT_TYPES}
        onSelect={(event_type) => setFormData({ ...formData, event_type: event_type as ReminderInput['event_type'] })}
        placeholder="Select an event type"
      />

      <DatePicker label="Date" value={dateStringFor(formData)} onChange={handleDateChange} />

      <Text style={styles.label}>Reminder Style</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, !formData.is_critical && styles.activeToggle]}
          onPress={() => setFormData({ ...formData, is_critical: false })}
        >
          <Text style={[styles.toggleButtonText, !formData.is_critical && styles.activeToggleText]}>
            Just Show on Home
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, formData.is_critical && styles.activeToggle]}
          onPress={() => setFormData({ ...formData, is_critical: true })}
        >
          <Text style={[styles.toggleButtonText, formData.is_critical && styles.activeToggleText]}>
            Critical — Also Notify
          </Text>
        </TouchableOpacity>
      </View>

      {formData.is_critical && (
        <>
          <Text style={styles.label}>Notification Schedule</Text>
          <View style={styles.toggleRow}>
            {SCHEDULE_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[styles.toggleButton, formData.schedule_type === option.value && styles.activeToggle]}
                onPress={() => setFormData({ ...formData, schedule_type: option.value })}
              >
                <Text style={[styles.toggleButtonText, formData.schedule_type === option.value && styles.activeToggleText]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {formData.schedule_type === 'custom' && (
            <>
              <Text style={styles.label}>Remind Me</Text>
              <View style={styles.customRow}>
                <TextInput
                  style={[styles.input, styles.customAmountInput]}
                  value={formData.custom_offset_amount ? String(formData.custom_offset_amount) : ''}
                  onChangeText={(text) => {
                    const digits = text.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, custom_offset_amount: digits ? parseInt(digits, 10) : null });
                  }}
                  placeholder="e.g., 2"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                />
                <View style={styles.customUnitDropdown}>
                  <Dropdown
                    label="Unit"
                    value={formData.custom_offset_unit || ''}
                    options={CUSTOM_OFFSET_UNITS}
                    onSelect={(unit) => setFormData({ ...formData, custom_offset_unit: unit as CustomOffsetUnit })}
                    placeholder="Select a unit"
                  />
                </View>
              </View>
              <Text style={styles.helperText}>before the event</Text>
            </>
          )}
        </>
      )}

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
            {loading ? (editReminder ? 'Updating...' : 'Adding...') : (editReminder ? 'Update Reminder' : 'Add Reminder')}
          </Text>
        </TouchableOpacity>
        {editReminder && (
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
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  toggleButtonText: {
    fontSize: 13,
    textAlign: 'center',
  },
  activeToggleText: {
    color: 'white',
  },
  customRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customAmountInput: {
    flex: 1,
  },
  customUnitDropdown: {
    flex: 2,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
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
