import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTransactions } from '../lib/hooks/transactions';
import { useAuth } from '../lib/hooks/auth';
import type { TransactionInput } from '../lib/types';

import AppHeader from './AppHeader';
import SummaryCards from './SummaryCards';
import NaturalLanguageInput from './NaturalLanguageInput';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';

export default function FarmAccountingApp() {
  const { user, signOut } = useAuth();
  const { transactions, loading, addTransaction, deleteTransaction, getTotals } = useTransactions();
  const insets = useSafeAreaInsets();
  
  const [formData, setFormData] = useState<Partial<TransactionInput>>({});


  const handleAddTransaction = async (transactionData: TransactionInput) => {
    const { error } = await addTransaction(transactionData);
    
    if (error) {
      // Error is already processed by getReadableError in the hook\n      throw new Error(error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleNaturalLanguageParsed = (parsed: Partial<TransactionInput>) => {
    setFormData(parsed);
  };


  const totals = getTotals();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
      <AppHeader user={user} onSignOut={handleSignOut} />
      <SummaryCards totals={totals} />

      <NaturalLanguageInput onParsed={handleNaturalLanguageParsed} />

      <TransactionForm 
        onSubmit={handleAddTransaction} 
        initialData={formData}
      />

      <TransactionList 
        transactions={transactions}
        onDelete={deleteTransaction}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});