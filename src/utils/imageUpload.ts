
import { supabase } from '@/integrations/supabase/client';

export const uploadImageFromUrl = async (
  imageUrl: string, 
  bucket: string = 'event-images', 
  folder: string = 'imported'
): Promise<string | null> => {
  if (!imageUrl || imageUrl.trim() === '') {
    return null;
  }

  try {
    // Fetch the image from the URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error('Failed to fetch image from URL:', imageUrl);
      return null;
    }

    const blob = await response.blob();
    
    // Generate a unique filename
    const fileExt = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, {
        contentType: blob.type,
        upsert: false
      });

    if (error) {
      console.error('Error uploading image to storage:', error);
      return null;
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadImageFromUrl:', error);
    return null;
  }
};

export const uploadImageFromFile = async (
  file: File, 
  bucket: string = 'event-images', 
  folder: string = 'imported'
): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Error uploading file to storage:', error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadImageFromFile:', error);
    return null;
  }
};
