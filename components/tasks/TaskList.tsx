import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { Task } from '../../lib/types';
import { TASK_CATEGORIES, TASK_CATEGORY_LABELS } from '../../lib/constants/taskCategories';

interface TaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

function categoryColor(category: Task['category']): string {
  return TASK_CATEGORIES.find(c => c.key === category)?.color ?? '#9ca3af';
}

export default function TaskList({ tasks, onComplete, onDelete, onEdit }: TaskListProps) {
  const confirmDelete = (id: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(id) },
      ]
    );
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');

  return (
    <View style={styles.tasksCard}>
      <Text style={styles.formTitle}>Tasks ({pendingTasks.length})</Text>
      {pendingTasks.map((task) => (
        <TouchableOpacity
          key={task.id}
          style={styles.taskItem}
          onPress={() => onEdit(task)}
          activeOpacity={0.7}
        >
          <View style={styles.taskMain}>
            <View style={[styles.categoryDot, { backgroundColor: categoryColor(task.category) }]} />
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskMeta}>
                {TASK_CATEGORY_LABELS[task.category]}
                {task.next_due ? ` · Due ${new Date(task.next_due).toLocaleDateString()}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.taskRight}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onComplete(task.id);
              }}
              style={styles.completeButton}
            >
              <Text style={styles.completeText}>Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                confirmDelete(task.id);
              }}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
      {pendingTasks.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No tasks yet</Text>
          <Text style={styles.emptySubtext}>Add your first task above</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tasksCard: {
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
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  taskMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  taskMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  taskRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  completeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#10b981',
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
