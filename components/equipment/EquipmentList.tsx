import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { Equipment } from '../../lib/types';

interface EquipmentListProps {
  equipment: Equipment[];
  onDelete: (id: string) => void;
  onEdit: (equipment: Equipment) => void;
}

export default function EquipmentList({ equipment, onDelete, onEdit }: EquipmentListProps) {
  const confirmDelete = (id: string) => {
    Alert.alert(
      'Delete Equipment',
      'Are you sure you want to delete this equipment? Its service records will be deleted too.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(id) },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.formTitle}>My Equipment ({equipment.length})</Text>
      {equipment.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.item}
          onPress={() => onEdit(item)}
          activeOpacity={0.7}
        >
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemCategory}>{item.category}</Text>
            {!!item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
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
      {equipment.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No equipment yet</Text>
          <Text style={styles.emptySubtext}>Add your first piece of equipment above</Text>
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
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  itemCategory: {
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
