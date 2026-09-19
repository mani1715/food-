import { supabase } from './client';

export type StorageBucket = 'product-images' | 'banners' | 'site-assets';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates actual binary file headers (magic bytes) to ensure the uploaded file
 * is genuinely a JPEG, PNG, or WebP binary rather than renamed executable/HTML script.
 */
export const validateImageFileSignature = async (file: File): Promise<boolean> => {
  const slice = file.slice(0, 12);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (bytes.length < 4) return false;

  // JPEG signature: FF D8 FF
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

  // PNG signature: 89 50 4E 47
  const isPng =
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;

  // WebP signature: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
  const isRiff =
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
  const isWebp =
    bytes.length >= 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;

  return isJpeg || isPng || (isRiff && isWebp);
};

/**
 * Validates and uploads an image to a secure Supabase Storage bucket.
 * Enforces MIME type check, 5MB maximum file size, binary magic-byte inspection,
 * and random UUID filename sanitization preventing path traversal.
 */
export const uploadImageToSupabase = async (
  file: File,
  bucket: StorageBucket = 'product-images',
  folder = 'uploads'
): Promise<string> => {
  // 1. File presence and MIME validation
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    throw new Error(
      `Invalid file format "${file.type}". Only JPG, PNG, and WebP images are allowed.`
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(`File size (${sizeInMb}MB) exceeds the maximum allowed limit of 5MB.`);
  }

  // 2. Binary Magic-Byte Content Signature Verification
  const isSignatureValid = await validateImageFileSignature(file);
  if (!isSignatureValid) {
    throw new Error('File content signature does not match a valid JPG, PNG, or WebP image.');
  }

  // 3. Filename and path sanitization (Prevent ../ path traversal)
  const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(rawExt) ? rawExt : 'jpg';
  const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const sanitizedFileName = `${cleanFolder || 'uploads'}/${uniqueId}.${safeExt}`;

  // 4. Upload to bucket with explicit upsert=false preventing overwriting
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(sanitizedFileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error(`Error uploading image to Supabase bucket "${bucket}":`, error.message);
    throw error;
  }

  // 5. Retrieve Public URL
  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrlData.publicUrl;
};

export const deleteImageFromSupabase = async (
  bucket: StorageBucket,
  path: string
): Promise<void> => {
  const cleanPath = path.replace(/^\/+/, '').replace(/\.\./g, '');
  const { error } = await supabase.storage.from(bucket).remove([cleanPath]);
  if (error) {
    console.warn(`Could not delete storage object "${cleanPath}":`, error.message);
  }
};

export const getPublicStorageUrl = (bucket: StorageBucket, path: string): string => {
  const cleanPath = path.replace(/^\/+/, '').replace(/\.\./g, '');
  const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
  return data.publicUrl;
};
