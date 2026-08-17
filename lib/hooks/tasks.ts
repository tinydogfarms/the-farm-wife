import { useEffect, useState } from 'react';
import { supabase } from '../services/client';
import { useAuth } from './auth';
import { useUserSettings } from './userSettings';
import { getReadableError } from '../utils/errorHandler';
import { calculateNextDue } from '../utils/recurrence';
import type { Task, TaskInput } from '../types';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { settings } = useUserSettings();

  const loadTasks = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .or(`user_id.eq.${user.id},shared_with.cs.{${user.id}}`)
      .order('next_due', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error loading tasks:', error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const addTask = async (taskInput: TaskInput) => {
    if (!user) return { error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        ...taskInput,
        user_id: user.id,
      }])
      .select()
      .single();

    if (!error && data) {
      setTasks(prev => [data, ...prev]);
    }

    return { data, error: error ? getReadableError(error) : null };
  };

  const updateTask = async (id: string, taskInput: TaskInput) => {
    if (!user) return { error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('tasks')
      .update(taskInput)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setTasks(prev => prev.map(t => t.id === id ? data : t));
    }

    return { data, error: error ? getReadableError(error) : null };
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (!error) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }

    return { error: error ? getReadableError(error) : null };
  };

  // Marks a task complete and, for recurring tasks, logs the completion and
  // creates the next pending occurrence (the original row is never mutated
  // beyond its own status — a new row represents the next occurrence).
  const completeTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task || !user) return { error: 'Task not found' };

    const completedAt = new Date();

    const { data: updated, error: updateError } = await supabase
      .from('tasks')
      .update({ status: 'complete', completed_at: completedAt.toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return { data: null, nextTask: null, error: getReadableError(updateError) };
    }

    setTasks(prev => prev.map(t => t.id === id ? updated : t));

    if (task.recurrence_type === 'none') {
      return { data: updated, nextTask: null, error: null };
    }

    const { error: logError } = await supabase
      .from('activity_log')
      .insert([{
        user_id: user.id,
        raw_label: task.title,
        category: task.category,
        source: 'task_complete',
        ended_at: completedAt.toISOString(),
        discovery_session: false,
      }]);

    if (logError) {
      console.error('Error recording activity log entry:', logError);
    }

    const nextDue = calculateNextDue(task, completedAt, settings ?? undefined);
    if (!nextDue) {
      return { data: updated, nextTask: null, error: null };
    }

    const { data: nextTask, error: insertError } = await supabase
      .from('tasks')
      .insert([{
        user_id: task.user_id,
        title: task.title,
        category: task.category,
        owner: task.owner,
        recurrence_type: task.recurrence_type,
        recurrence_interval: task.recurrence_interval,
        recurrence_day: task.recurrence_day,
        custody_week: task.custody_week,
        next_due: nextDue.toISOString(),
        notes: task.notes,
        shared_with: task.shared_with,
        shared_permissions: task.shared_permissions,
      }])
      .select()
      .single();

    if (insertError) {
      return { data: updated, nextTask: null, error: getReadableError(insertError) };
    }

    setTasks(prev => [nextTask, ...prev]);
    return { data: updated, nextTask, error: null };
  };

  useEffect(() => {
    loadTasks();
  }, [user]);

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    refreshTasks: loadTasks,
  };
}
