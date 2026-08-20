import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { TransactionTotals } from '../lib/types';

interface SummaryCardsProps {
  totals: TransactionTotals;
  onIncomePress?: () => void;
  onExpensePress?: () => void;
}

export default function SummaryCards({ totals, onIncomePress, onExpensePress }: SummaryCardsProps) {
  return (
    <View style={styles.summaryRow}>
      <TouchableOpacity
        style={[styles.summaryCard, styles.incomeCard]}
        onPress={onIncomePress}
        disabled={!onIncomePress}
        activeOpacity={0.7}
      >
        <Text style={styles.summaryLabel}>Income</Text>
        <Text style={styles.summaryAmount}>${totals.income.toLocaleString()}</Text>
        {onIncomePress && <Text style={styles.tapHint}>Tap for details</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.summaryCard, styles.expenseCard]}
        onPress={onExpensePress}
        disabled={!onExpensePress}
        activeOpacity={0.7}
      >
        <Text style={styles.summaryLabel}>Expenses</Text>
        <Text style={styles.summaryAmount}>${totals.expenses.toLocaleString()}</Text>
        {onExpensePress && <Text style={styles.tapHint}>Tap for details</Text>}
      </TouchableOpacity>

      <View style={[styles.summaryCard, totals.profit >= 0 ? styles.profitCard : styles.lossCard]}>
        <Text style={styles.summaryLabel}>{totals.profit >= 0 ? 'Profit' : 'Loss'}</Text>
        <Text style={styles.summaryAmount}>${Math.abs(totals.profit).toLocaleString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  profitCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  lossCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tapHint: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
});