import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { User } from '@supabase/supabase-js';
import type { Transaction } from '../lib/types';
import { exportTransactionsToCSV, getExportSummary } from '../lib/utils/csvExport';
import DateRangePicker, { DateRange } from './DateRangePicker';

interface AppHeaderProps {
  user: User | null;
  onSignOut: () => void;
  transactions: Transaction[];
}

export default function AppHeader({ user, onSignOut, transactions }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      Alert.alert('No Data', 'No transactions available to export.');
      return;
    }
    setShowDatePicker(true);
  };

  const handleDateRangeSelected = async (selectedDateRange: DateRange | null) => {
    setShowDatePicker(false);
    
    // Create export options with date range
    const exportOptions = selectedDateRange?.startDate || selectedDateRange?.endDate ? {
      dateRange: {
        startDate: selectedDateRange.startDate,
        endDate: selectedDateRange.endDate
      }
    } : {};

    const summary = getExportSummary(transactions, exportOptions);
    
    // Check if any transactions match the filter
    if (summary.totalCount === 0) {
      const rangeName = selectedDateRange?.label || 'selected date range';
      Alert.alert('No Data', `No transactions found for ${rangeName}.`);
      return;
    }
    
    // For web, export directly (Alert dialogs don't work well in React Native Web)
    if (typeof window !== 'undefined') {
      const result = await exportTransactionsToCSV(transactions, exportOptions);
      if (result.success) {
        const rangeName = selectedDateRange?.label || 'all time';
        Alert.alert('Success', `Transactions exported successfully for ${rangeName}!`);
      } else {
        Alert.alert('Export Failed', result.error || 'Unknown error occurred');
      }
      return;
    }
    
    // For mobile, show confirmation dialog with summary
    const rangeName = selectedDateRange?.label || 'all time';
    const dateRangeText = summary.dateRange.start && summary.dateRange.end 
      ? `\nDate Range: ${summary.dateRange.start} to ${summary.dateRange.end}`
      : '';
    
    Alert.alert(
      'Export Transactions',
      `Export ${summary.totalCount} transactions for ${rangeName}?${dateRangeText}\n\nIncome: ${summary.incomeCount} transactions ($${summary.totalIncome.toLocaleString()})\nExpenses: ${summary.expenseCount} transactions ($${summary.totalExpenses.toLocaleString()})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            const result = await exportTransactionsToCSV(transactions, exportOptions);
            if (result.success) {
              Alert.alert('Success', `Transactions exported successfully for ${rangeName}!`);
            } else {
              Alert.alert('Export Failed', result.error || 'Unknown error occurred');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.title}>The Farm Wife</Text>
      <View style={styles.headerRight}>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={handleExportCSV} style={styles.exportButton}>
            <Text style={styles.exportText}>Export CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSignOut} style={styles.signOutButton}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Export Date Range</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <DateRangePicker 
              onDateRangeSelect={handleDateRangeSelected}
              transactions={transactions}
              inline={true}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  signOutButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  signOutText: {
    color: '#2563eb',
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  exportButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  exportText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    color: '#6b7280',
  },
});