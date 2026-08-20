import { Platform } from 'react-native';
// expo-file-system v19+ moved documentDirectory/EncodingType/writeAsStringAsync
// off the main entry point onto this legacy subpath.
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './client';
import type { TransactionInput } from '../types';

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
 * Sends a receipt photo to the parse-receipt edge function and returns the
 * extracted transaction fields. Never throws — callers should treat a null
 * `data` as "extraction didn't work, fall back to an empty form".
 */
export async function parseReceiptImage(
  uri: string
): Promise<{ data: Partial<TransactionInput> | null; error: string | null }> {
  try {
    const imageBase64 = await uriToBase64(uri);

    const { data, error } = await supabase.functions.invoke('parse-receipt', {
      body: { imageBase64, mediaType: 'image/jpeg' },
    });

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data?.success) {
      return { data: null, error: data?.error ?? 'Could not extract data from receipt' };
    }

    return { data: data.data as Partial<TransactionInput>, error: null };
  } catch (error) {
    console.error('Receipt parsing error:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
