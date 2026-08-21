import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { Reminder } from '../../lib/types';
import { nextAnnualOccurrence } from '../../lib/utils/annualRecurrence';

interface ReminderListProps {
  reminders: Reminder[];
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
}

function formatOccurrence(reminder: Reminder): string {
  const occurrence = nextAnnualOccurrence({ month: reminder.event_month, day: reminder.event_day }, new Date());
  const today = new Date();
  const daysUntil = Math.round((occurrence.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / (24 * 60 * 60 * 1000));

  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  return `In ${daysUntil} days`;
}

export default function ReminderList({ reminders, onEdit, onDelete }: ReminderListProps) {
  const confirmDelete = (id: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(id) },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.formTitle}>My Reminders ({reminders.length})</Text>
      {reminders.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.item}
          onPress={() => onEdit(item)}
          activeOpacity={0.7}
        >
          <View style={styles.itemInfo}>
            <View style={styles.itemNameRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.is_critical && (
                <View style={styles.criticalBadge}>
                  <Text style={styles.criticalBadgeText}>Critical</Text>
                </View>
              )}
            </View>
            <Text style={styles.itemType}>{item.event_type}</Text>
            <Text style={styles.itemDue}>{formatOccurrence(item)}</Text>
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              confirmDelete(item.id);
            }}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
      {reminders.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No reminders yet</Text>
          <Text style={styles.emptySubtext}>Add a birthday or anniversary above</Text>
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
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  criticalBadge: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  criticalBadgeText: {
    fontSize: 10,
    color: '#ef4444',
    fontWeight: '600',
  },
  itemType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemDue: {
    fontSize: 12,
    color: '#666',
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
