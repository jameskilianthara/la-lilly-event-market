import { supabase } from './supabase';

/**
 * Storage utility functions for EventFoundry
 * Handles image uploads to Supabase Storage buckets
 */

// Bucket names
export const STORAGE_BUCKETS = {
  VENDOR_PROFILES: 'vendor-profiles',
  VENDOR_PORTFOLIOS: 'vendor-portfolios',
  EVENT_REFERENCES: 'event-references'
};

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  VENDOR_PROFILES: 5 * 1024 * 1024, // 5MB
  VENDOR_PORTFOLIOS: 10 * 1024 * 1024, // 10MB
  EVENT_REFERENCES: 10 * 1024 * 1024 // 10MB
};

// Allowed MIME types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File, maxSize: number): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    };
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`
    };
  }

  return { valid: true };
}

/**
 * Generate unique filename with timestamp
 */
export function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop();
  return `${timestamp}-${randomStr}.${ext}`;
}

/**
 * Upload vendor profile image (logo or headshot)
 * @param {File} file - Image file to upload
 * @param {string} userId - User ID (from auth)
 * @param {string} type - 'logo' or 'headshot'
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadVendorProfileImage(file: File, userId: string, type: 'logo' | 'headshot' = 'logo'): Promise<{ success: boolean; url?: string; error?: string; path?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  // Validate file
  const validation = validateImageFile(file, FILE_SIZE_LIMITS.VENDOR_PROFILES);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const fileName = generateFileName(file.name);
    const filePath = `${userId}/${type}-${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.VENDOR_PROFILES)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.VENDOR_PROFILES)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
  }
}

/**
 * Upload vendor portfolio image
 * @param {File} file - Image file to upload
 * @param {string} userId - User ID (from auth)
 * @param {string} eventId - Optional event ID for categorization
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadVendorPortfolioImage(file: File, userId: string, eventId: string = 'general'): Promise<{ success: boolean; url?: string; error?: string; path?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  // Validate file
  const validation = validateImageFile(file, FILE_SIZE_LIMITS.VENDOR_PORTFOLIOS);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const fileName = generateFileName(file.name);
    const filePath = `${userId}/${eventId}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.VENDOR_PORTFOLIOS)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.VENDOR_PORTFOLIOS)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
  }
}

/**
 * Upload event reference image (client inspiration)
 * @param {File} file - Image file to upload
 * @param {string} userId - User ID (from auth)
 * @param {string} eventId - Event ID for categorization
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadEventReferenceImage(file: File, userId: string, eventId: string): Promise<{ success: boolean; url?: string; error?: string; path?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  // Validate file
  const validation = validateImageFile(file, FILE_SIZE_LIMITS.EVENT_REFERENCES);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const fileName = generateFileName(file.name);
    const filePath = `${userId}/${eventId}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.EVENT_REFERENCES)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.EVENT_REFERENCES)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
  }
}

/**
 * Delete image from storage
 * @param {string} bucket - Bucket name
 * @param {string} filePath - File path in bucket
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteImage(bucket: string, filePath: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message || 'Delete failed' };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
  }
}

/**
 * List images in a folder
 * @param {string} bucket - Bucket name
 * @param {string} folderPath - Folder path
 * @returns {Promise<{success: boolean, files?: Array, error?: string}>}
 */
export async function listImages(bucket: string, folderPath: string): Promise<{ success: boolean; files?: any[]; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folderPath);

    if (error) {
      console.error('List error:', error);
      return { success: false, error: error.message || 'List failed' };
    }

    return { success: true, files: data };
  } catch (error) {
    console.error('List failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'List failed' };
  }
}

/**
 * Batch upload multiple images
 * @param {FileList|Array<File>} files - Array of files to upload
 * @param {Function} uploadFn - Upload function to use
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<Array<{success: boolean, url?: string, error?: string}>>}
 */
export async function batchUploadImages(files: File[], uploadFn: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>, onProgress?: (current: number, total: number) => void): Promise<Array<{ success: boolean; url?: string; error?: string }>> {
  const results = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const result = await uploadFn(files[i]);
    results.push(result);

    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return results;
}
