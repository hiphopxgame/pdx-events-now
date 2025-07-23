/**
 * Image compression and resizing utilities
 * Handles large file uploads by compressing them while maintaining quality
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxFileSize?: number; // in MB
  format?: 'jpeg' | 'webp' | 'png';
}

export interface ImageDimensions {
  width: number;
  height: number;
}

// Default compression options for different use cases
export const DEFAULT_COMPRESSION_OPTIONS = {
  profile: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.85,
    maxFileSize: 2,
    format: 'jpeg' as const
  },
  event: {
    maxWidth: 1200,
    maxHeight: 800,
    quality: 0.9,
    maxFileSize: 5,
    format: 'jpeg' as const
  },
  venue: {
    maxWidth: 1200,
    maxHeight: 800,
    quality: 0.9,
    maxFileSize: 5,
    format: 'jpeg' as const
  },
  gallery: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.92,
    maxFileSize: 8,
    format: 'jpeg' as const
  }
};

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
export function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): ImageDimensions {
  const aspectRatio = originalWidth / originalHeight;

  let newWidth = originalWidth;
  let newHeight = originalHeight;

  // Scale down if image is larger than max dimensions
  if (originalWidth > maxWidth || originalHeight > maxHeight) {
    if (aspectRatio > 1) {
      // Landscape orientation
      newWidth = Math.min(maxWidth, originalWidth);
      newHeight = newWidth / aspectRatio;
      
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * aspectRatio;
      }
    } else {
      // Portrait orientation
      newHeight = Math.min(maxHeight, originalHeight);
      newWidth = newHeight * aspectRatio;
      
      if (newWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = newWidth / aspectRatio;
      }
    }
  }

  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight)
  };
}

/**
 * Load image file into HTMLImageElement
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convert canvas to blob with specified format and quality
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: string = 'image/jpeg',
  quality: number = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      format,
      quality
    );
  });
}

/**
 * Compress and resize an image file
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1200,
    maxHeight = 800,
    quality = 0.9,
    maxFileSize = 5,
    format = 'jpeg'
  } = options;

  // Check if file is already small enough and doesn't need resizing
  const fileSizeInMB = file.size / (1024 * 1024);
  
  // Load the image
  const img = await loadImageFromFile(file);
  
  // Calculate optimal dimensions
  const dimensions = calculateOptimalDimensions(
    img.naturalWidth,
    img.naturalHeight,
    maxWidth,
    maxHeight
  );

  // Check if we need to process the image at all
  const needsResizing = dimensions.width < img.naturalWidth || dimensions.height < img.naturalHeight;
  const needsCompression = fileSizeInMB > maxFileSize;
  const needsFormatConversion = !file.type.includes(format);

  if (!needsResizing && !needsCompression && !needsFormatConversion) {
    // Return original file if no processing needed
    return file;
  }

  // Create canvas for image processing
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Set canvas dimensions
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  // Enable image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw the resized image
  ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

  // Clean up the object URL
  URL.revokeObjectURL(img.src);

  // Convert to blob with specified format and quality
  const mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
  let compressedBlob = await canvasToBlob(canvas, mimeType, quality);

  // If still too large, reduce quality incrementally
  let currentQuality = quality;
  const minQuality = 0.5;
  const qualityStep = 0.1;

  while (compressedBlob.size / (1024 * 1024) > maxFileSize && currentQuality > minQuality) {
    currentQuality -= qualityStep;
    compressedBlob = await canvasToBlob(canvas, mimeType, currentQuality);
  }

  // If still too large after quality reduction, try reducing dimensions further
  if (compressedBlob.size / (1024 * 1024) > maxFileSize) {
    const reductionFactor = 0.8;
    const newWidth = Math.round(dimensions.width * reductionFactor);
    const newHeight = Math.round(dimensions.height * reductionFactor);
    
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, newWidth, newHeight);
    
    compressedBlob = await canvasToBlob(canvas, mimeType, currentQuality);
  }

  return compressedBlob;
}

/**
 * Compress multiple images in parallel
 */
export async function compressImages(
  files: File[],
  options: ImageCompressionOptions = {}
): Promise<Blob[]> {
  const compressionPromises = files.map(file => compressImage(file, options));
  return Promise.all(compressionPromises);
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Validate image file type
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  return validTypes.includes(file.type.toLowerCase());
}

/**
 * Create a File object from a Blob with a specific name
 */
export function createFileFromBlob(blob: Blob, originalFileName: string, format: string): File {
  const extension = format === 'jpeg' ? 'jpg' : format;
  const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '');
  const newFileName = `${nameWithoutExt}_compressed.${extension}`;
  
  return new File([blob], newFileName, { 
    type: blob.type,
    lastModified: Date.now()
  });
}