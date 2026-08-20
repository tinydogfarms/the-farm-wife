import { View, Text, StyleSheet } from 'react-native';
import type { CategoryTotals } from '../lib/types';

interface CategorySummaryProps {
  incomeByCategory: CategoryTotals;
  expensesByCategory: CategoryTotals;
  showIncome: boolean;
  showExpenses: boolean;
}

function sortedEntries(categoryTotals: CategoryTotals): [string, number][] {
  return Object.entries(categoryTotals).sort(([, a], [, b]) => b - a);
}

export default function CategorySummary({ incomeByCategory, expensesByCategory, showIncome, showExpenses }: CategorySummaryProps) {
  const incomeEntries = showIncome ? sortedEntries(incomeByCategory) : [];
  const expenseEntries = showExpenses ? sortedEntries(expensesByCategory) : [];

  if (incomeEntries.length === 0 && expenseEntries.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {incomeEntries.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>YTD Income by Category</Text>
          {incomeEntries.map(([category, amount]) => (
            <View key={category} style={styles.row}>
              <Text style={styles.categoryLabel} numberOfLines={1} ellipsizeMode="tail">{category}</Text>
              <Text style={[styles.categoryAmount, styles.incomeAmount]}>
                ${amount.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {expenseEntries.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>YTD Expenses by Category</Text>
          {expenseEntries.map(([category, amount]) => (
            <View key={category} style={styles.row}>
              <Text style={styles.categoryLabel} numberOfLines={1} ellipsizeMode="tail">{category}</Text>
              <Text style={[styles.categoryAmount, styles.expenseAmount]}>
                ${amount.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  incomeAmount: {
    color: '#10b981',
  },
  expenseAmount: {
    color: '#ef4444',
  },
});
