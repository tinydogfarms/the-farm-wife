import { Platform } from 'react-native';
// expo-file-system v19+ moved documentDirectory/EncodingType/writeAsStringAsync
// off the main entry point onto this legacy subpath.
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './client';
import type { EquipmentInput } from '../types';

async function uriToBase64(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] ?? '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

/**
 * Sends a photo of an equipment ID tag/nameplate to the parse-equipment-tag
 * edge function and returns the extracted make/model/year/serial number.
 * Never throws — callers should treat a null `data` as "extraction didn't
 * work, leave the form fields as-is".
 */
export async function parseEquipmentTagImage(
  uri: string
): Promise<{ data: Partial<EquipmentInput> | null; error: string | null }> {
  try {
    const imageBase64 = await uriToBase64(uri);

    const { data, error } = await supabase.functions.invoke('parse-equipment-tag', {
      body: { imageBase64, mediaType: 'image/jpeg' },
    });

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data?.success) {
      return { data: null, error: data?.error ?? 'Could not extract data from tag' };
    }

    return { data: data.data as Partial<EquipmentInput>, error: null };
  } catch (error) {
    console.error('Equipment tag parsing error:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
