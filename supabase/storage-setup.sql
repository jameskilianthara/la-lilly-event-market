-- EventFoundry Storage Buckets and Policies
-- Configure image storage for vendor profiles, portfolios, and event references

-- Note: Create these buckets manually in Supabase Dashboard > Storage first:
-- 1. vendor-profiles (public: true, file size limit: 5MB)
-- 2. vendor-portfolios (public: true, file size limit: 10MB)
-- 3. event-references (public: true, file size limit: 10MB)

-- Then apply these storage policies:

-- ========================================
-- VENDOR-PROFILES BUCKET POLICIES
-- ========================================

-- Allow authenticated users to upload to their own vendor profile folder
CREATE POLICY "Vendors can upload own profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-profiles'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow vendors to update their own profile images
CREATE POLICY "Vendors can update own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor-profiles'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow vendors to delete their own profile images
CREATE POLICY "Vendors can delete own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-profiles'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read access for all profile images
CREATE POLICY "Public read access for profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vendor-profiles');

-- ========================================
-- VENDOR-PORTFOLIOS BUCKET POLICIES
-- ========================================

-- Allow authenticated vendors to upload portfolio images
CREATE POLICY "Vendors can upload portfolio images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-portfolios'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow vendors to update their portfolio images
CREATE POLICY "Vendors can update portfolio images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor-portfolios'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow vendors to delete their portfolio images
CREATE POLICY "Vendors can delete portfolio images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-portfolios'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read access for portfolio images
CREATE POLICY "Public read access for portfolio images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vendor-portfolios');

-- ========================================
-- EVENT-REFERENCES BUCKET POLICIES
-- ========================================

-- Allow authenticated clients to upload event reference images
CREATE POLICY "Clients can upload event references"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-references'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow clients to update their event references
CREATE POLICY "Clients can update event references"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-references'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow clients to delete their event references
CREATE POLICY "Clients can delete event references"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-references'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read access for event reference images
CREATE POLICY "Public read access for event references"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-references');

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to get public URL for a storage object
CREATE OR REPLACE FUNCTION get_public_url(bucket_name text, file_path text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_url text;
BEGIN
  -- Get Supabase project URL from settings
  base_url := current_setting('app.settings.supabase_url', true);
  IF base_url IS NULL THEN
    base_url := 'https://ikfawcbcapmfpzwbqccr.supabase.co';
  END IF;

  RETURN base_url || '/storage/v1/object/public/' || bucket_name || '/' || file_path;
END;
$$;

-- ========================================
-- STORAGE BUCKET CONFIGURATIONS
-- ========================================

/*
MANUAL SETUP IN SUPABASE DASHBOARD:

1. Go to Storage > Create new bucket

2. Create "vendor-profiles" bucket:
   - Name: vendor-profiles
   - Public: Yes
   - File size limit: 5 MB
   - Allowed MIME types: image/jpeg, image/png, image/webp

3. Create "vendor-portfolios" bucket:
   - Name: vendor-portfolios
   - Public: Yes
   - File size limit: 10 MB
   - Allowed MIME types: image/jpeg, image/png, image/webp

4. Create "event-references" bucket:
   - Name: event-references
   - Public: Yes
   - File size limit: 10 MB
   - Allowed MIME types: image/jpeg, image/png, image/webp

5. Then run this SQL file to apply the policies above

FOLDER STRUCTURE:
- vendor-profiles/{user_id}/logo.jpg
- vendor-profiles/{user_id}/headshot.jpg
- vendor-portfolios/{user_id}/{event_id}/{filename}.jpg
- event-references/{user_id}/{event_id}/{filename}.jpg
*/
