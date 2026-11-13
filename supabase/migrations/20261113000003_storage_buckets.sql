-- ==============================================================================
-- PIXELLOSTORE SUPABASE DATABASE MIGRATION: 003_STORAGE_BUCKETS
-- Storage Buckets & Policies for Product Images, Private Photos & Order Invoices
-- ==============================================================================

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('product-images', 'product-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('hamper-assets', 'hamper-assets', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('customer-uploads', 'customer-uploads', false, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('order-documents', 'order-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies for product-images (Public Read, Admin Write)
CREATE POLICY "Public read product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admin upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admin update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admin delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND public.is_admin());

-- 3. Storage Policies for hamper-assets
CREATE POLICY "Public read hamper assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'hamper-assets');

CREATE POLICY "Admin manage hamper assets"
ON storage.objects FOR ALL
USING (bucket_id = 'hamper-assets' AND public.is_admin());

-- 4. Storage Policies for customer-uploads (Strictly Private Customer Photos)
-- Path format: {user_id}/{filename}
CREATE POLICY "Customers upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'customer-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Customers view own uploads"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'customer-uploads' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    public.is_admin()
  )
);

CREATE POLICY "Customers delete own uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'customer-uploads' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    public.is_admin()
  )
);

-- 5. Storage Policies for order-documents
CREATE POLICY "Authorized view order documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'order-documents' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    public.is_admin()
  )
);

CREATE POLICY "Admin manage order documents"
ON storage.objects FOR ALL
USING (bucket_id = 'order-documents' AND public.is_admin());
