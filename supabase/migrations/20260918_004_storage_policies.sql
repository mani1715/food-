-- ==============================================================================
-- MIGRATION 004: AISHU HOME FOODS — STORAGE BUCKETS & ACCESS POLICIES
-- ==============================================================================
-- This migration ensures storage buckets exist with public read access
-- and strictly limits uploads, modifications, and deletions to authorized staff.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENSURE STORAGE BUCKETS EXIST
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
    ('banners', 'banners', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
    ('site-assets', 'site-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ------------------------------------------------------------------------------
-- 2. STORAGE OBJECT ACCESS POLICIES
-- ------------------------------------------------------------------------------

-- Public READ policy for all assets in these buckets
DROP POLICY IF EXISTS "Public can view store images" ON storage.objects;
CREATE POLICY "Public can view store images"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id IN ('product-images', 'banners', 'site-assets'));

-- Authenticated Staff can UPLOAD images
DROP POLICY IF EXISTS "Staff can upload store images" ON storage.objects;
CREATE POLICY "Staff can upload store images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id IN ('product-images', 'banners', 'site-assets') AND
        public.is_staff()
    );

-- Authenticated Staff can UPDATE images
DROP POLICY IF EXISTS "Staff can update store images" ON storage.objects;
CREATE POLICY "Staff can update store images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id IN ('product-images', 'banners', 'site-assets') AND
        public.is_staff()
    );

-- Authenticated Staff can DELETE images
DROP POLICY IF EXISTS "Staff can delete store images" ON storage.objects;
CREATE POLICY "Staff can delete store images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id IN ('product-images', 'banners', 'site-assets') AND
        public.is_staff()
    );
