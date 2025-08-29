import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { User } from '@supabase/supabase-js';
import type { Transaction } from '../lib/types';
import { exportTransactionsToCSV, getExportSummary } from '../lib/utils/csvExport';

interface AppHeaderProps {
  user: User | null;
  onSignOut: () => void;
  transactions: Transaction[];
}

export default function AppHeader({ user, onSignOut, transactions }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  
  const handleExportCSV = async () => {
    if (transactions.length === 0) {
      Alert.alert('No Data', 'No transactions available to export.');
      return;
    }

    const summary = getExportSummary(transactions);
    
    Alert.alert(
      'Export Transactions',
      `Export ${summary.totalCount} transactions?\n\nIncome: ${summary.incomeCount} transactions ($${summary.totalIncome.toLocaleString()})\nExpenses: ${summary.expenseCount} transactions ($${summary.totalExpenses.toLocaleString()})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            const result = await exportTransactionsToCSV(transactions);
            if (result.success) {
              Alert.alert('Success', 'Transactions exported successfully!');
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
});