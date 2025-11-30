-- Create Storage Bucket for Action Attachments
-- Date: 2025-11-24
-- Description: Create action-attachments bucket in Supabase Storage

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'action-attachments',
  'action-attachments',
  false, -- Private bucket
  52428800, -- 50MB file size limit
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', -- .xlsx
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', -- .pptx
    'text/plain',
    'text/csv',
    'application/json',
    'application/octet-stream' -- For files with unknown MIME type
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Note: Storage RLS Policies must be created via Supabase Dashboard or via the SQL Editor with proper permissions
-- 
-- Required Policies (create these manually in the Supabase Dashboard under Storage > action-attachments > Policies):
-- 
-- 1. SELECT Policy: "Users can view action attachments in their tenant"
--    Target roles: authenticated
--    WITH CHECK expression:
--    (bucket_id = 'action-attachments'::text) AND ((storage.foldername(name))[1] = ANY (ARRAY( SELECT (profiles.tenant_id)::text FROM profiles WHERE (profiles.user_id = auth.uid()))))
--
-- 2. INSERT Policy: "Users can upload action attachments to their tenant"  
--    Target roles: authenticated
--    WITH CHECK expression:
--    (bucket_id = 'action-attachments'::text) AND ((storage.foldername(name))[1] = ANY (ARRAY( SELECT (profiles.tenant_id)::text FROM profiles WHERE (profiles.user_id = auth.uid()))))
--
-- 3. UPDATE Policy: "Users can update their own action attachments"
--    Target roles: authenticated
--    USING expression:
--    (bucket_id = 'action-attachments'::text) AND ((storage.foldername(name))[1] = ANY (ARRAY( SELECT (profiles.tenant_id)::text FROM profiles WHERE (profiles.user_id = auth.uid())))) AND (owner = auth.uid())
--
-- 4. DELETE Policy: "Users can delete action attachments in their tenant"
--    Target roles: authenticated
--    USING expression:
--    (bucket_id = 'action-attachments'::text) AND ((storage.foldername(name))[1] = ANY (ARRAY( SELECT (profiles.tenant_id)::text FROM profiles WHERE (profiles.user_id = auth.uid())))) AND ((owner = auth.uid()) OR public.is_super_admin())

