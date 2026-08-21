import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

interface LocationSetupFormProps {
  initialZip?: string;
  onSave: (zip: string) => Promise<{ error: string | null }>;
  onSaved?: () => void;
  onCancel?: () => void;
}

export default function LocationSetupForm({ initialZip, onSave, onSaved, onCancel }: LocationSetupFormProps) {
  const [zip, setZip] = useState(initialZip || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!/^\d{5}$/.test(zip.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid 5-digit ZIP code.');
      return;
    }

    setLoading(true);
    const { error } = await onSave(zip.trim());
    setLoading(false);

    if (error) {
      Alert.alert('Error', error);
      return;
    }

    onSaved?.();
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Set Your Farm's Location</Text>
      <Text style={styles.subtitle}>Used to show today's weather.</Text>

      <TextInput
        style={styles.input}
        value={zip}
        onChangeText={setZip}
        placeholder="e.g., 65801"
        placeholderTextColor="#9ca3af"
        keyboardType="number-pad"
        maxLength={5}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Location'}</Text>
        </TouchableOpacity>
        {onCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#111827',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
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
