'use client';

import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, Upload, Image as ImageIcon, Star, Check, Loader2 } from 'lucide-react';
import { DraggableImage } from '@/components/DraggableImage';
import imageCompression from 'browser-image-compression';
import { toast } from 'react-hot-toast';
import heic2any from 'heic2any';
import { useCountry } from '@/contexts/CountryContext';
import { ImageFile } from '@/types/image';
import { scrollToTop } from '@/utils/scrollToTop';

interface ExistingImage {
  url: string;
  id: string;
  isMain?: boolean;
}

type MediaUploadStepProps = {
  onFilesChange: (files: ImageFile[]) => void;
  onNext: () => void;
  onBack?: () => void; // Add onBack prop
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
  onNext,
  onBack,
  t,
  errors: propErrors,
  initialFiles = [],
  mainPhotoIndex = null,
  onSetMainPhoto,
  onRemoveExistingImage,
  isFeatured = false,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>(propErrors || {});
  const [showErrors, setShowErrors] = useState(false);
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { currentCountry } = useCountry();
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

  // Generate optimized image with specific settings
  const generateOptimizedImage = async (file: File, options: any): Promise<File> => {
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
    
    try {
      console.log(`Processing ${options.purpose} version: ${file.name}`);
      console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      
      const compressedBlob = await imageCompression(processedFile, options) as Blob;
      
      // Determine output format (convert all to webp for better compression, except for SVG)
      const outputFormat = fileType === 'image/svg+xml' ? 'image/svg+xml' : 'image/webp';
      const extension = getFileExtension(outputFormat);
      
      // Create a new File object with the correct MIME type and extension
      const optimizedFile = new File(
        [compressedBlob],
        `${file.name.replace(/\.[^/.]+$/, '')}${options.suffix || ''}.${extension}`,
        { 
          type: outputFormat,
          lastModified: Date.now()
        }
      );
      
      console.log(`Optimized ${options.purpose} file size:`, (optimizedFile.size / 1024).toFixed(2), 'KB');
      console.log(`Compression ratio (${options.purpose}):`, ((file.size - optimizedFile.size) / file.size * 100).toFixed(2) + '%');
      
      return optimizedFile;
    } catch (error) {
      console.error(`Error generating ${options.purpose} version:`, error);
      return file; // Return original if optimization fails
    }
  };

  // Generate both high-res and thumbnail versions of the image
  const compressImage = async (file: File): Promise<{ original: File; thumbnail: File }> => {
    const fileType = file.type.toLowerCase();
    const isSvg = fileType === 'image/svg+xml';
    
    // Skip processing for SVGs or unsupported types
    if (isSvg || !fileType.startsWith('image/') || !SUPPORTED_IMAGE_TYPES.includes(fileType)) {
      return { original: file, thumbnail: file };
    }
    
    // Check if this is a featured listing
    const isFeaturedListing = isFeatured || 
                            window.location.pathname.includes('featured') || 
                            new URLSearchParams(window.location.search).has('featured');
    
    // High-res image settings
    const highResOptions = {
      maxSizeMB: isFeaturedListing ? 1.0 : 0.8,
      maxWidthOrHeight: isFeaturedListing ? 2560 : 1920,
      useWebWorker: true,
      maxIteration: 15,
      fileType: 'image/webp',
      initialQuality: isFeaturedListing ? 0.85 : 0.80,
      alwaysKeepResolution: true,
      purpose: 'high-res',
      suffix: ''
    };
    
    // Thumbnail settings
    const thumbnailOptions = {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 400,
      useWebWorker: true,
      maxIteration: 10,
      fileType: 'image/webp',
      initialQuality: 0.70,
      alwaysKeepResolution: false,
      purpose: 'thumbnail',
      suffix: '_thumb'
    };
    
    try {
      // Process both versions in parallel
      const [highResFile, thumbnailFile] = await Promise.all([
        generateOptimizedImage(file, highResOptions),
        generateOptimizedImage(file, thumbnailOptions)
      ]);
      
      return { original: highResFile, thumbnail: thumbnailFile };
    } catch (error) {
      console.error('Error processing image versions:', error);
      // Fallback to original file if processing fails
      return { original: file, thumbnail: file };
    }
  };

  // Helper function to process files with proper error handling

  const validateFields = () => {
    const newErrors: Record<string, string> = {};
    
    if (files.length === 0) {
      newErrors.images = t('errors.images_required');
    }
    
    setErrors(newErrors);
    setShowErrors(Object.keys(newErrors).length > 0);
    
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateFields()) {
      onNext();
      scrollToTop();
    } else {
      scrollToTop();
    }
  };
  
  // Scroll to top on component mount
  useEffect(() => {
    scrollToTop();
  }, []);

  // Process files (used for both drag & drop and file input)
  const processFiles = async (filesToProcess: File[]) => {
    if (!filesToProcess || filesToProcess.length === 0) return;
    
    setIsLoading(true);
    
    try {
      const processedFiles = await Promise.all(
        filesToProcess.map(async (file) => {
          try {
            // Skip non-image files
            if (!file.type.startsWith('image/')) return null;
            
            // Generate both high-res and thumbnail versions
            const { original: highResFile, thumbnail: thumbnailFile } = await compressImage(file);
            
            // Create preview URLs
            const previewUrl = URL.createObjectURL(highResFile);
            const thumbnailUrl = URL.createObjectURL(thumbnailFile);
            
            // Store object URLs for cleanup
            objectUrls.current.add(previewUrl);
            objectUrls.current.add(thumbnailUrl);
            
            // Create the ImageFile object with both versions
            const imageFile: ImageFile = {
              preview: previewUrl,
              thumbnailUrl: thumbnailUrl, // Store thumbnail URL separately
              isMain: false,
              id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'new',
              raw: highResFile, // Store the high-res file as raw
              thumbnailRaw: thumbnailFile, // Store the thumbnail file
              name: highResFile.name.replace('_thumb', ''), // Remove _thumb suffix for display
              size: highResFile.size,
              lastModified: highResFile.lastModified,
              originalName: file.name // Store original filename
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
      toast.error(t('errors.image_processing_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;
    
    // Clear any existing errors when new files are selected
    if (errors.images) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
      setShowErrors(false);
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

    // Process the selected files
    await processFiles(selectedFiles);
    
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

  // Move image in the array
  const moveImage = useCallback((dragIndex: number, hoverIndex: number) => {
    setFiles((prevFiles) => {
      const newFiles = [...prevFiles];
      const [movedFile] = newFiles.splice(dragIndex, 1);
      newFiles.splice(hoverIndex, 0, movedFile);
      
      // If we're moving to the first position, update main photo
      if (hoverIndex === 0) {
        onSetMainPhoto(0);
      } else if (dragIndex < mainPhotoIndex! && hoverIndex >= mainPhotoIndex!) {
        onSetMainPhoto(mainPhotoIndex! - 1);
      } else if (dragIndex > mainPhotoIndex! && hoverIndex <= mainPhotoIndex!) {
        onSetMainPhoto(mainPhotoIndex! + 1);
      }
      
      onFilesChange(newFiles);
      return newFiles;
    });
  }, [mainPhotoIndex, onFilesChange, onSetMainPhoto]);

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

  // Set as main image - always set to first photo
  const setAsMain = (index: number) => {
    if (index !== 0) {
      // Move the selected photo to the first position
      moveImage(index, 0);
    }
    onSetMainPhoto(0);
  };

  // Combine existing and new images
  const allImages = useMemo(() => {
    return [...files.map((file, index) => ({
      ...file,
      isMain: index === 0 // Always make the first photo the main one
    }))];
  }, [files]);
  
  // Ensure first image is always set as main
  useEffect(() => {
    if (allImages.length > 0 && mainPhotoIndex !== 0) {
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
    <form onSubmit={handleNext} className="space-y-6">
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

          <DndProvider backend={HTML5Backend}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {allImages.map((image, index) => (
                <DraggableImage
                  key={image.id}
                  id={image.id}
                  index={index}
                  preview={image.preview}
                  isMain={index === mainPhotoIndex}
                  onRemove={removeImage}
                  onSetMain={setAsMain}
                  moveImage={moveImage}
                  t={t}
                  totalImages={allImages.length}
                />
              ))}
            </div>
          </DndProvider>
        </div>
      )}

      {/* Upload Area when no images */}
      {allImages.length === 0 && (
        <div 
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`cursor-pointer flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-600 rounded-lg bg-white dark:bg-[#2a3441] transition-colors group ${
            isLoading ? 'opacity-70' : 'hover:bg-[white] dark:hover:bg-[#323d4d]'
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 mb-4 text-qatar-maroon animate-spin" />
                <p className="text-sm text-gray-400">{t('sell.images.uploading')}</p>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mb-4 text-gray-400 group-hover:text-qatar-maroon transition-colors" />
                <p className="mb-2 text-sm text-gray-400 group-hover:text-white">
                  <span className="font-semibold group-hover:text-qatar-maroon">
                    {t('sell.images.drag')}
                  </span>
                </p>
                <p className="text-xs text-gray-500 group-hover:text-qatar-maroon">
                  {t('sell.images.formats')}
                </p>
              </>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            disabled={isLoading}
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
              onClick={() => !isLoading && fileInputRef.current?.click()}
              disabled={isLoading}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-qatar-maroon focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon ${
                isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-qatar-maroon/90'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 ml-2 animate-spin" />
                  {t('sell.images.uploading')}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  {t('sell.images.addMore')}
                </>
              )}
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
            disabled={!canAddMore || isLoading}
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
      {/* Error Message */}
      {showErrors && Object.keys(errors).length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {t('errors.required_fields')}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {Object.values(errors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        {onBack && (
          <Button 
            type="button"
            variant="outline"
            onClick={() => {
              onBack();
              scrollToTop();
            }}
            className="flex items-center gap-2 hover:shadow-md"
          >
            {t('common.back')}
          </Button>
        )}
        <Button 
          type="submit"
          className="bg-qatar-maroon hover:bg-qatar-maroon/90 text-white ml-auto hover:shadow-md"
        >
          {t('common.next')}
        </Button>
      </div>
    </form>
  );
};

export default MediaUploadStep;