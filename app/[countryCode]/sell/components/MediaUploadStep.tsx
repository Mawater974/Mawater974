'use client';

import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, Upload, Image as ImageIcon, Star, Check } from 'lucide-react';
import imageCompression from 'browser-image-compression';

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
};

export default function MediaUploadStep({
  onFilesChange,
  t,
  errors,
  initialFiles = [],
  mainPhotoIndex = null,
  onSetMainPhoto,
  onRemoveExistingImage,
}: MediaUploadStepProps) {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
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

  // Compress image with better error handling
  const compressImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) {
      return file;
    }

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        maxIteration: 10,
        fileType: file.type,
      };
      
      const compressedFile = await imageCompression(file, options);
      return compressedFile as File;
    } catch (error) {
      console.error('Error compressing image:', error);
      return file;
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const availableSlots = 10 - (files.length);
    if (availableSlots <= 0) return;

    const filesToProcess = selectedFiles.slice(0, availableSlots);
    
    // Process files synchronously to avoid race conditions
    const processedFiles: ImageFile[] = [];
    
    for (const file of filesToProcess) {
      try {
        // Skip non-image files
        if (!file.type.startsWith('image/')) continue;
        
        // Create a preview URL and track it
        const previewUrl = URL.createObjectURL(file);
        objectUrls.current.add(previewUrl);
        
        // Create the ImageFile object with all necessary properties
        const imageFile: ImageFile = {
          preview: previewUrl,
          isMain: false,
          id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'new',
          raw: file,
          name: file.name,
          size: file.size,
          lastModified: file.lastModified
        };
        
        processedFiles.push(imageFile);
      } catch (error) {
        console.error('Error processing file:', file.name, error);
      }
    }
    
    if (processedFiles.length > 0) {
      const updatedFiles = [...files, ...processedFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    }
    
    // Reset the file input to allow selecting the same file again
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
    e.stopPropagation();
    setIsDragging(false);
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    const availableSlots = 10 - (files.length);
    if (availableSlots <= 0) return;

    const filesToProcess = droppedFiles.slice(0, availableSlots);
    const processedFiles: ImageFile[] = [];
    
    for (const file of filesToProcess) {
      try {
        // Skip non-image files
        if (!file.type.startsWith('image/')) continue;
        
        // Create a preview URL and track it
        const previewUrl = URL.createObjectURL(file);
        objectUrls.current.add(previewUrl);
        
        // Create the ImageFile object with all necessary properties
        const imageFile: ImageFile = {
          preview: previewUrl,
          isMain: false,
          id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'new',
          raw: file,
          name: file.name,
          size: file.size,
          lastModified: file.lastModified
        };
        
        processedFiles.push(imageFile);
      } catch (error) {
        console.error('Error processing dropped file:', file.name, error);
      }
    }
    
    if (processedFiles.length > 0) {
      const updatedFiles = [...files, ...processedFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
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
  const canAddMore = allImages.length < 10;

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
        {t('sell.images.count', { current: allImages.length, max: 10 })}
      </div>

      {/* Error Message */}
      {errors.images && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">
          {errors.images}
        </p>
      )}
    </div>
  );
}