import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { TransactionInput } from '../lib/types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/constants';
import { validateTransaction, getReadableError } from '../lib/utils/errorHandler';
import Dropdown from './Dropdown';
import ReceiptCapture from './ReceiptCapture';

interface TransactionFormProps {
  onSubmit: (data: TransactionInput) => Promise<void>;
  initialData?: Partial<TransactionInput>;
}


export default function TransactionForm({ onSubmit, initialData }: TransactionFormProps) {
  const [formData, setFormData] = useState<TransactionInput>({
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    category: '',
    description: '',
    amount: 0,
    method: 'cash',
    receipt_image: '',
    ...initialData
  });

  const [loading, setLoading] = useState(false);

  // Update form when initialData changes (from natural language parsing)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = async () => {
    // First, validate the transaction data
    const validationError = validateTransaction(formData);
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        category: '',
        description: '',
        amount: 0,
        method: 'cash',
        receipt_image: ''
      });
      Alert.alert('Success', 'Transaction added!');
    } catch (error) {
      const readableError = getReadableError(error);
      Alert.alert('Error', readableError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Add Transaction</Text>
      
      <Text style={styles.label}>Date</Text>
      <TextInput
        style={styles.input}
        value={formData.date}
        onChangeText={(text) => setFormData({...formData, date: text})}
        placeholder="YYYY-MM-DD"
      />

      <Text style={styles.label}>Type</Text>
      <View style={styles.typeButtons}>
        <TouchableOpacity
          style={[styles.typeButton, formData.type === 'expense' && styles.activeType]}
          onPress={() => setFormData({...formData, type: 'expense', category: ''})}
        >
          <Text style={[styles.typeButtonText, formData.type === 'expense' && styles.activeTypeText]}>
            Expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, formData.type === 'income' && styles.activeType]}
          onPress={() => setFormData({...formData, type: 'income', category: ''})}
        >
          <Text style={[styles.typeButtonText, formData.type === 'income' && styles.activeTypeText]}>
            Income
          </Text>
        </TouchableOpacity>
      </View>

      <Dropdown
        label="Category"
        value={formData.category}
        options={categories}
        onSelect={(category) => setFormData({...formData, category})}
        placeholder="Select a category"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        value={formData.description}
        onChangeText={(text) => setFormData({...formData, description: text})}
        placeholder="e.g., Purchased feed for cattle"
      />

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        value={formData.amount.toString()}
        onChangeText={(text) => setFormData({...formData, amount: parseFloat(text) || 0})}
        placeholder="0.00"
        keyboardType="numeric"
      />

      <ReceiptCapture
        onImageCaptured={(imageUri) => setFormData({...formData, receipt_image: imageUri})}
        capturedImage={formData.receipt_image}
      />

      <TouchableOpacity 
        style={[styles.addButton, loading && styles.disabledButton]} 
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.addButtonText}>
          {loading ? 'Adding...' : 'Add Transaction'}
        </Text>
      </TouchableOpacity>
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
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  activeType: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  typeButtonText: {
    fontSize: 16,
  },
  activeTypeText: {
    color: 'white',
  },
  addButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});