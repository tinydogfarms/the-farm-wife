import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { LivestockCareRecord, Livestock } from '../../lib/types';

interface CareRecordListProps {
  records: LivestockCareRecord[];
  livestockById: Record<string, Livestock>;
  onEdit: (record: LivestockCareRecord) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string, livestockName: string) => void;
}

function formatDue(nextDue: string): { label: string; overdue: boolean } {
  const dueDate = new Date(nextDue);
  const overdue = dueDate.getTime() < Date.now();
  return { label: dueDate.toISOString().split('T')[0], overdue };
}

export default function CareRecordList({ records, livestockById, onEdit, onDelete, onComplete }: CareRecordListProps) {
  const pending = records.filter(r => r.status === 'pending');

  const confirmDelete = (id: string) => {
    Alert.alert(
      'Delete Care Record',
      'Are you sure you want to delete this care record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(id) },
      ]
    );
  };

  const confirmComplete = (record: LivestockCareRecord, livestockName: string) => {
    Alert.alert(
      'Log Care',
      `Mark ${record.care_type} for ${livestockName} as done today?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Care', onPress: () => onComplete(record.id, livestockName) },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.formTitle}>Care Schedule ({pending.length})</Text>
      {pending.map((record) => {
        const livestockName = livestockById[record.livestock_id]?.name || 'Unknown livestock';
        const due = formatDue(record.next_due);
        return (
          <TouchableOpacity
            key={record.id}
            style={styles.item}
            onPress={() => onEdit(record)}
            activeOpacity={0.7}
          >
            <View style={styles.itemInfo}>
              <Text style={styles.itemLivestock}>{livestockName}</Text>
              <Text style={styles.itemCare}>{record.care_type}</Text>
              <Text style={[styles.itemDue, due.overdue && styles.overdueDue]}>
                {due.overdue ? 'Overdue: ' : 'Due: '}{due.label}
              </Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  confirmComplete(record, livestockName);
                }}
                style={styles.completeButton}
              >
                <Text style={styles.completeText}>Log Care</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  confirmDelete(record.id);
                }}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      })}
      {pending.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No care records yet</Text>
          <Text style={styles.emptySubtext}>Add a care schedule above</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemInfo: {
    flex: 1,
  },
  itemLivestock: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  itemCare: {
    fontSize: 13,
    color: '#374151',
    marginTop: 2,
  },
  itemDue: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  overdueDue: {
    color: '#ef4444',
    fontWeight: '600',
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: 4,
  },
  completeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  completeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
