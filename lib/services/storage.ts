import { supabase } from './client';
// expo-file-system v19+ moved documentDirectory/EncodingType/writeAsStringAsync
// off the main entry point onto this legacy subpath.
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export class StorageService {
  private static readonly RECEIPTS_BUCKET = 'receipts';
  private static readonly LIVESTOCK_PHOTOS_BUCKET = 'livestock-photos';

  /**
   * Upload a receipt image to Supabase storage
   */
  static async uploadReceiptImage(
    imageUri: string,
    userId: string,
    transactionId?: string
  ): Promise<{ publicUrl: string | null; error: Error | null }> {
    if (!imageUri) return { publicUrl: null, error: null };
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`;
    return this.uploadImage(this.RECEIPTS_BUCKET, imageUri, fileName);
  }

  static async deleteReceiptImage(imageUrl: string): Promise<{ error: Error | null }> {
    return this.deleteImage(this.RECEIPTS_BUCKET, imageUrl);
  }

  /**
   * Upload a livestock photo to Supabase storage
   */
  static async uploadLivestockPhoto(
    imageUri: string,
    userId: string,
    livestockId?: string
  ): Promise<{ publicUrl: string | null; error: Error | null }> {
    if (!imageUri) return { publicUrl: null, error: null };
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`;
    return this.uploadImage(this.LIVESTOCK_PHOTOS_BUCKET, imageUri, fileName);
  }

  static async deleteLivestockPhoto(imageUrl: string): Promise<{ error: Error | null }> {
    return this.deleteImage(this.LIVESTOCK_PHOTOS_BUCKET, imageUrl);
  }

  private static async uploadImage(
    bucket: string,
    imageUri: string,
    fileName: string
  ): Promise<{ publicUrl: string | null; error: Error | null }> {
    try {
      let fileData: Uint8Array;

      // Handle different platforms
      if (Platform.OS === 'web') {
        // Web platform - handle blob URLs and data URLs
        if (imageUri.startsWith('blob:')) {
          // Fetch blob data
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          fileData = new Uint8Array(arrayBuffer);
        } else if (imageUri.startsWith('data:')) {
          // Data URL - extract base64 part
          const base64 = imageUri.split(',')[1];
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          fileData = new Uint8Array(byteNumbers);
        } else {
          throw new Error('Unsupported image URI format for web');
        }
      } else {
        // Mobile platform - use FileSystem
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Convert base64 to byte array
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        fileData = new Uint8Array(byteNumbers);
      }

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, fileData, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });

      if (error) {
        console.error('Upload error:', error);
        return { publicUrl: null, error };
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return { 
        publicUrl: publicUrlData.publicUrl,
        error: null 
      };

    } catch (error) {
      console.error('Storage service error:', error);
      return { 
        publicUrl: null, 
        error: error as Error 
      };
    }
  }

  private static async deleteImage(bucket: string, imageUrl: string): Promise<{ error: Error | null }> {
    try {
      if (!imageUrl || !imageUrl.includes(bucket)) {
        return { error: null };
      }

      // Extract file path from URL
      const urlParts = imageUrl.split(`${bucket}/`);
      if (urlParts.length < 2) {
        return { error: new Error('Invalid image URL') };
      }

      const filePath = urlParts[1].split('?')[0]; // Remove query parameters

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      return { error };

    } catch (error) {
      console.error('Delete error:', error);
      return { error: error as Error };
    }
  }

  /**
   * Check if a storage bucket exists and is accessible
   */
  static async checkBucketAccess(bucket: string = this.RECEIPTS_BUCKET): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.listBuckets();

      if (error) {
        console.error('Bucket access error:', error);
        return false;
      }

      const bucketExists = data?.some(b => b.name === bucket);
      return bucketExists || false;

    } catch (error) {
      console.error('Bucket check error:', error);
      return false;
    }
  }
}