-- Supabase setup for receipt storage functionality
-- Run these commands in your Supabase SQL Editor

-- 1. Add receipt_image column to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS receipt_image TEXT;

-- 2. Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Row Level Security (RLS) policies for receipts bucket

-- Policy to allow authenticated users to upload receipts
CREATE POLICY "Users can upload their own receipts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow authenticated users to view their own receipts
CREATE POLICY "Users can view their own receipts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow authenticated users to delete their own receipts
CREATE POLICY "Users can delete their own receipts" ON storage.objects
FOR DELETE USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Optional: Create index on receipt_image column for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_receipt_image 
ON transactions(receipt_image) 
WHERE receipt_image IS NOT NULL;