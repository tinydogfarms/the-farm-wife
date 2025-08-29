export interface Transaction {
  id: string;
  created_at: string;
  user_id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  method: 'cash' | 'accrual';
  receipt_image?: string;
}

export interface TransactionInput {
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  method: 'cash' | 'accrual';
  receipt_image?: string;
}

export interface TransactionTotals {
  income: number;
  expenses: number;
  profit: number;
}

export type CategoryTotals = Record<string, number>;