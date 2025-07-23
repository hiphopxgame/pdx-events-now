import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, Image } from "lucide-react";
import { 
  compressImage, 
  isValidImageFile, 
  formatFileSize, 
  DEFAULT_COMPRESSION_OPTIONS 
} from "@/lib/imageUtils";
import { ImageCompressionIndicator } from "./ImageCompressionIndicator";
import { useToast } from "@/hooks/use-toast";

export const ImageUploadDemo: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      setError("Please select a valid image file (JPEG, PNG, WebP, or GIF)");
      return;
    }

    setSelectedFile(file);
    setOriginalSize(file.size);
    setCompressedSize(null);
    setCompressedBlob(null);
    setError(null);
  };

  const handleCompress = async () => {
    if (!selectedFile) return;

    try {
      setIsCompressing(true);
      setError(null);
      
      // Compress with event settings (good for demonstration)
      const compressed = await compressImage(selectedFile, DEFAULT_COMPRESSION_OPTIONS.event);
      
      setCompressedBlob(compressed);
      setCompressedSize(compressed.size);
      
      const compressionRatio = ((selectedFile.size - compressed.size) / selectedFile.size * 100).toFixed(1);
      
      toast({
        title: "Compression Complete!",
        description: `File size reduced by ${compressionRatio}% (${formatFileSize(selectedFile.size)} → ${formatFileSize(compressed.size)})`,
      });
      
    } catch (err) {
      console.error('Compression error:', err);
      setError(err instanceof Error ? err.message : "Failed to compress image");
    } finally {
      setIsCompressing(false);
    }
  };

  const downloadCompressed = () => {
    if (!compressedBlob || !selectedFile) return;
    
    const url = URL.createObjectURL(compressedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed_${selectedFile.name.replace(/\.[^/.]+$/, '')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Image Compression Demo
        </CardTitle>
        <CardDescription>
          Test the image compression functionality. Upload a large image to see how it gets optimized for web use.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Selection */}
        <div className="space-y-2">
          <Label htmlFor="demo-upload">Select Image File</Label>
          <Input
            id="demo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
          />
        </div>

        {/* File Info */}
        {selectedFile && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Selected File:</h4>
            <p className="text-sm text-gray-600">Name: {selectedFile.name}</p>
            <p className="text-sm text-gray-600">Size: {formatFileSize(selectedFile.size)}</p>
            <p className="text-sm text-gray-600">Type: {selectedFile.type}</p>
          </div>
        )}

        {/* Compression Status */}
        <ImageCompressionIndicator
          isCompressing={isCompressing}
          originalSize={originalSize || undefined}
          compressedSize={compressedSize || undefined}
          fileName={selectedFile?.name}
          error={error || undefined}
        />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleCompress}
            disabled={!selectedFile || isCompressing}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isCompressing ? 'Compressing...' : 'Compress Image'}
          </Button>
          
          {compressedBlob && (
            <Button
              onClick={downloadCompressed}
              variant="outline"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Compressed
            </Button>
          )}
        </div>

        {/* Compression Settings Info */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <p className="font-medium mb-1">Current Settings (Event Images):</p>
          <p>• Max dimensions: {DEFAULT_COMPRESSION_OPTIONS.event.maxWidth}×{DEFAULT_COMPRESSION_OPTIONS.event.maxHeight}px</p>
          <p>• Quality: {(DEFAULT_COMPRESSION_OPTIONS.event.quality * 100).toFixed(0)}%</p>
          <p>• Max file size: {DEFAULT_COMPRESSION_OPTIONS.event.maxFileSize}MB</p>
          <p>• Output format: JPEG</p>
        </div>
      </CardContent>
    </Card>
  );
};