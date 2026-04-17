-- Ensure all essential platform buckets exist and are public
-- This unblocks uploads for Products, Jobs, Events, and Profiles
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES 
        ('avatars', 'avatars', true),
        ('products', 'products', true),
        ('jobs', 'jobs', true),
        ('events', 'events', true),
        ('offers', 'offers', true),
        ('businesses', 'businesses', true)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Cleanup existing policies to prevent conflicts during re-runs
DROP POLICY IF EXISTS "Public Access to Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Global Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage storage" ON storage.objects;

-- 1. Global Public Access (SELECT)
-- Allows visitors to see all uploaded media across the platform
-- Covers: Products, Logos, Avatars, and Banner images
CREATE POLICY "Global Public Access"
ON storage.objects FOR SELECT
USING (bucket_id IN ('avatars', 'products', 'jobs', 'events', 'offers', 'businesses'));

-- 2. Authenticated Management (INSERT, UPDATE, DELETE)
-- Allows logged-in business owners to upload and manage their media library
-- This provides a robust development baseline to unblock all Dashboard operations
CREATE POLICY "Authenticated users can manage storage"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id IN ('avatars', 'products', 'jobs', 'events', 'offers', 'businesses'))
WITH CHECK (bucket_id IN ('avatars', 'products', 'jobs', 'events', 'offers', 'businesses'));
