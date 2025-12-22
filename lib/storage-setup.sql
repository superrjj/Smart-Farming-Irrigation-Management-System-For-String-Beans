-- Create storage policies for the 'images' bucket
-- These policies allow public access since you're not using Supabase Auth

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates" ON storage.objects;

-- Create policy for public uploads to images bucket
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (true);

-- Create policy for public downloads from images bucket  
CREATE POLICY "Allow public downloads" ON storage.objects
FOR SELECT USING (true);

-- Create policy for public updates (overwrite) in images bucket
CREATE POLICY "Allow public updates" ON storage.objects
FOR UPDATE USING (true);

-- Note: These policies allow full public access to storage
-- This ensures profile pictures can be uploaded and retrieved properly
