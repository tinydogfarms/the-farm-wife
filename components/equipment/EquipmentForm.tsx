import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { EquipmentInput, Equipment } from '../../lib/types';
import { EQUIPMENT_CATEGORIES } from '../../lib/constants';
import { getReadableError } from '../../lib/utils/errorHandler';
import Dropdown from '../Dropdown';

interface EquipmentFormProps {
  onSubmit: (data: EquipmentInput) => Promise<void>;
  editEquipment?: Equipment;
  onUpdate?: (id: string, data: EquipmentInput) => Promise<void>;
  onCancel?: () => void;
}

const EMPTY_FORM: EquipmentInput = { name: '', category: '', notes: '' };

export default function EquipmentForm({ onSubmit, editEquipment, onUpdate, onCancel }: EquipmentFormProps) {
  const [formData, setFormData] = useState<EquipmentInput>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editEquipment) {
      setFormData({
        name: editEquipment.name,
        category: editEquipment.category,
        notes: editEquipment.notes || '',
      });
    }
  }, [editEquipment]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Name is required.');
      return;
    }
    if (!formData.category.trim()) {
      Alert.alert('Validation Error', 'Category is required.');
      return;
    }

    setLoading(true);
    try {
      if (editEquipment && onUpdate) {
        await onUpdate(editEquipment.id, formData);
        Alert.alert('Success', 'Equipment updated!');
        onCancel?.();
      } else {
        await onSubmit(formData);
        setFormData(EMPTY_FORM);
        Alert.alert('Success', 'Equipment added!');
      }
    } catch (error) {
      Alert.alert('Error', getReadableError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>{editEquipment ? 'Edit Equipment' : 'Add Equipment'}</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        placeholder="e.g., John Deere 5075E"
        placeholderTextColor="#9ca3af"
      />

      <Dropdown
        label="Category"
        value={formData.category}
        options={EQUIPMENT_CATEGORIES}
        onSelect={(category) => setFormData({ ...formData, category })}
        placeholder="Select a category"
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
            {loading ? (editEquipment ? 'Updating...' : 'Adding...') : (editEquipment ? 'Update Equipment' : 'Add Equipment')}
          </Text>
        </TouchableOpacity>
        {editEquipment && (
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
