import { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTransactions } from '../lib/hooks/transactions';
import { useAuth } from '../lib/hooks/auth';
import type { TransactionInput, Transaction, CategoryTotals } from '../lib/types';

import AppHeader from './AppHeader';
import SummaryCards from './SummaryCards';
import CategorySummary from './CategorySummary';
import NaturalLanguageInput from './NaturalLanguageInput';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';

function getYtdCategoryTotals(transactions: Transaction[], type: 'income' | 'expense'): CategoryTotals {
  const currentYear = String(new Date().getFullYear());
  const categoryTotals: CategoryTotals = {};

  transactions
    .filter(t => t.type === type && t.date.startsWith(currentYear))
    .forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount.toString());
    });

  return categoryTotals;
}

export default function FarmAccountingApp() {
  const { user, signOut } = useAuth();
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction, getTotals } = useTransactions();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [formData, setFormData] = useState<Partial<TransactionInput>>({});
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showIncomeCategories, setShowIncomeCategories] = useState(false);
  const [showExpenseCategories, setShowExpenseCategories] = useState(false);


  const handleAddTransaction = async (transactionData: TransactionInput) => {
    const { error } = await addTransaction(transactionData);
    
    if (error) {
      // Error is already processed by getReadableError in the hook
      throw new Error(error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleNaturalLanguageParsed = (parsed: Partial<TransactionInput>) => {
    if (!editingTransaction) {
      setFormData(parsed);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({});
    
    // Scroll to form with a small delay to ensure state update
    setTimeout(() => {
      // Scroll to top of the form, skipping the natural language input
      // Header (~80px) + Summary cards (~120px) + Natural language input (~140px) = ~340px
      scrollViewRef.current?.scrollTo({ x: 0, y: 340, animated: true });
    }, 100);
  };

  const handleUpdateTransaction = async (id: string, transactionData: TransactionInput) => {
    const { error } = await updateTransaction(id, transactionData);
    
    if (error) {
      throw new Error(error);
    }
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
  };


  const totals = getTotals();
  const incomeByCategory = getYtdCategoryTotals(transactions, 'income');
  const expensesByCategory = getYtdCategoryTotals(transactions, 'expense');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
    >
      <AppHeader user={user} onSignOut={handleSignOut} transactions={transactions} />
      <SummaryCards
        totals={totals}
        onIncomePress={() => setShowIncomeCategories(prev => !prev)}
        onExpensePress={() => setShowExpenseCategories(prev => !prev)}
      />
      <CategorySummary
        incomeByCategory={incomeByCategory}
        expensesByCategory={expensesByCategory}
        showIncome={showIncomeCategories}
        showExpenses={showExpenseCategories}
      />

      <NaturalLanguageInput onParsed={handleNaturalLanguageParsed} />

      <TransactionForm
        onSubmit={handleAddTransaction}
        initialData={formData}
        editTransaction={editingTransaction || undefined}
        onUpdate={handleUpdateTransaction}
        onCancel={handleCancelEdit}
      />

      <TransactionList 
        transactions={transactions}
        onDelete={deleteTransaction}
        onEdit={handleEditTransaction}
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