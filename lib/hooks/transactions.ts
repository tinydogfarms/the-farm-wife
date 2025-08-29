import { useState, useEffect } from 'react';
import { supabase } from '../services/client';
import { useAuth } from './auth';
import { getReadableError } from '../utils/errorHandler';
import { StorageService } from '../services/storage';
import type { Transaction, TransactionInput, TransactionTotals, CategoryTotals } from '../types';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load transactions
  const loadTransactions = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error loading transactions:', error);
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  };

  // Add transaction
  const addTransaction = async (transactionData: TransactionInput) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      let receiptImageUrl = null;
      
      // Upload receipt image if provided
      if (transactionData.receipt_image) {
        const { publicUrl, error: uploadError } = await StorageService.uploadReceiptImage(
          transactionData.receipt_image,
          user.id
        );
        
        if (uploadError) {
          return { data: null, error: getReadableError(uploadError) };
        }
        
        receiptImageUrl = publicUrl;
      }

      // Insert transaction with receipt URL
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          ...transactionData,
          user_id: user.id,
          amount: parseFloat(transactionData.amount.toString()),
          receipt_image: receiptImageUrl
        }])
        .select()
        .single();

      if (!error && data) {
        setTransactions(prev => [data, ...prev]);
      }

      return { data, error: error ? getReadableError(error) : null };
      
    } catch (error) {
      return { data: null, error: getReadableError(error) };
    }
  };

  // Delete transaction
  const deleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id);

    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }

    return { error: error ? getReadableError(error) : null };
  };

  // Get totals
  const getTotals = (): TransactionTotals => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    return { income, expenses, profit: income - expenses };
  };

  // Get category totals
  const getCategoryTotals = (type: 'income' | 'expense'): CategoryTotals => {
    const categoryTotals: CategoryTotals = {};
    transactions
      .filter(t => t.type === type)
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount.toString());
      });
    return categoryTotals;
  };

  useEffect(() => {
    loadTransactions();
  }, [user]);

  return {
    transactions,
    loading,
    addTransaction,
    deleteTransaction,
    getTotals,
    getCategoryTotals,
    refreshTransactions: loadTransactions,
  };
}