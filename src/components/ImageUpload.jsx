'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Check, AlertCircle, Image as ImageIcon } from 'lucide-react';

/**
 * ImageUpload Component
 * Drag-and-drop image upload with preview, cropping, and progress indicators
 *
 * @param {Object} props
 * @param {Function} props.onUpload - Callback when upload completes: (url, path) => void
 * @param {string} props.type - Upload type: 'profile', 'portfolio', or 'reference'
 * @param {number} props.maxSize - Max file size in bytes
 * @param {boolean} props.multiple - Allow multiple file upload
 * @param {string} props.aspectRatio - Optional aspect ratio for cropping
 */
export default function ImageUpload({
  onUpload,
  type = 'profile',
  maxSize = 5 * 1024 * 1024, // 5MB default
  multiple = false,
  aspectRatio = null
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef(null);

  // Allowed image types
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  // Validate file
  const validateFile = (file) => {
    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type. Allowed: JPG, PNG, WebP`;
    }

    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `File too large. Maximum: ${maxSizeMB}MB`;
    }

    return null;
  };

  // Generate preview URL
  const generatePreview = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  };

  // Handle file selection
  const handleFiles = useCallback(async (files) => {
    setError(null);
    setSuccess(false);

    const fileArray = Array.from(files);
    const validFiles = [];
    const previewUrls = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      validFiles.push(file);
      const preview = await generatePreview(file);
      previewUrls.push(preview);
    }

    if (!multiple && validFiles.length > 1) {
      setError('Only one file allowed');
      return;
    }

    setSelectedFiles(validFiles);
    setPreviews(previewUrls);
  }, [maxSize, multiple]);

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  // File input change handler
  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  // Trigger file input click
  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  // Remove selected file
  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setError(null);
    setSuccess(false);
  };

  // Clear all files
  const handleClear = () => {
    setSelectedFiles([]);
    setPreviews([]);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
  };

  // Handle upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);

    try {
      // Import storage functions dynamically
      const { uploadVendorProfileImage, uploadVendorPortfolioImage, uploadEventReferenceImage } = await import('@/lib/storage');

      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Upload based on type
      let uploadFn;
      if (type === 'profile') {
        uploadFn = uploadVendorProfileImage;
      } else if (type === 'portfolio') {
        uploadFn = uploadVendorPortfolioImage;
      } else {
        uploadFn = uploadEventReferenceImage;
      }

      // Upload all selected files
      const uploadPromises = selectedFiles.map(file => uploadFn(file));
      const results = await Promise.all(uploadPromises);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Check for errors
      const failedUploads = results.filter(r => !r.success);
      if (failedUploads.length > 0) {
        setError(failedUploads[0].error || 'Upload failed');
        setUploading(false);
        return;
      }

      // Success
      setSuccess(true);
      setUploading(false);

      // Call onUpload callback with results
      if (onUpload) {
        results.forEach(result => {
          onUpload(result.url, result.path);
        });
      }

      // Clear after success
      setTimeout(() => {
        handleClear();
      }, 2000);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClickUpload}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-300
          ${isDragging
            ? 'border-orange-500 bg-orange-500/10 scale-105'
            : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
          }
          ${selectedFiles.length > 0 ? 'mb-4' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedTypes.join(',')}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-3">
          <div className={`
            p-4 rounded-full transition-colors
            ${isDragging ? 'bg-orange-500/20' : 'bg-slate-800'}
          `}>
            <Upload className={`w-8 h-8 ${isDragging ? 'text-orange-500' : 'text-slate-400'}`} />
          </div>

          <div>
            <p className="text-lg font-medium text-white mb-1">
              {isDragging ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-slate-400">
              or click to browse • Max {(maxSize / (1024 * 1024)).toFixed(0)}MB • JPG, PNG, WebP
            </p>
          </div>
        </div>
      </div>

      {/* Preview Grid */}
      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Remove button */}
                {!uploading && !success && (
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                )}

                {/* File name */}
                <p className="mt-2 text-xs text-slate-400 truncate">
                  {selectedFiles[index].name}
                </p>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Uploading...</span>
                <span className="text-orange-500 font-medium">{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-400">Upload successful!</p>
            </div>
          )}

          {/* Action Buttons */}
          {!success && (
            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} ${selectedFiles.length === 1 ? 'File' : 'Files'}`}
              </button>

              <button
                onClick={handleClear}
                disabled={uploading}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
