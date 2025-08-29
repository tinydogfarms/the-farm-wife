import { supabase } from './client';
import * as FileSystem from 'expo-file-system';

export class StorageService {
  private static readonly BUCKET_NAME = 'receipts';

  /**
   * Upload a receipt image to Supabase storage
   */
  static async uploadReceiptImage(
    imageUri: string, 
    userId: string, 
    transactionId?: string
  ): Promise<{ publicUrl: string | null; error: Error | null }> {
    try {
      if (!imageUri) {
        return { publicUrl: null, error: null };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const fileName = `${userId}/${timestamp}_${randomId}.jpg`;

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to blob-like format for upload
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, byteArray, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });

      if (error) {
        console.error('Upload error:', error);
        return { publicUrl: null, error };
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.BUCKET_NAME)
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

  /**
   * Delete a receipt image from storage
   */
  static async deleteReceiptImage(imageUrl: string): Promise<{ error: Error | null }> {
    try {
      if (!imageUrl || !imageUrl.includes(this.BUCKET_NAME)) {
        return { error: null };
      }

      // Extract file path from URL
      const urlParts = imageUrl.split(`${this.BUCKET_NAME}/`);
      if (urlParts.length < 2) {
        return { error: new Error('Invalid image URL') };
      }
      
      const filePath = urlParts[1].split('?')[0]; // Remove query parameters

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      return { error };

    } catch (error) {
      console.error('Delete error:', error);
      return { error: error as Error };
    }
  }

  /**
   * Check if storage bucket exists and is accessible
   */
  static async checkBucketAccess(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Bucket access error:', error);
        return false;
      }

      const bucketExists = data?.some(bucket => bucket.name === this.BUCKET_NAME);
      return bucketExists || false;

    } catch (error) {
      console.error('Bucket check error:', error);
      return false;
    }
  }
}