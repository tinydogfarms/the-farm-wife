import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTasks } from '../../lib/hooks/tasks';
import { useUserSettings } from '../../lib/hooks/userSettings';
import type { Task, TaskCategory, TaskInput } from '../../lib/types';

import CategoryFilter from './CategoryFilter';
import CustodyScheduleCard from './CustodyScheduleCard';
import TaskForm from './TaskForm';
import TaskList from './TaskList';

export default function TasksApp() {
  const { tasks, loading, addTask, updateTask, deleteTask, completeTask } = useTasks();
  const { settings, updateSettings } = useUserSettings();

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');

  const handleAddTask = async (taskData: TaskInput) => {
    const { error } = await addTask(taskData);
    if (error) {
      throw new Error(error);
    }
  };

  const handleUpdateTask = async (id: string, taskData: TaskInput) => {
    const { error } = await updateTask(id, taskData);
    if (error) {
      throw new Error(error);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
  };

  const handleComplete = async (id: string) => {
    const { nextTask, error } = await completeTask(id);
    if (error) {
      Alert.alert('Error', error);
      return;
    }
    if (nextTask?.next_due) {
      Alert.alert(
        'Task Completed',
        `Next occurrence scheduled for ${new Date(nextTask.next_due).toLocaleDateString()}.`
      );
    }
  };

  const handleDeleteTask = async (id: string) => {
    const { error } = await deleteTask(id);
    if (error) {
      Alert.alert('Error', error);
    }
  };

  const handleSaveCustodySchedule = async (custodyWeekStart: string, custodyAlternates: boolean) => {
    const { error } = await updateSettings({
      custody_week_start: custodyWeekStart,
      custody_alternates: custodyAlternates,
    });
    if (error) {
      throw new Error(error);
    }
  };

  const filteredTasks = categoryFilter === 'all'
    ? tasks
    : tasks.filter(t => t.category === categoryFilter);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <CustodyScheduleCard settings={settings} onSave={handleSaveCustodySchedule} />

      <CategoryFilter selected={categoryFilter} onSelect={setCategoryFilter} />

      <TaskForm
        onSubmit={handleAddTask}
        editTask={editingTask || undefined}
        onUpdate={handleUpdateTask}
        onCancel={handleCancelEdit}
      />

      <TaskList
        tasks={filteredTasks}
        onComplete={handleComplete}
        onDelete={handleDeleteTask}
        onEdit={handleEditTask}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
