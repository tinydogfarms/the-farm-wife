import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import type { Transaction } from '../lib/types';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

export default function TransactionList({ transactions, onDelete, onEdit }: TransactionListProps) {
  const confirmDelete = (id: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(id) },
      ]
    );
  };

  return (
    <View style={styles.transactionsCard}>
      <Text style={styles.formTitle}>Recent Transactions ({transactions.length})</Text>
      {transactions.slice(0, 10).map((transaction) => (
        <TouchableOpacity
          key={transaction.id}
          style={styles.transactionItem}
          onPress={() => onEdit(transaction)}
          activeOpacity={0.7}
        >
          <View style={styles.transactionMain}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionDate}>{transaction.date}</Text>
              <Text style={styles.transactionCategory}>{transaction.category}</Text>
              <Text style={styles.transactionDescription}>{transaction.description}</Text>
            </View>
            {transaction.receipt_image && (
              <Image source={{ uri: transaction.receipt_image }} style={styles.receiptThumbnail} />
            )}
          </View>
          <View style={styles.transactionRight}>
            <Text style={[
              styles.transactionAmount,
              transaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount
            ]}>
              {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount.toString()).toLocaleString()}
            </Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                confirmDelete(transaction.id);
              }}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
      {transactions.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptySubtext}>Add your first transaction above</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  transactionsCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  transactionMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  receiptThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 2,
    color: '#000',
  },
  transactionDescription: {
    fontSize: 12,
    color: '#666',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  incomeAmount: {
    color: '#10b981',
  },
  expenseAmount: {
    color: '#ef4444',
  },
  deleteButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 12,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});