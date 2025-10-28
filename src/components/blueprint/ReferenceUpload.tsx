'use client';

import React, { useCallback, useState } from 'react';
import { CloudArrowUpIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import type { ReferenceImage } from '../../types/blueprint';

interface ReferenceUploadProps {
  images: ReferenceImage[];
  onImageAdd: (file: File) => void;
  onImageRemove: (imageId: string) => void;
  maxImages?: number;
}

export const ReferenceUpload: React.FC<ReferenceUploadProps> = ({
  images,
  onImageAdd,
  onImageRemove,
  maxImages = 5
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    if (files.length > 0 && images.length < maxImages) {
      setIsUploading(true);
      // Simulate upload delay
      setTimeout(() => {
        onImageAdd(files[0]);
        setIsUploading(false);
      }, 1000);
    }
  }, [images.length, maxImages, onImageAdd]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && images.length < maxImages) {
      setIsUploading(true);
      setTimeout(() => {
        onImageAdd(files[0]);
        setIsUploading(false);
      }, 1000);
    }
  };

  const canUpload = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canUpload && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
            isDragOver
              ? 'border-orange-400 bg-orange-500/10'
              : 'border-slate-600 hover:border-slate-500'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-orange-400 font-medium">Uploading image...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <CloudArrowUpIcon className="h-8 w-8 text-slate-400 mb-3" />
              <p className="text-white font-medium mb-1">
                Drop an image here or click to browse
              </p>
              <p className="text-slate-400 text-sm">
                PNG, JPG, GIF up to 5MB ({images.length}/{maxImages} uploaded)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group aspect-square bg-slate-700/50 rounded-lg overflow-hidden border border-slate-600/50"
            >
              {/* Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.filename}
                className="w-full h-full object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <button
                  onClick={() => onImageRemove(image.id)}
                  className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Filename */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-white text-xs truncate">{image.filename}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !canUpload && (
        <div className="text-center py-8">
          <PhotoIcon className="h-12 w-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-500">No reference images uploaded yet</p>
        </div>
      )}

      {/* Max Images Reached */}
      {!canUpload && images.length > 0 && (
        <div className="text-center py-2">
          <p className="text-slate-400 text-sm">
            Maximum {maxImages} images reached. Remove an image to add another.
          </p>
        </div>
      )}
    </div>
  );
};