import { StorageService } from '../services/storage';
import { supabase } from '../services/client';

export async function testStorageSetup(): Promise<{
  bucketExists: boolean;
  canUpload: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let bucketExists = false;
  let canUpload = false;

  try {
    // Test 1: Check if bucket exists
    console.log('Testing storage bucket access...');
    bucketExists = await StorageService.checkBucketAccess();
    
    if (!bucketExists) {
      errors.push('Receipts bucket does not exist or is not accessible');
    }

    // Test 2: Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      errors.push('User is not authenticated');
      return { bucketExists, canUpload, errors };
    }

    // Test 3: Try to list objects in bucket (this will test permissions)
    const { data, error } = await supabase.storage
      .from('receipts')
      .list(user.id);

    if (error) {
      errors.push(`Storage permissions error: ${error.message}`);
    } else {
      canUpload = true;
      console.log('Storage test passed!');
    }

  } catch (error) {
    errors.push(`Storage test failed: ${(error as Error).message}`);
  }

  return { bucketExists, canUpload, errors };
}