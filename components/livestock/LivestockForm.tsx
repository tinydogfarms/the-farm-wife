import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import type { LivestockInput, Livestock, LivestockTrackingType } from '../../lib/types';
import { LIVESTOCK_SPECIES } from '../../lib/constants';
import { getReadableError } from '../../lib/utils/errorHandler';
import Dropdown from '../Dropdown';
import PhotoCapture from '../PhotoCapture';

interface LivestockFormProps {
  onSubmit: (data: LivestockInput) => Promise<void>;
  editLivestock?: Livestock;
  onUpdate?: (id: string, data: LivestockInput) => Promise<void>;
  onCancel?: () => void;
}

const TRACKING_OPTIONS: { value: LivestockTrackingType; label: string }[] = [
  { value: 'group', label: 'Group / Herd' },
  { value: 'individual', label: 'Individual Animal' },
];

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const EMPTY_FORM: LivestockInput = {
  tracking_type: 'group',
  name: '',
  species: '',
  breed: '',
  count: 1,
  tag_number: '',
  birthdate: null,
  photo_url: null,
  notes: '',
};

export default function LivestockForm({ onSubmit, editLivestock, onUpdate, onCancel }: LivestockFormProps) {
  const [formData, setFormData] = useState<LivestockInput>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editLivestock) {
      setFormData({
        tracking_type: editLivestock.tracking_type,
        name: editLivestock.name,
        species: editLivestock.species,
        breed: editLivestock.breed || '',
        count: editLivestock.count,
        tag_number: editLivestock.tag_number || '',
        birthdate: editLivestock.birthdate || null,
        photo_url: editLivestock.photo_url || null,
        notes: editLivestock.notes || '',
      });
    }
  }, [editLivestock]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Name is required.');
      return;
    }
    if (!formData.species.trim()) {
      Alert.alert('Validation Error', 'Species is required.');
      return;
    }
    if (formData.tracking_type === 'group' && (!formData.count || formData.count < 1)) {
      Alert.alert('Validation Error', 'Enter a headcount of at least 1.');
      return;
    }
    if (formData.tracking_type === 'individual' && formData.birthdate && !DATE_REGEX.test(formData.birthdate)) {
      Alert.alert('Validation Error', 'Please enter a valid birthdate in YYYY-MM-DD format.');
      return;
    }

    const submission: LivestockInput = {
      ...formData,
      count: formData.tracking_type === 'individual' ? 1 : formData.count,
    };

    setLoading(true);
    try {
      if (editLivestock && onUpdate) {
        await onUpdate(editLivestock.id, submission);
        Alert.alert('Success', 'Livestock updated!');
        onCancel?.();
      } else {
        await onSubmit(submission);
        setFormData(EMPTY_FORM);
        Alert.alert('Success', 'Livestock added!');
      }
    } catch (error) {
      Alert.alert('Error', getReadableError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>{editLivestock ? 'Edit Livestock' : 'Add Livestock'}</Text>

      <Text style={styles.label}>Tracking</Text>
      <View style={styles.trackingButtons}>
        {TRACKING_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[styles.trackingButton, formData.tracking_type === option.value && styles.activeTracking]}
            onPress={() => setFormData({ ...formData, tracking_type: option.value })}
          >
            <Text style={[styles.trackingButtonText, formData.tracking_type === option.value && styles.activeTrackingText]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        placeholder={formData.tracking_type === 'group' ? 'e.g., South Pasture Cattle' : 'e.g., Bessie'}
        placeholderTextColor="#9ca3af"
        autoCapitalize="words"
      />

      <Dropdown
        label="Species"
        value={formData.species}
        options={LIVESTOCK_SPECIES}
        onSelect={(species) => setFormData({ ...formData, species })}
        placeholder="Select a species"
      />

      <Text style={styles.label}>Breed</Text>
      <TextInput
        style={styles.input}
        value={formData.breed}
        onChangeText={(text) => setFormData({ ...formData, breed: text })}
        placeholder="Optional"
        placeholderTextColor="#9ca3af"
        autoCapitalize="words"
      />

      {formData.tracking_type === 'group' ? (
        <>
          <Text style={styles.label}>Count</Text>
          <TextInput
            style={styles.input}
            value={formData.count ? String(formData.count) : ''}
            onChangeText={(text) => {
              const digits = text.replace(/[^0-9]/g, '');
              setFormData({ ...formData, count: digits ? parseInt(digits, 10) : 0 });
            }}
            placeholder="e.g., 40"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>Tag Number</Text>
          <TextInput
            style={styles.input}
            value={formData.tag_number}
            onChangeText={(text) => setFormData({ ...formData, tag_number: text })}
            placeholder="e.g., 4471"
            placeholderTextColor="#9ca3af"
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Birthdate</Text>
          <TextInput
            style={styles.input}
            value={formData.birthdate || ''}
            onChangeText={(text) => setFormData({ ...formData, birthdate: text || null })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9ca3af"
          />
        </>
      )}

      <Text style={styles.label}>Photo</Text>
      {formData.photo_url ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: formData.photo_url }} style={styles.photo} />
          <TouchableOpacity
            style={styles.removePhotoButton}
            onPress={() => setFormData({ ...formData, photo_url: null })}
          >
            <Text style={styles.removePhotoText}>Remove Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <PhotoCapture
          onCaptured={(uri) => setFormData({ ...formData, photo_url: uri })}
          modalTitle="Add Livestock Photo"
          guideText="Center the animal or group in the frame"
        />
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
            {loading ? (editLivestock ? 'Updating...' : 'Adding...') : (editLivestock ? 'Update Livestock' : 'Add Livestock')}
          </Text>
        </TouchableOpacity>
        {editLivestock && (
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
  trackingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  trackingButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTracking: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  trackingButtonText: {
    fontSize: 13,
  },
  activeTrackingText: {
    color: 'white',
  },
  imageContainer: {
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
    backgroundColor: '#f3f4f6',
  },
  removePhotoButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  removePhotoText: {
    fontSize: 14,
    color: '#6b7280',
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
