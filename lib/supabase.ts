import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Add some debug logging
console.log('Supabase initialization:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

export async function uploadCarImage(file: File, carId: number, isFirstImage: boolean = false) {
  try {
    // Generate unique file paths
    const fileExt = file.type.split('/')[1];
    const mainPath = `${carId}/${Date.now()}_main.${fileExt}`;
    const thumbnailPath = `${carId}/${Date.now()}_thumb.${fileExt}`;
    const galleryPath = `${carId}/${Date.now()}_gallery.${fileExt}`;

    // Upload the original image
    const { data: mainData, error: mainError } = await supabase.storage
      .from('car-images')
      .upload(isFirstImage ? mainPath : galleryPath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
        duplex: 'half',
        metadata: {
          preserve_quality: true,
          mimetype: file.type,
          size: file.size,
          lastModified: file.lastModified
        }
      });

    if (mainError) throw mainError;

    // If this is the first image, create a thumbnail version and update car record
    if (isFirstImage) {
      // Get public URL for main image
      const { data: { publicUrl: mainUrl } } = supabase.storage
        .from('car-images')
        .getPublicUrl(mainPath);

      // Upload the same image as thumbnail (you might want to resize it in the future)
      const { data: thumbData, error: thumbError } = await supabase.storage
        .from('car-images')
        .upload(thumbnailPath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (thumbError) throw thumbError;

      // Get public URL for thumbnail
      const { data: { publicUrl: thumbnailUrl } } = supabase.storage
        .from('car-images')
        .getPublicUrl(thumbnailPath);

      // Update car record with main image and thumbnail URLs
      const { error: updateError } = await supabase
        .from('cars')
        .update({
          image: mainUrl,
          thumbnail: thumbnailUrl
        })
        .eq('id', carId);

      if (updateError) throw updateError;

      // Add entry to car_images table marking it as main image
      const { error: imageError } = await supabase
        .from('car_images')
        .insert({
          car_id: carId,
          url: mainUrl,
          is_main: true,
          display_order: 0
        });

      if (imageError) throw imageError;

      return { mainUrl, thumbnailUrl };
    } else {
      // For additional images, just get the public URL and add to car_images table
      const { data: { publicUrl: galleryUrl } } = supabase.storage
        .from('car-images')
        .getPublicUrl(galleryPath);

      // Get the current highest display order
      const { data: currentImages } = await supabase
        .from('car_images')
        .select('display_order')
        .eq('car_id', carId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = (currentImages?.[0]?.display_order ?? -1) + 1;

      // Add entry to car_images table
      const { error: imageError } = await supabase
        .from('car_images')
        .insert({
          car_id: carId,
          url: galleryUrl,
          is_main: false,
          display_order: nextOrder
        });

      if (imageError) throw imageError;

      return { galleryUrl };
    }
  } catch (error) {
    console.error('Error in uploadCarImage:', error);
    throw error;
  }
}

export async function uploadBrandLogo(file: File, path: string) {
  const { data, error } = await supabase.storage
    .from('brand-logos')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;
  return data;
}

export function getCarImageUrl(path: string) {
  const { data } = supabase.storage
    .from('car-images')
    .getPublicUrl(path);
  
  return data.publicUrl;
}

export function getBrandLogoUrl(path: string) {
  const { data } = supabase.storage
    .from('brand-logos')
    .getPublicUrl(path);
  
  return data.publicUrl;
}
