import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { EquipmentInput, Equipment } from '../../lib/types';
import { EQUIPMENT_CATEGORIES } from '../../lib/constants';
import { getReadableError } from '../../lib/utils/errorHandler';
import Dropdown from '../Dropdown';
import TagScanner from './TagScanner';

interface EquipmentFormProps {
  onSubmit: (data: EquipmentInput) => Promise<void>;
  editEquipment?: Equipment;
  onUpdate?: (id: string, data: EquipmentInput) => Promise<void>;
  onCancel?: () => void;
}

const EMPTY_FORM: EquipmentInput = { name: '', category: '', year: null, make: '', model: '', serial_number: '', notes: '' };

export default function EquipmentForm({ onSubmit, editEquipment, onUpdate, onCancel }: EquipmentFormProps) {
  const [formData, setFormData] = useState<EquipmentInput>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editEquipment) {
      setFormData({
        name: editEquipment.name,
        category: editEquipment.category,
        year: editEquipment.year ?? null,
        make: editEquipment.make || '',
        model: editEquipment.model || '',
        serial_number: editEquipment.serial_number || '',
        notes: editEquipment.notes || '',
      });
    }
  }, [editEquipment]);

  const handleTagScanned = (parsed: Partial<EquipmentInput>) => {
    setFormData(prev => ({
      ...prev,
      make: parsed.make || prev.make,
      model: parsed.model || prev.model,
      year: parsed.year ?? prev.year,
      serial_number: parsed.serial_number || prev.serial_number,
    }));
  };

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

      <TagScanner onScanned={handleTagScanned} />

      <Text style={styles.label}>Year</Text>
      <TextInput
        style={styles.input}
        value={formData.year ? String(formData.year) : ''}
        onChangeText={(text) => {
          const digits = text.replace(/[^0-9]/g, '');
          setFormData({ ...formData, year: digits ? parseInt(digits, 10) : null });
        }}
        placeholder="e.g., 2018"
        placeholderTextColor="#9ca3af"
        keyboardType="number-pad"
        maxLength={4}
      />

      <Text style={styles.label}>Make</Text>
      <TextInput
        style={styles.input}
        value={formData.make}
        onChangeText={(text) => setFormData({ ...formData, make: text })}
        placeholder="e.g., John Deere"
        placeholderTextColor="#9ca3af"
      />

      <Text style={styles.label}>Model</Text>
      <TextInput
        style={styles.input}
        value={formData.model}
        onChangeText={(text) => setFormData({ ...formData, model: text })}
        placeholder="e.g., 5075E"
        placeholderTextColor="#9ca3af"
      />

      <Text style={styles.label}>Serial Number</Text>
      <TextInput
        style={styles.input}
        value={formData.serial_number}
        onChangeText={(text) => setFormData({ ...formData, serial_number: text })}
        placeholder="e.g., 1L05075EASE123456"
        placeholderTextColor="#9ca3af"
        autoCapitalize="characters"
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
