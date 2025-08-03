'use client';

import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, Upload, Image as ImageIcon, Star, Check } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { toast } from 'react-hot-toast';
import heic2any from 'heic2any';

import { ImageFile } from '@/types/image';

interface ExistingImage {
  url: string;
  id: string;
  isMain?: boolean;
}

type MediaUploadStepProps = {
  onFilesChange: (files: ImageFile[]) => void;
  t: any;
  errors: Record<string, string>;
  initialFiles?: ImageFile[];
  mainPhotoIndex?: number | null;
  onSetMainPhoto: (index: number) => void;
  onRemoveExistingImage?: (id: string) => void;
  isFeatured?: boolean;
};

const MediaUploadStep: React.FC<MediaUploadStepProps> = ({
  onFilesChange,
  t,
  errors,
  initialFiles = [],
  mainPhotoIndex = null,
  onSetMainPhoto,
  onRemoveExistingImage,
  isFeatured = false,
}) => {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const objectUrls = useRef<Set<string>>(new Set());

  // Use a ref to track if we've initialized the files
  const hasInitialized = useRef(false);
  
  // Initialize files from initialFiles
  useEffect(() => {
    // Only initialize once when the component mounts
    if (hasInitialized.current || !initialFiles || initialFiles.length === 0) {
      return;
    }
    
    hasInitialized.current = true;
    
    const initializedFiles = initialFiles.map(file => {
      // If it's already a proper ImageFile with preview, use it as is
      if ('preview' in file && file.preview) {
        // If it's a blob URL, make sure we track it
        if (typeof file.preview === 'string' && 
            (file.preview.startsWith('blob:') || file.preview.startsWith('data:'))) {
          if (!objectUrls.current.has(file.preview)) {
            objectUrls.current.add(file.preview);
          }
        }
        return { ...file };
      }
      
      // If it's a File object, create a preview
      if ('raw' in file && file.raw instanceof File) {
        const previewUrl = URL.createObjectURL(file.raw);
        objectUrls.current.add(previewUrl);
        return {
          preview: previewUrl,
          isMain: false,
          id: file.id || `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: 'new' as const,
          raw: file.raw,
          name: file.raw.name,
          size: file.raw.size,
          lastModified: file.raw.lastModified
        };
      }
      
      // Fallback for any other case
      return file;
    });
    
    setFiles(initializedFiles);
    onFilesChange(initializedFiles);
  }, [initialFiles, onFilesChange]);

  // Initialize files when component mounts
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      const initializedFiles = initialFiles.map(file => {
        // If it's a File object, create a preview
        if (file instanceof File) {
          return {
            preview: URL.createObjectURL(file),
            isMain: false,
            id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: 'new' as const,
            raw: file,
            name: file.name,
            size: file.size,
            lastModified: file.lastModified
          };
        }
        // If it's an ImageFile with raw data
        else if ('raw' in file && file.raw instanceof File) {
          return {
            preview: URL.createObjectURL(file.raw),
            isMain: false,
            id: file.id || `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: file.type || 'new' as const,
            raw: file.raw,
            name: file.name,
            size: file.size,
            lastModified: file.lastModified
          };
        }
        // If it's an ImageFile with preview URL
        else if ('preview' in file && file.preview) {
          // Create a temporary File object with the preview URL
          const fileName = file.preview.split('/').pop() || 'image.jpg';
          const tempFile = new File([], fileName, {
            type: 'image/jpeg'
          });
          return {
            preview: file.preview,
            isMain: false,
            id: file.id || `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: file.type || 'new' as const,
            raw: tempFile,
            name: fileName,
            size: 0,
            lastModified: Date.now()
          };
        }
        // Fallback case
        return {
          preview: '',
          isMain: false,
          id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: 'new' as const,
          raw: new File([], 'temp.jpg', { type: 'image/jpeg' }),
          name: 'temp.jpg',
          size: 0,
          lastModified: Date.now()
        };
      });
      setFiles(initializedFiles);
    } else {
      setFiles([]);
    }
  }, [initialFiles]);

  // Image upload limits
  const MAX_IMAGES = isFeatured ? 15 : 10;
  
  // Supported image MIME types
  const SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/svg+xml',
    'image/avif',
    'image/apng',
    'image/heic',
    'image/heif',
    'image/heic-sequence',
    'image/heif-sequence',
    'image/x-heic',
    'image/x-heif'
  ];

  // Get file extension from MIME type
  const getFileExtension = (mimeType: string): string => {
    const extensionMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/bmp': 'bmp',
      'image/tiff': 'tiff',
      'image/svg+xml': 'svg',
      'image/avif': 'avif',
      'image/apng': 'apng',
      'image/heic': 'heic',
      'image/heif': 'heif',
      'image/heic-sequence': 'heic',
      'image/heif-sequence': 'heif',
      'image/x-heic': 'heic',
      'image/x-heif': 'heif'
    };
    return extensionMap[mimeType.toLowerCase()] || 'jpg';
  };

  // Convert HEIC/HEIF to JPEG for better compatibility
  const convertHeicToJpeg = async (file: File): Promise<File> => {
    try {
      const jpegBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9
      }) as Blob;
      
      return new File(
        [jpegBlob],
        file.name.replace(/\.[^/.]+$/, '.jpg'),
        { type: 'image/jpeg', lastModified: Date.now() }
      );
    } catch (error) {
      console.error('Error converting HEIC/HEIF to JPEG:', error);
      return file; // Return original if conversion fails
    }
  };

  // Compress image with optimized settings
  const compressImage = async (file: File): Promise<File> => {
    const fileType = file.type.toLowerCase();
    
    // Skip non-image files or unsupported image types
    if (!fileType.startsWith('image/') || !SUPPORTED_IMAGE_TYPES.includes(fileType)) {
      console.warn(`Unsupported file type: ${fileType}. File will be uploaded as-is.`);
      return file;
    }
    
    // Convert HEIC/HEIF to JPEG first
    let processedFile = file;
    if (fileType.includes('heic') || fileType.includes('heif')) {
      processedFile = await convertHeicToJpeg(file);
    }
    
    // Get isFeatured from component props or fallback to URL check
    const isFeaturedListing = isFeatured || 
                            window.location.pathname.includes('featured') || 
                            new URLSearchParams(window.location.search).has('featured');

    try {
      const options = isFeaturedListing ? {
        // Higher quality settings for featured listings
        maxSizeMB: 1.0, // Larger max size for better quality
        maxWidthOrHeight: 2560, // Higher resolution for featured
        useWebWorker: true,
        maxIteration: 15,
        fileType: 'image/webp', // Convert to WebP for better compression (except SVGs)
        initialQuality: 0.95, // Higher quality for featured
        alwaysKeepResolution: true,
        onProgress: (progress: number) => {
          console.log(`Featured image compression progress: ${Math.round(progress)}%`);
        },
        preserveExif: false,
      } : {
        // Standard compression for regular listings
        maxSizeMB: 0.6,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        maxIteration: 15,
        fileType: 'image/webp', // Convert to WebP for better compression (except SVGs)
        initialQuality: 0.90,
        alwaysKeepResolution: true,
        onProgress: (progress: number) => {
          console.log(`Standard image compression progress: ${Math.round(progress)}%`);
        },
        preserveExif: false,
      };
      
      console.log('Original file name:', file.name);
      console.log('Original file type:', file.type);
      console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      
      const compressedBlob = await imageCompression(processedFile, options) as Blob;
      
      // Determine output format (convert all to webp for better compression, except for SVG)
      const outputFormat = fileType === 'image/svg+xml' ? 'image/svg+xml' : 'image/webp';
      const extension = getFileExtension(outputFormat);
      
      // Create a new File object with the correct MIME type and extension
      const compressedFile = new File(
        [compressedBlob],
        `${file.name.replace(/\.[^/.]+$/, '')}.${extension}`, // Preserve original name, update extension
        { 
          type: outputFormat,
          lastModified: Date.now()
        }
      );
      
      console.log('Compressed file type:', compressedFile.type);
      console.log('Compressed file size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
      console.log('Compression ratio:', ((file.size - compressedFile.size) / file.size * 100).toFixed(2) + '%');
      
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      // In case of error, return the original file
      return file;
    }
  };

  // Helper function to process files with proper error handling

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    const maxAllowed = isFeatured ? 15 : 10;
    const currentFileCount = selectedFiles.length + files.length;
    
    if (files.length >= maxAllowed) {
      toast.error(t('sell.images.maxReached', { max: maxAllowed }), {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }

    if (currentFileCount > maxAllowed) {
      const canAdd = maxAllowed - files.length;
      toast.error(t('sell.images.tooMany', { 
        max: maxAllowed,
        current: files.length,
        canAdd: canAdd,
        s: canAdd === 1 ? '' : 's' // For pluralization
      }), {
        duration: 4000,
        position: 'top-center',
      });
      
      // If we can still add some files, adjust the selection
      if (canAdd > 0) {
        await processFiles(selectedFiles.slice(0, canAdd));
      }
      return;
    }

    await processFiles(selectedFiles);
    
    // Process files asynchronously
    setIsLoading(true);
    
    try {
      const processedFiles = await Promise.all(
        filesToProcess.map(async (file) => {
          try {
            // Skip non-image files
            if (!file.type.startsWith('image/')) return null;
            
            // Compress the image first
            const compressedFile = await compressImage(file);
            
            // Create a preview URL from the compressed file
            const previewUrl = URL.createObjectURL(compressedFile);
            objectUrls.current.add(previewUrl);
            
            // Create the ImageFile object with the compressed file
            const imageFile: ImageFile = {
              preview: previewUrl,
              isMain: false,
              id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'new',
              raw: compressedFile,
              name: compressedFile.name,
              size: compressedFile.size,
              lastModified: compressedFile.lastModified
            };
            
            return imageFile;
          } catch (error) {
            console.error('Error processing file:', file.name, error);
            return null;
          }
        })
      );
      
      // Filter out any null values from failed processing
      const validFiles = processedFiles.filter((file): file is ImageFile => file !== null);
      
      if (validFiles.length > 0) {
        const updatedFiles = [...files, ...validFiles];
        setFiles(updatedFiles);
        onFilesChange(updatedFiles);
      }
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Error processing files. Please try again.');
    } finally {
      setIsLoading(false);
    }
    
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    const maxAllowed = isFeatured ? 15 : 10;
    const currentFileCount = droppedFiles.length + files.length;
    
    if (files.length >= maxAllowed) {
      toast.error(t('sell.images.maxReached', { max: maxAllowed }), {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }

    if (currentFileCount > maxAllowed) {
      const canAdd = maxAllowed - files.length;
      toast.error(t('sell.images.tooMany', { 
        max: maxAllowed,
        current: files.length,
        canAdd: canAdd,
        s: canAdd === 1 ? '' : 's' // For pluralization
      }), {
        duration: 4000,
        position: 'top-center',
      });
      
      // If we can still add some files, adjust the selection
      if (canAdd > 0) {
        await processFiles(droppedFiles.slice(0, canAdd));
      }
      return;
    }

    await processFiles(droppedFiles);
  };

  // Helper function to process files with proper error handling
  const processFiles = async (filesToProcess: File[]) => {
    if (filesToProcess.length === 0) return;
    
    setIsLoading(true);
    
    try {
      const processedFiles = await Promise.all(
        filesToProcess.map(async (file) => {
          try {
            // Skip non-image files
            if (!file.type.startsWith('image/')) return null;
            
            // Compress the image first
            const compressedFile = await compressImage(file);
            
            // Create a preview URL from the compressed file
            const previewUrl = URL.createObjectURL(compressedFile);
            objectUrls.current.add(previewUrl);
            
            // Create the ImageFile object with the compressed file
            const imageFile: ImageFile = {
              preview: previewUrl,
              isMain: false,
              id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'new',
              raw: compressedFile,
              name: compressedFile.name,
              size: compressedFile.size,
              lastModified: compressedFile.lastModified
            };
            
            return imageFile;
          } catch (error) {
            console.error('Error processing dropped file:', file.name, error);
            return null;
          }
        })
      );
      
      // Filter out any null values from failed processing
      const validFiles = processedFiles.filter((file): file is ImageFile => file !== null);
      
      if (validFiles.length > 0) {
        const updatedFiles = [...files, ...validFiles];
        setFiles(updatedFiles);
        onFilesChange(updatedFiles);
      }
    } catch (error) {
      console.error('Error processing dropped files:', error);
      toast.error('Error processing dropped files. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove image
  const removeImage = (id: string, index: number) => {
    setFiles(prevFiles => {
      const updatedFiles = prevFiles.filter(file => file.id !== id);
      onFilesChange(updatedFiles);
      
      // Get the preview URL to revoke
      const fileToRemove = prevFiles.find(file => file.id === id);
      if (fileToRemove?.preview && typeof fileToRemove.preview === 'string' && 
          (fileToRemove.preview.startsWith('blob:') || fileToRemove.preview.startsWith('data:'))) {
        URL.revokeObjectURL(fileToRemove.preview);
        objectUrls.current.delete(fileToRemove.preview);
      }
      
      // If the removed image was the main photo, set the first image as main
      if (index === mainPhotoIndex) {
        onSetMainPhoto(0);
      } else if (index < mainPhotoIndex!) {
        // Adjust main photo index if needed
        onSetMainPhoto(mainPhotoIndex! - 1);
      }
      
      return updatedFiles;
    });
  };

  // Set as main image
  const setAsMain = (index: number) => {
    onSetMainPhoto(index);
  };



  // Combine existing and new images
  const allImages = useMemo(() => {
    return [...files.map((file, index) => ({
      ...file,
      isMain: index === mainPhotoIndex
    }))];
  }, [files, mainPhotoIndex]);
  
  // Set first image as main by default if no main image is set
  useEffect(() => {
    if (allImages.length > 0 && mainPhotoIndex === null) {
      onSetMainPhoto(0);
    }
  }, [allImages.length, mainPhotoIndex, onSetMainPhoto]);

  // Check if we can add more images
  const canAddMore = allImages.length < MAX_IMAGES;

  // Get number suffix for main photo position (1st, 2nd, 3rd, etc.)
  const getNumberSuffix = (number: number) => {
    const lastDigit = number % 10;
    const lastTwoDigits = number % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return 'th';
    }
    
    switch (lastDigit) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('sell.images.title')}
        </h2>
        <p className="mt-1 text-gray-600 dark:text-gray-300">
          {t('sell.images.subtitle')}
        </p>
      </div>

      {/* Main Photo Guidance */}
      {allImages.length > 0 && (
        <div className="mt-8">             
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {mainPhotoIndex === null 
                ? t('sell.images.selectMain')
                : t('sell.images.mainSelected', { 
                    number: mainPhotoIndex + 1,
                    suffix: getNumberSuffix(mainPhotoIndex + 1)
                  })
              }
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {allImages.map((image, index) => {
              const isMain = index === mainPhotoIndex;
              return (
                <div 
                  key={image.id}
                  className={`relative border-4 rounded-lg overflow-hidden transition-all duration-300 ease-in-out ${
                    isMain
                      ? 'border-qatar-maroon shadow-lg scale-105' 
                      : 'border-[#2a3441] hover:border-gray-600 dark:border-gray-700'
                  }`}
                >
                  <img 
                    src={image.preview} 
                    alt={`Car image ${index + 1}`} 
                    className="w-full h-40 object-cover"
                  />
                  
                  {/* Main Photo Badge */}
                  {isMain && (
                    <div className="absolute top-2 left-2 bg-qatar-maroon text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      {t('sell.images.mainPhoto')}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between p-2 bg-[#1e2530]/90">
                    {/* Set as Main Photo Button */}
                    {!isMain && (
                      <button
                        type="button"
                        onClick={() => setAsMain(index)}
                        className="bg-qatar-maroon text-white px-3 py-1.5 rounded-md text-xs 
                          transition-all duration-300 ease-in-out 
                          transform hover:scale-105 hover:shadow-lg 
                          active:scale-95 
                          focus:outline-none focus:ring-2 focus:ring-qatar-maroon/50"
                      >
                        <div className="flex items-center justify-center gap-1 rtl:flex-row-reverse">
                          <Star className="h-4 w-4" />
                          {t('sell.images.setMainBtn')}
                        </div>
                      </button>
                    )}

                    {/* Remove Image Button */}
                    <button
                      type="button"
                      onClick={() => removeImage(image.id, index)}
                      className="bg-[#2a3441] text-white px-3 py-1.5 rounded-md text-xs 
                        transition-all duration-300 ease-in-out 
                        transform hover:scale-105 hover:shadow-lg 
                        active:scale-95 
                        focus:outline-none focus:ring-2 focus:ring-gray-500/50 
                        hover:bg-[#323d4d] ml-auto rtl:mr-auto rtl:ml-0"
                    >
                      <div className="flex items-center justify-center gap-1 rtl:flex-row-reverse">
                        <Trash2 className="h-4 w-4" />
                        {t('common.remove')}
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Area when no images */}
      {allImages.length === 0 && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-600 rounded-lg bg-[#2a3441] hover:bg-[#323d4d] transition-colors group"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="h-12 w-12 mb-4 text-gray-400 group-hover:text-qatar-maroon transition-colors" />
            <p className="mb-2 text-sm text-gray-400 group-hover:text-white transition-colors">
              <span className="font-semibold group-hover:text-qatar-maroon">{t('sell.images.drag')}</span>
            </p>
            <p className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
              {t('sell.images.formats')}
            </p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
          />
        </div>
      )}

      {/* Add More Photos Button */}
      {allImages.length > 0 && (
        <div className="mt-6 text-center">
          {canAddMore ? (
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-qatar-maroon hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              {t('sell.images.addMore')}
            </button>
          ) : (
            <p className="text-sm text-gray-400">{t('sell.images.maxReached')}</p>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={!canAddMore}
          />
        </div>
      )}

      {/* Photo Count */}
      <div className="text-center text-sm text-gray-400 mt-2">
        {t('sell.images.count', { 
          current: allImages.length, 
          max: isFeatured ? 15 : 10 
        })}
        {allImages.length > (isFeatured ? 15 : 10) && (
          <span className="text-red-500 ml-2">
            {t('sell.images.exceeded', { max: isFeatured ? 15 : 10 })}
          </span>
        )}
      </div>

      {/* Error Message */}
      {errors.images && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">
          {errors.images}
        </p>
      )}
    </div>
  );
};

export default MediaUploadStep;