import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import type { Livestock } from '../../lib/types';

interface LivestockListProps {
  livestock: Livestock[];
  onDelete: (id: string) => void;
  onEdit: (livestock: Livestock) => void;
}

function getSubtitle(item: Livestock): string {
  const parts = [item.species, item.breed].filter(Boolean);
  return parts.join(' · ');
}

function getIdentifier(item: Livestock): string | null {
  if (item.tracking_type === 'group') {
    return `${item.count} head`;
  }
  return item.tag_number ? `Tag: ${item.tag_number}` : null;
}

export default function LivestockList({ livestock, onDelete, onEdit }: LivestockListProps) {
  const confirmDelete = (id: string) => {
    Alert.alert(
      'Delete Livestock',
      'Are you sure you want to delete this record? Its care records will be deleted too.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(id) },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.formTitle}>My Livestock ({livestock.length})</Text>
      {livestock.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.item}
          onPress={() => onEdit(item)}
          activeOpacity={0.7}
        >
          {item.photo_url ? (
            <Image source={{ uri: item.photo_url }} style={styles.thumbnail} />
          ) : (
            <View style={styles.thumbnailPlaceholder} />
          )}
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            {!!getSubtitle(item) && <Text style={styles.itemSubtitle}>{getSubtitle(item)}</Text>}
            {!!getIdentifier(item) && <Text style={styles.itemNotes}>{getIdentifier(item)}</Text>}
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
      {livestock.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No livestock yet</Text>
          <Text style={styles.emptySubtext}>Add your first group or animal above</Text>
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
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#f3f4f6',
  },
  thumbnailPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#f3f4f6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  itemSubtitle: {
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
