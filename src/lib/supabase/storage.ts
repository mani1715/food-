import { supabase } from './client';

export type StorageBucket = 'product-images' | 'banners' | 'site-assets';

export const uploadImageToSupabase = async (
  file: File,
  bucket: StorageBucket = 'product-images',
  folder = 'uploads'
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error(`Error uploading image to Supabase bucket "${bucket}":`, error.message);
    throw error;
  }

  // Retrieve Public URL
  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrlData.publicUrl;
};

export const getPublicStorageUrl = (bucket: StorageBucket, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};
