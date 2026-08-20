import { useEffect, useState } from 'react';
import { supabase } from '../services/client';
import { useAuth } from './auth';
import { getReadableError } from '../utils/errorHandler';
import type { Equipment, EquipmentInput } from '../types';

export function useEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadEquipment = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading equipment:', error);
    } else {
      setEquipment(data || []);
    }
    setLoading(false);
  };

  const addEquipment = async (input: EquipmentInput) => {
    if (!user) return { data: null, error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('equipment')
      .insert([{ ...input, user_id: user.id }])
      .select()
      .single();

    if (!error && data) {
      setEquipment(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    }

    return { data, error: error ? getReadableError(error) : null };
  };

  const updateEquipment = async (id: string, input: EquipmentInput) => {
    if (!user) return { data: null, error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('equipment')
      .update(input)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (!error && data) {
      setEquipment(prev => prev.map(e => (e.id === id ? data : e)));
    }

    return { data, error: error ? getReadableError(error) : null };
  };

  const deleteEquipment = async (id: string) => {
    const { error } = await supabase
      .from('equipment')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id);

    if (!error) {
      setEquipment(prev => prev.filter(e => e.id !== id));
    }

    return { error: error ? getReadableError(error) : null };
  };

  useEffect(() => {
    loadEquipment();
  }, [user]);

  return {
    equipment,
    loading,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    refreshEquipment: loadEquipment,
  };
}
