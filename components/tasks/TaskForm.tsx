import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { Task, TaskCategory, TaskInput, TaskOwner } from '../../lib/types';
import {
  TASK_CATEGORIES,
  TASK_CATEGORY_LABELS,
  TASK_OWNERS,
  RECURRENCE_TYPES,
  WEEKDAY_LABELS,
  CUSTODY_WEEK_OPTIONS,
  findKeyByLabel,
  findLabelByKey,
} from '../../lib/constants/taskCategories';
import { getReadableError } from '../../lib/utils/errorHandler';
import Dropdown from '../Dropdown';

interface TaskFormProps {
  onSubmit: (data: TaskInput) => Promise<void>;
  editTask?: Task;
  onUpdate?: (id: string, data: TaskInput) => Promise<void>;
  onCancel?: () => void;
}

const emptyForm: TaskInput = {
  title: '',
  category: 'household',
  owner: 'amanda',
  recurrence_type: 'none',
  recurrence_interval: null,
  recurrence_day: null,
  custody_week: null,
  notes: '',
};

function validateTask(data: TaskInput): string | null {
  if (!data.title.trim()) return 'Title is required.';
  if (!data.category) return 'Category is required.';

  if (data.recurrence_type === 'interval' && (!data.recurrence_interval || data.recurrence_interval <= 0)) {
    return 'Enter how many days between occurrences.';
  }
  if (data.recurrence_type === 'weekday' && !data.recurrence_day) {
    return 'Select a day of the week.';
  }
  if (data.recurrence_type === 'monthly') {
    const day = parseInt(data.recurrence_day || '', 10);
    if (Number.isNaN(day) || day < 1 || day > 31) {
      return 'Enter a valid day of the month (1-31).';
    }
  }
  if (data.recurrence_type === 'custody_week' && !data.custody_week) {
    return 'Select which custody week this task falls on.';
  }

  return null;
}

export default function TaskForm({ onSubmit, editTask, onUpdate, onCancel }: TaskFormProps) {
  const [formData, setFormData] = useState<TaskInput>(
    editTask ? taskToInput(editTask) : emptyForm
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editTask) {
      setFormData(taskToInput(editTask));
    }
  }, [editTask]);

  const handleSubmit = async () => {
    const validationError = validateTask(formData);
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setLoading(true);
    try {
      if (editTask && onUpdate) {
        await onUpdate(editTask.id, formData);
        Alert.alert('Success', 'Task updated!');
        onCancel?.();
      } else {
        await onSubmit(formData);
        setFormData(emptyForm);
        Alert.alert('Success', 'Task added!');
      }
    } catch (error) {
      Alert.alert('Error', getReadableError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>{editTask ? 'Edit Task' : 'Add Task'}</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={formData.title}
        onChangeText={(text) => setFormData({ ...formData, title: text })}
        placeholder="e.g., Worm the goats"
      />

      <Dropdown
        label="Category"
        value={TASK_CATEGORY_LABELS[formData.category]}
        options={TASK_CATEGORIES.map(c => c.label)}
        onSelect={(label) => {
          const key = findKeyByLabel(TASK_CATEGORIES, label);
          if (key) setFormData({ ...formData, category: key as TaskCategory });
        }}
        placeholder="Select a category"
      />

      <Text style={styles.label}>Owner</Text>
      <View style={styles.ownerButtons}>
        {TASK_OWNERS.map(owner => (
          <TouchableOpacity
            key={owner.key}
            style={[styles.ownerButton, formData.owner === owner.key && styles.activeOwner]}
            onPress={() => setFormData({ ...formData, owner: owner.key as TaskOwner })}
          >
            <Text style={[styles.ownerButtonText, formData.owner === owner.key && styles.activeOwnerText]}>
              {owner.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Dropdown
        label="Repeats"
        value={findLabelByKey(RECURRENCE_TYPES, formData.recurrence_type)}
        options={RECURRENCE_TYPES.map(r => r.label)}
        onSelect={(label) => {
          const key = findKeyByLabel(RECURRENCE_TYPES, label);
          if (key) {
            setFormData({
              ...formData,
              recurrence_type: key,
              recurrence_interval: null,
              recurrence_day: null,
              custody_week: null,
            });
          }
        }}
      />

      {formData.recurrence_type === 'interval' && (
        <>
          <Text style={styles.label}>Every how many days?</Text>
          <TextInput
            style={styles.input}
            value={formData.recurrence_interval?.toString() ?? ''}
            onChangeText={(text) => setFormData({ ...formData, recurrence_interval: parseInt(text, 10) || null })}
            placeholder="30"
            keyboardType="numeric"
          />
        </>
      )}

      {formData.recurrence_type === 'weekday' && (
        <Dropdown
          label="Day of the week"
          value={formData.recurrence_day ? capitalize(formData.recurrence_day) : ''}
          options={WEEKDAY_LABELS}
          onSelect={(label) => setFormData({ ...formData, recurrence_day: label.toLowerCase() })}
        />
      )}

      {formData.recurrence_type === 'monthly' && (
        <>
          <Text style={styles.label}>Day of the month</Text>
          <TextInput
            style={styles.input}
            value={formData.recurrence_day ?? ''}
            onChangeText={(text) => setFormData({ ...formData, recurrence_day: text.replace(/\D/g, '') })}
            placeholder="1-31"
            keyboardType="numeric"
          />
        </>
      )}

      {formData.recurrence_type === 'custody_week' && (
        <Dropdown
          label="Custody week"
          value={findLabelByKey(CUSTODY_WEEK_OPTIONS, formData.custody_week ?? undefined)}
          options={CUSTODY_WEEK_OPTIONS.map(o => o.label)}
          onSelect={(label) => {
            const key = findKeyByLabel(CUSTODY_WEEK_OPTIONS, label);
            if (key) setFormData({ ...formData, custody_week: key });
          }}
        />
      )}

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={styles.input}
        value={formData.notes ?? ''}
        onChangeText={(text) => setFormData({ ...formData, notes: text })}
        placeholder="Optional"
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.addButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>
            {loading ? (editTask ? 'Updating...' : 'Adding...') : (editTask ? 'Update Task' : 'Add Task')}
          </Text>
        </TouchableOpacity>
        {editTask && (
          <TouchableOpacity style={styles.cancelButton} onPress={() => onCancel?.()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function taskToInput(task: Task): TaskInput {
  return {
    title: task.title,
    category: task.category,
    owner: task.owner,
    recurrence_type: task.recurrence_type,
    recurrence_interval: task.recurrence_interval ?? null,
    recurrence_day: task.recurrence_day ?? null,
    custody_week: task.custody_week ?? null,
    notes: task.notes ?? '',
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
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
  },
  ownerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ownerButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  activeOwner: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  ownerButtonText: {
    fontSize: 14,
  },
  activeOwnerText: {
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
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
