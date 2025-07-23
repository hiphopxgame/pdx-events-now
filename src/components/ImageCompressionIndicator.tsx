import React from 'react';
import { Progress } from "@/components/ui/progress";
import { formatFileSize } from "@/lib/imageUtils";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface ImageCompressionIndicatorProps {
  isCompressing: boolean;
  originalSize?: number;
  compressedSize?: number;
  fileName?: string;
  progress?: number;
  error?: string;
}

export const ImageCompressionIndicator: React.FC<ImageCompressionIndicatorProps> = ({
  isCompressing,
  originalSize,
  compressedSize,
  fileName,
  progress = 0,
  error
}) => {
  if (error) {
    return (
      <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-700">{error}</span>
      </div>
    );
  }

  if (isCompressing) {
    return (
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-blue-500" />
          <span className="text-sm text-blue-700">
            Compressing {fileName || 'image'}...
          </span>
        </div>
        {progress > 0 && (
          <Progress value={progress} className="w-full" />
        )}
        {originalSize && (
          <p className="text-xs text-blue-600">
            Original size: {formatFileSize(originalSize)}
          </p>
        )}
      </div>
    );
  }

  if (originalSize && compressedSize) {
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    return (
      <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <div className="flex-1">
          <p className="text-sm text-green-700">
            Compression complete! Reduced by {compressionRatio}%
          </p>
          <p className="text-xs text-green-600">
            {formatFileSize(originalSize)} → {formatFileSize(compressedSize)}
          </p>
        </div>
      </div>
    );
  }

  return null;
};