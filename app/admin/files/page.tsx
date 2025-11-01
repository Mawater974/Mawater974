"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { FileText, Upload, Trash2, Download, Search, FileIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type FileType = {
  id: string;
  name: string;
  path: string;
  size: number;
  mime_type: string | null;
  category: string;
  description: string | null;
  created_at: string;
  url?: string;
};

export default function AdminFilesPage() {
  const { t } = useLanguage();
  const [files, setFiles] = useState<FileType[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploadData, setUploadData] = useState({
    category: 'invoices',
    description: ''
  });

  const supabase = createClient();

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('admin_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get signed URLs for each file
      const filesWithUrls = await Promise.all(
        data.map(async (file: FileType) => {
          const { data: { publicUrl } } = supabase
            .storage
            .from('admin-files')
            .getPublicUrl(file.path);
          
          return {
            ...file,
            url: publicUrl
          } as FileType;
        })
      );

      setFiles(filesWithUrls);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      if (newFiles.length > 10) {
        toast.error('You can upload a maximum of 10 files at once');
        return;
      }
      setFilesToUpload(newFiles);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (filesToUpload.length === 0) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let successCount = 0;
      const totalFiles = filesToUpload.length;

      // Process each file
      for (let i = 0; i < totalFiles; i++) {
        const file = filesToUpload[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${uploadData.category}/${fileName}`;

        try {
          // Update progress
          setUploadProgress(Math.round((i / totalFiles) * 100));
          
          // Upload file to storage
          const { error: uploadError } = await supabase.storage
            .from('admin-files')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) throw uploadError;

          // Create file record in database
          const { error: dbError } = await supabase
            .from('admin_files')
            .insert([
              {
                name: file.name,
                path: filePath,
                size: file.size,
                mime_type: file.type,
                category: uploadData.category,
                description: uploadData.description || null,
                uploaded_by: user.id
              },
            ]);

          if (dbError) throw dbError;
          
          successCount++;
          
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      // Show success message
      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} of ${totalFiles} files`);
      }
      
      // Reset form and refresh file list
      setFilesToUpload([]);
      setUploadData({
        category: 'invoices',
        description: ''
      });
      fetchFiles();
      
    } catch (error) {
      console.error('Error during upload process:', error);
      toast.error('An error occurred during upload');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadFile = async (file: FileType) => {
    // Get the file data
    const { data, error } = await supabase.storage
      .from('admin-files')
      .download(file.path);

    if (error) throw error;
    if (!data) throw new Error('No data received');

    // Create a temporary URL for the blob
    const url = URL.createObjectURL(data);
    
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  const handleDownload = async (file: FileType) => {
    try {
      setDownloadingFileId(file.id);
      await downloadFile(file);
      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedFiles.size === 0) return;
    
    try {
      const filesToDownload = files.filter(file => selectedFiles.has(file.id));
      
      // Download files one by one
      for (const file of filesToDownload) {
        try {
          await downloadFile(file);
          // Small delay between downloads to prevent browser blocking
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Error downloading ${file.name}:`, error);
          toast.error(`Failed to download ${file.name}`);
        }
      }
      
      toast.success(`Started downloading ${filesToDownload.length} files`);
    } catch (error) {
      console.error('Error in bulk download:', error);
      toast.error('Error processing bulk download');
    }
  };

  const deleteFile = async (fileId: string, filePath: string) => {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('admin-files')
      .remove([filePath]);

    if (storageError) throw storageError;

    // Delete from database
    const { error: dbError } = await supabase
      .from('admin_files')
      .delete()
      .eq('id', fileId);

    if (dbError) throw dbError;
  };

  const handleDelete = async (fileId: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingFileId(fileId);
      await deleteFile(fileId, filePath);
      toast.success('File deleted successfully');
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedFiles.size} selected files? This action cannot be undone.`)) {
      return;
    }

    try {
      const filesToDelete = files.filter(file => selectedFiles.has(file.id));
      let successCount = 0;
      
      // Delete files one by one
      for (const file of filesToDelete) {
        try {
          await deleteFile(file.id, file.path);
          successCount++;
        } catch (error) {
          console.error(`Error deleting ${file.name}:`, error);
        }
      }
      
      if (successCount > 0) {
        toast.success(`Deleted ${successCount} of ${filesToDelete.length} files`);
        fetchFiles();
        setSelectedFiles(new Set());
        setIsAllSelected(false);
      } else {
        toast.error('Failed to delete files');
      }
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast.error('Error processing bulk delete');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <FileIcon className="h-4 w-4" />;
    
    if (mimeType.includes('pdf')) {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileText className="h-4 w-4 text-green-600" />;
    } else {
      return <FileIcon className="h-4 w-4" />;
    }
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (file.description && file.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
    setIsAllSelected(newSelection.size === filteredFiles.length && filteredFiles.length > 0);
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(file => file.id)));
    }
    setIsAllSelected(!isAllSelected);
  };

  return (
    <div className="container mx-auto py-6 px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">File Manager</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Upload and manage your files
          </p>
        </div>
        
        {selectedFiles.size > 0 && (
          <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {selectedFiles.size} {selectedFiles.size === 1 ? 'file' : 'files'} selected
            </span>
            <button
              onClick={handleBulkDownload}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={selectedFiles.size === 0}
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </button>
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              disabled={selectedFiles.size === 0}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </button>
            <button
              onClick={() => {
                setSelectedFiles(new Set());
                setIsAllSelected(false);
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Clear selection"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {/* Upload Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upload New File</h2>
            <p className="text-gray-500 dark:text-gray-400">Upload documents, spreadsheets, or other files</p>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300" htmlFor="file">File</label>
                <input
                  className="block w-full text-sm text-gray-500 dark:text-gray-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/50 dark:file:text-blue-300
                    hover:file:bg-blue-100 dark:hover:file:bg-blue-900/70"
                  id="file"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                {filesToUpload.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {filesToUpload.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                        >
                          <span className="sr-only">Remove file</span>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300" htmlFor="category">Category</label>
                <select
                  id="category"
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={uploadData.category}
                  onChange={(e) => setUploadData({...uploadData, category: e.target.value})}
                >
                  <option value="invoices">Invoices</option>
                  <option value="passwords">Passwords</option>
                  <option value="documents">Documents</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300" htmlFor="description">Description (Optional)</label>
              <input
                type="text"
                id="description"
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter a description"
                value={uploadData.description}
                onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                disabled={isUploading}
              />
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={handleUpload}
              disabled={!filesToUpload.length || isUploading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        </div>

        {/* Files List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Files</h2>
              <p className="text-gray-500 dark:text-gray-400">
                {files.length} {files.length === 1 ? 'file' : 'files'} found
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="search"
                  placeholder="Search files..."
                  className="block w-full md:w-64 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="block w-full md:w-48 rounded-md border border-gray-300 dark:border-gray-600 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="invoices">Invoices</option>
                <option value="passwords">Passwords</option>
                <option value="documents">Documents</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No files found</h3>
              <p className="text-sm text-gray-500">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Upload your first file to get started.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="relative w-12 px-6 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
                        checked={isAllSelected && filteredFiles.length > 0}
                        onChange={toggleSelectAll}
                        aria-label={isAllSelected ? 'Deselect all' : 'Select all'}
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Size</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Uploaded</th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredFiles.map((file) => {
                    const isSelected = selectedFiles.has(file.id);
                    return (
                    <tr 
                      key={file.id} 
                      className={`${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''} hover:bg-gray-50 dark:hover:bg-gray-700`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
                            checked={isSelected}
                            onChange={() => toggleFileSelection(file.id)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select ${file.name}`}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                            {getFileIcon(file.mime_type)}
                          </div>
                          <div className="ml-4">
                            <a 
                              href={file.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {file.name}
                            </a>
                            {file.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {file.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {file.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(file.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleDownload(file)}
                            disabled={downloadingFileId === file.id}
                            className={`text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 ${downloadingFileId === file.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={downloadingFileId === file.id ? 'Downloading...' : 'Download'}
                          >
                            {downloadingFileId === file.id ? (
                              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            ) : (
                              <Download className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(file.id, file.path)}
                            disabled={deletingFileId === file.id}
                            className={`text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 ${deletingFileId === file.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={deletingFileId === file.id ? 'Deleting...' : 'Delete'}
                          >
                            {deletingFileId === file.id ? (
                              <div className="animate-spin h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full"></div>
                            ) : (
                              <Trash2 className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
