import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { Transaction } from '../types';

export interface CSVExportOptions {
  includeHeaders?: boolean;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  transactionType?: 'income' | 'expense' | 'all';
  categories?: string[];
}

// Escapes a CSV field: doubles embedded quotes per CSV spec, and prefixes
// values starting with =, +, -, or @ with a tab so spreadsheet apps don't
// interpret them as formulas (CSV/formula injection).
function escapeCSVField(value: string): string {
  let escaped = value.replace(/"/g, '""');
  if (/^[=+\-@]/.test(escaped)) {
    escaped = `\t${escaped}`;
  }
  return `"${escaped}"`;
}

export function generateCSVContent(transactions: Transaction[], options: CSVExportOptions = {}): string {
  const {
    includeHeaders = true,
    dateRange,
    transactionType = 'all',
    categories
  } = options;

  // Filter transactions based on options
  let filteredTransactions = [...transactions];

  // Filter by date range
  if (dateRange?.startDate || dateRange?.endDate) {
    filteredTransactions = filteredTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      if (dateRange.startDate && transactionDate < new Date(dateRange.startDate)) return false;
      if (dateRange.endDate && transactionDate > new Date(dateRange.endDate)) return false;
      return true;
    });
  }

  // Filter by transaction type
  if (transactionType !== 'all') {
    filteredTransactions = filteredTransactions.filter(t => t.type === transactionType);
  }

  // Filter by categories
  if (categories && categories.length > 0) {
    filteredTransactions = filteredTransactions.filter(t => categories.includes(t.category));
  }

  // Sort by date (most recent first)
  filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Generate CSV content
  let csvContent = '';

  // Add headers
  if (includeHeaders) {
    csvContent += 'Date,Type,Category,Description,Amount,Method,Receipt\n';
  }

  // Add transaction rows
  filteredTransactions.forEach(transaction => {
    const row = [
      transaction.date,
      transaction.type,
      escapeCSVField(transaction.category),
      escapeCSVField(transaction.description),
      transaction.amount.toString(),
      transaction.method,
      transaction.receipt_image ? 'Yes' : 'No'
    ].join(',');
    
    csvContent += row + '\n';
  });

  return csvContent;
}

// Web-specific download function
function downloadCSVWeb(csvContent: string, filename: string) {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Fallback: copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(csvContent);
      throw new Error('CSV copied to clipboard (download not available)');
    } else {
      throw new Error('Download not available on this platform');
    }
  }
}

export async function exportTransactionsToCSV(
  transactions: Transaction[], 
  options: CSVExportOptions = {},
  filename?: string
): Promise<{ success: boolean; error?: string; filePath?: string }> {
  try {
    // Generate CSV content
    const csvContent = generateCSVContent(transactions, options);
    
    if (csvContent.trim() === '' || (options.includeHeaders !== false && csvContent.trim() === 'Date,Type,Category,Description,Amount,Method,Receipt')) {
      return { success: false, error: 'No transactions to export' };
    }

    // Generate filename if not provided
    const defaultFilename = filename || `farm_transactions_${new Date().toISOString().split('T')[0]}.csv`;

    if (Platform.OS === 'web') {
      // Web platform: Use browser download
      try {
        downloadCSVWeb(csvContent, defaultFilename);
        return { success: true };
      } catch (webError) {
        // Fallback for web: try to use data URL
        const dataUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = defaultFilename;
        link.click();
        return { success: true };
      }
    } else {
      // Mobile platforms: Use Expo file system and sharing
      const filePath = `${FileSystem.documentDirectory}${defaultFilename}`;

      // Write file
      await FileSystem.writeAsStringAsync(filePath, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Farm Transactions',
        });
      }

      return { success: true, filePath };
    }

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to export transactions' 
    };
  }
}

export function getExportSummary(transactions: Transaction[], options: CSVExportOptions = {}): {
  totalCount: number;
  incomeCount: number;
  expenseCount: number;
  totalIncome: number;
  totalExpenses: number;
  dateRange: { start?: string; end?: string };
} {
  // Apply same filtering logic as CSV generation
  let filteredTransactions = [...transactions];

  if (options.dateRange?.startDate || options.dateRange?.endDate) {
    filteredTransactions = filteredTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      if (options.dateRange!.startDate && transactionDate < new Date(options.dateRange!.startDate)) return false;
      if (options.dateRange!.endDate && transactionDate > new Date(options.dateRange!.endDate)) return false;
      return true;
    });
  }

  if (options.transactionType && options.transactionType !== 'all') {
    filteredTransactions = filteredTransactions.filter(t => t.type === options.transactionType);
  }

  if (options.categories && options.categories.length > 0) {
    filteredTransactions = filteredTransactions.filter(t => options.categories!.includes(t.category));
  }

  const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');
  const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  // Get date range from filtered transactions
  const dates = filteredTransactions.map(t => t.date).sort();
  const dateRange = {
    start: dates.length > 0 ? dates[0] : undefined,
    end: dates.length > 0 ? dates[dates.length - 1] : undefined
  };

  return {
    totalCount: filteredTransactions.length,
    incomeCount: incomeTransactions.length,
    expenseCount: expenseTransactions.length,
    totalIncome,
    totalExpenses,
    dateRange
  };
}