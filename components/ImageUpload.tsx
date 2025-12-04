import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useLanguage } from '@/contexts/LanguageContext';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ImageUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  loading?: boolean;
  maxFiles?: number;
  initialImages?: string[];
}

export default function ImageUpload({ onUpload, loading = false, maxFiles = 10, initialImages = [] }: ImageUploadProps) {
  const { t } = useLanguage();
  const [uploadedImages, setUploadedImages] = useState<string[]>(initialImages);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0) {
      // Filter and process images
      const validFiles = acceptedFiles.filter(file => {
        const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max
        return isValidType && isValidSize;
      });

      if (validFiles.length > 0) {
        try {
          // Pass the files to parent component for upload
          await onUpload(validFiles);
        } catch (error) {
          console.error('Error processing images:', error);
          toast.error(t('upload.error'));
        }
      } else {
        toast.error(t('upload.invalidFiles'));
      }
    }
  }, [onUpload, t]);

  const removeImage = (indexToRemove: number) => {
    const updatedImages = uploadedImages.filter((_, index) => index !== indexToRemove);
    setUploadedImages(updatedImages);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: loading
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-qatar-maroon bg-qatar-maroon/10'
            : 'border-gray-300 dark:border-gray-600 hover:border-qatar-maroon dark:hover:border-qatar-maroon'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {loading ? (
              <p>{t('upload.uploading')}</p>
            ) : (
              <>
                <p className="font-medium">{t('upload.dragDrop')}</p>
                <p>{t('upload.or')}</p>
                <p className="text-primary-600 dark:text-primary-400 font-medium">
                  {t('upload.browseFiles')}
                </p>
                <p className="mt-1 text-xs">
                  {t('upload.maxFileSize', { size: '5MB' })}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {uploadedImages.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <Image
                  src={image}
                  alt={`Uploaded image ${index + 1}`}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
