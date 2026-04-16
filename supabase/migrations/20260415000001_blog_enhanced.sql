-- Add meta_description to blogs table
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Use a DO block to safely handle storage bucket and policies
DO $$
BEGIN
    -- Create the bucket if it doesn't exist
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('blog-images', 'blog-images', true)
    ON CONFLICT (id) DO NOTHING;

    -- Drop existing policies if they exist to avoid errors during re-runs
    DROP POLICY IF EXISTS "Blog Images Public Access" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can manage blog images" ON storage.objects;

    -- 1. Everyone can view blog images
    CREATE POLICY "Blog Images Public Access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'blog-images');

    -- 2. Only admins can upload and manage blog images
    CREATE POLICY "Admins can manage blog images"
    ON storage.objects FOR ALL
    TO authenticated
    USING (
        bucket_id = 'blog-images' AND
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    )
    WITH CHECK (
        bucket_id = 'blog-images' AND
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );
END $$;
