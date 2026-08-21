import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { ServiceRecord, Equipment } from '../../lib/types';

interface ServiceHistoryListProps {
  records: ServiceRecord[];
  equipmentById: Record<string, Equipment>;
  onDelete: (id: string) => void;
}

function formatCompleted(completedAt: string | null | undefined): string {
  if (!completedAt) return '';
  return new Date(completedAt).toISOString().split('T')[0];
}

export default function ServiceHistoryList({ records, equipmentById, onDelete }: ServiceHistoryListProps) {
  const completed = records.filter(r => r.status === 'complete');

  const groups = new Map<string, ServiceRecord[]>();
  completed.forEach(record => {
    const list = groups.get(record.equipment_id) || [];
    list.push(record);
    groups.set(record.equipment_id, list);
  });

  const groupEntries = Array.from(groups.entries())
    .map(([equipmentId, groupRecords]) => ({
      equipmentId,
      name: equipmentById[equipmentId]?.name || 'Unknown equipment',
      records: [...groupRecords].sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || '')),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const confirmDelete = (id: string) => {
    Alert.alert(
      'Delete History Entry',
      'Are you sure you want to delete this service history entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(id) },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.formTitle}>Service History ({completed.length})</Text>
      {groupEntries.map(group => (
        <View key={group.equipmentId} style={styles.group}>
          <Text style={styles.groupTitle}>{group.name}</Text>
          {group.records.map(record => (
            <View key={record.id} style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemService}>{record.service_type}</Text>
                <Text style={styles.itemCompleted}>Completed: {formatCompleted(record.completed_at)}</Text>
                {!!record.notes && <Text style={styles.itemNotes}>{record.notes}</Text>}
              </View>
              <TouchableOpacity onPress={() => confirmDelete(record.id)} style={styles.deleteButton}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ))}
      {completed.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No service history yet</Text>
          <Text style={styles.emptySubtext}>Logged services will show up here</Text>
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
  group: {
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemInfo: {
    flex: 1,
  },
  itemService: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  itemCompleted: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemNotes: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
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
