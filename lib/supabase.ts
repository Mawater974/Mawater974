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

// Create admin client with service role key for admin operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations may fail.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to create a thumbnail from a file
async function createThumbnail(file: File): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 300; // Thumbnail max dimension
        let width = img.width;
        let height = img.height;

        // Calculate dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert back to file
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbFile = new File([blob], `thumb_${file.name}`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(thumbFile);
          }
        }, 'image/jpeg', 0.7); // 0.7 quality for smaller file size
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadCarImage(file: File, carId: number, isFirstImage: boolean = false) {
  try {
    const fileExt = file.type.split('/')[1] || 'jpg';
    const timestamp = Date.now();
    const folderPath = `${carId}`;
    
    // Generate unique file paths
    const originalPath = `${folderPath}/${timestamp}_original.${fileExt}`;
    const thumbnailPath = `${folderPath}/${timestamp}_thumb.jpg`; // Always use jpg for thumbnails

    // Upload the original (high resolution) image
    const { error: originalError } = await supabase.storage
      .from('car-images')
      .upload(originalPath, file, {
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

    if (originalError) throw originalError;

    // Create and upload thumbnail
    const thumbnailFile = await createThumbnail(file);
    const { error: thumbError } = await supabase.storage
      .from('car-images')
      .upload(thumbnailPath, thumbnailFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg'
      });

    if (thumbError) throw thumbError;

    // Get public URLs
    const { data: { publicUrl: imageUrl } } = supabase.storage
      .from('car-images')
      .getPublicUrl(originalPath);

    const { data: { publicUrl: thumbnailUrl } } = supabase.storage
      .from('car-images')
      .getPublicUrl(thumbnailPath);

    // Update car record if it's the first/main image
    if (isFirstImage) {
      const { error: updateError } = await supabase
        .from('cars')
        .update({
          image: imageUrl,
          thumbnail: thumbnailUrl
        })
        .eq('id', carId);

      if (updateError) throw updateError;
    }

    // Get the next display order
    const { data: currentImages } = await supabase
      .from('car_images')
      .select('display_order')
      .eq('car_id', carId)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (currentImages?.[0]?.display_order ?? -1) + 1;

    // Add entry to car_images table with both URLs
    const { error: imageError } = await supabase
      .from('car_images')
      .insert({
        car_id: carId,
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
        is_main: isFirstImage,
        display_order: nextOrder
      });

    if (imageError) throw imageError;

    return {
      imageUrl,
      thumbnailUrl,
      isMain: isFirstImage
    };
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

// Get the appropriate image URL with fallback to image_url if thumbnail_url is null
export function getCarImageUrl(image: { image_url: string; thumbnail_url: string | null }, type: 'full' | 'thumb' = 'full'): string {
  if (type === 'thumb') {
    // For thumbnails, return thumbnail_url if available, otherwise fall back to image_url
    return image.thumbnail_url || image.image_url || '/images/car-placeholder.jpg';
  }
  // For full size, always return image_url with fallback to placeholder
  return image.image_url || '/images/car-placeholder.jpg';
}

export function getBrandLogoUrl(path: string) {
  const { data } = supabase.storage
    .from('brand-logos')
    .getPublicUrl(path);
  
  return data.publicUrl;
}
