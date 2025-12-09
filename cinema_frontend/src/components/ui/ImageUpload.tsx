import React, { useState, useRef } from 'react';
import { Upload, X, Link, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
  accept?: string;
  maxSize?: number; // in MB
}

export function ImageUpload({
  value = '',
  onChange,
  placeholder = 'Enter image URL or upload file',
  className = '',
  accept = 'image/*',
  maxSize = 5
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [urlInput, setUrlInput] = useState(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;

    setIsUploading(true);
    try {
      const response = await fetch('/api/v1/upload/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_url: urlInput.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        onChange(data.url);
      } else {
        alert('Upload failed: ' + data.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/upload/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        onChange(data.url);
        setUrlInput(data.url);
      } else {
        alert('Upload failed: ' + data.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const clearImage = () => {
    onChange('');
    setUrlInput('');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={uploadMode === 'url' ? 'primary' : 'secondary'}
          onClick={() => setUploadMode('url')}
          className="px-3 py-2 text-sm"
        >
          <Link size={16} />
          URL
        </Button>
        <Button
          type="button"
          variant={uploadMode === 'file' ? 'primary' : 'secondary'}
          onClick={() => setUploadMode('file')}
          className="px-3 py-2 text-sm"
        >
          <Upload size={16} />
          Upload
        </Button>
      </div>

      {/* URL Input Mode */}
      {uploadMode === 'url' && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
            disabled={isUploading}
          />
          <Button
            type="button"
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim() || isUploading}
            className="px-4 py-2"
          >
            {isUploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ImageIcon size={16} />
            )}
            {isUploading ? 'Uploading...' : 'Load'}
          </Button>
        </div>
      )}

      {/* File Upload Mode */}
      {uploadMode === 'file' && (
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2"
          >
            {isUploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {isUploading ? 'Uploading...' : 'Choose File'}
          </Button>
          {fileInputRef.current?.files?.[0] && (
            <span className="text-sm text-gray-400 truncate max-w-48">
              {fileInputRef.current.files[0].name}
            </span>
          )}
        </div>
      )}

      {/* Preview and Clear */}
      {value && (
        <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
          <img
            src={value}
            alt="Preview"
            className="w-16 h-16 object-cover rounded"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-300 truncate">{value}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={clearImage}
            className="px-3 py-1 text-sm"
          >
            <X size={14} />
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}