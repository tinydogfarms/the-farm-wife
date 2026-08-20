import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { ServiceRecord, Equipment } from '../../lib/types';

interface ServiceRecordListProps {
  records: ServiceRecord[];
  equipmentById: Record<string, Equipment>;
  onEdit: (record: ServiceRecord) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string, equipmentName: string) => void;
}

function formatDue(nextDue: string): { label: string; overdue: boolean } {
  const dueDate = new Date(nextDue);
  const overdue = dueDate.getTime() < Date.now();
  return { label: dueDate.toISOString().split('T')[0], overdue };
}

export default function ServiceRecordList({ records, equipmentById, onEdit, onDelete, onComplete }: ServiceRecordListProps) {
  const pending = records.filter(r => r.status === 'pending');

  const confirmDelete = (id: string) => {
    Alert.alert(
      'Delete Service Record',
      'Are you sure you want to delete this service record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(id) },
      ]
    );
  };

  const confirmComplete = (record: ServiceRecord, equipmentName: string) => {
    Alert.alert(
      'Log Service',
      `Mark ${record.service_type} for ${equipmentName} as done today?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Service', onPress: () => onComplete(record.id, equipmentName) },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.formTitle}>Service Schedule ({pending.length})</Text>
      {pending.map((record) => {
        const equipmentName = equipmentById[record.equipment_id]?.name || 'Unknown equipment';
        const due = formatDue(record.next_due);
        return (
          <TouchableOpacity
            key={record.id}
            style={styles.item}
            onPress={() => onEdit(record)}
            activeOpacity={0.7}
          >
            <View style={styles.itemInfo}>
              <Text style={styles.itemEquipment}>{equipmentName}</Text>
              <Text style={styles.itemService}>{record.service_type}</Text>
              <Text style={[styles.itemDue, due.overdue && styles.overdueDue]}>
                {due.overdue ? 'Overdue: ' : 'Due: '}{due.label}
              </Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  confirmComplete(record, equipmentName);
                }}
                style={styles.completeButton}
              >
                <Text style={styles.completeText}>Log Service</Text>
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
          <Text style={styles.emptyText}>No service records yet</Text>
          <Text style={styles.emptySubtext}>Add a service schedule above</Text>
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
  itemEquipment: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  itemService: {
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
