import { useEffect, useState } from 'react';
import { supabase } from '../services/client';
import { useAuth } from './auth';
import { StorageService } from '../services/storage';
import { getReadableError } from '../utils/errorHandler';
import type { Livestock, LivestockInput } from '../types';

function isLocalUri(uri: string | null | undefined): uri is string {
  return !!uri && !uri.startsWith('http');
}

export function useLivestock() {
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadLivestock = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('livestock')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading livestock:', error);
    } else {
      setLivestock(data || []);
    }
    setLoading(false);
  };

  const addLivestock = async (input: LivestockInput) => {
    if (!user) return { data: null, error: 'User not authenticated' };

    let photoUrl = input.photo_url;
    if (isLocalUri(photoUrl)) {
      const { publicUrl, error: uploadError } = await StorageService.uploadLivestockPhoto(photoUrl, user.id);
      if (uploadError) return { data: null, error: getReadableError(uploadError) };
      photoUrl = publicUrl;
    }

    const { data, error } = await supabase
      .from('livestock')
      .insert([{ ...input, photo_url: photoUrl, user_id: user.id }])
      .select()
      .single();

    if (!error && data) {
      setLivestock(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    }

    return { data, error: error ? getReadableError(error) : null };
  };

  const updateLivestock = async (id: string, input: LivestockInput) => {
    if (!user) return { data: null, error: 'User not authenticated' };

    const existing = livestock.find(l => l.id === id);

    let photoUrl = input.photo_url;
    if (isLocalUri(photoUrl)) {
      const { publicUrl, error: uploadError } = await StorageService.uploadLivestockPhoto(photoUrl, user.id, id);
      if (uploadError) return { data: null, error: getReadableError(uploadError) };
      photoUrl = publicUrl;
    }

    const { data, error } = await supabase
      .from('livestock')
      .update({ ...input, photo_url: photoUrl })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return { data: null, error: getReadableError(error) };
    }

    if (existing?.photo_url && existing.photo_url !== photoUrl) {
      await StorageService.deleteLivestockPhoto(existing.photo_url);
    }

    setLivestock(prev => prev.map(l => (l.id === id ? data : l)).sort((a, b) => a.name.localeCompare(b.name)));
    return { data, error: null };
  };

  const deleteLivestock = async (id: string) => {
    const existing = livestock.find(l => l.id === id);

    const { error } = await supabase
      .from('livestock')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id);

    if (!error) {
      if (existing?.photo_url) {
        await StorageService.deleteLivestockPhoto(existing.photo_url);
      }
      setLivestock(prev => prev.filter(l => l.id !== id));
    }

    return { error: error ? getReadableError(error) : null };
  };

  useEffect(() => {
    loadLivestock();
  }, [user]);

  return {
    livestock,
    loading,
    addLivestock,
    updateLivestock,
    deleteLivestock,
    refreshLivestock: loadLivestock,
  };
}
