import imageCompression from 'browser-image-compression';

export interface ImageCompressionOptions {
  maxSizeMB: number;        // Max file size in MB (e.g., 0.8 for 800KB)
  maxWidthOrHeight: number; // Max width/height in pixels
  useWebWorker: boolean;    // Use web worker for better performance
  maxIteration: number;     // Max number of compression iterations
  fileType?: string;        // Output file type (e.g., 'image/jpeg', 'image/png')
  initialQuality?: number;  // Initial quality (0-1)
  alwaysKeepResolution?: boolean; // Keep original resolution if true
}

export const DEFAULT_IMAGE_OPTIONS: ImageCompressionOptions = {
  maxSizeMB: 0.8,          // 800KB
  maxWidthOrHeight: 1920,   // Max dimension
  useWebWorker: true,       // Use web worker for better performance
  maxIteration: 10,         // Maximum number of compression iterations
  fileType: 'image/jpeg',   // Output format
  initialQuality: 0.8,      // Initial quality (0-1)
  alwaysKeepResolution: false
};

export const FEATURED_IMAGE_OPTIONS: ImageCompressionOptions = {
  maxSizeMB: 2,            // 2MB for featured ads
  maxWidthOrHeight: 2560,   // Higher resolution for featured ads
  useWebWorker: true,
  maxIteration: 15,         // More iterations for better quality
  fileType: 'image/jpeg',
  initialQuality: 0.9,      // Higher quality for featured ads
  alwaysKeepResolution: true // Keep original resolution if possible
};

/**
 * Compresses an image file if it's larger than the specified threshold
 * @param file The image file to compress
 * @param options Compression options
 * @returns Compressed file or original file if no compression was needed
 */
export async function compressImageIfNeeded(
  file: File,
  options: Partial<ImageCompressionOptions> = {},
  isFeatured: boolean = false
): Promise<File> {
  const MAX_SIZE_BYTES = 800 * 1024; // 800KB in bytes
  
  // Skip compression if file is already under the limit
  if (file.size <= MAX_SIZE_BYTES) {
    return file;
  }

  // Choose the appropriate base options based on whether it's a featured ad
  const baseOptions = isFeatured ? FEATURED_IMAGE_OPTIONS : DEFAULT_IMAGE_OPTIONS;
  
  // Merge base options with any provided options
  const compressionOptions: ImageCompressionOptions = {
    ...baseOptions,
    ...options
  };

  try {
    console.log(`Compressing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    const compressedFile = await imageCompression(file, compressionOptions);
    
    console.log(`Image compressed: ${compressedFile.name} (${(compressedFile.size / 1024 / 1024).toFixed(2)}MB)`);
    
    // Create a new File object with the original name and type
    return new File(
      [compressedFile],
      file.name.replace(/\.[^/.]+$/, '') + '.jpg', // Ensure .jpg extension
      { type: 'image/jpeg' }
    );
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original file if compression fails
    return file;
  }
}

/**
 * Handles multiple image compression
 * @param files Array of files to compress
 * @param options Compression options
 * @returns Array of compressed files
 */
export async function compressImagesIfNeeded(
  files: File[],
  options?: Partial<ImageCompressionOptions>
): Promise<File[]> {
  return Promise.all(
    files.map(file => compressImageIfNeeded(file, options))
  );
}
