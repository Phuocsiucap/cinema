import { useState } from 'react';
import { MainLayout } from '../components/layouts';
import { ImageUpload } from '../components/ui';

export function UploadTestPage() {
  const [posterUrl, setPosterUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Image Upload Test</h1>

        <div className="space-y-8">
          {/* Poster Upload */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Movie Poster</h2>
            <ImageUpload
              value={posterUrl}
              onChange={setPosterUrl}
              placeholder="Enter poster URL or upload image"
            />
            {posterUrl && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Preview:</p>
                <img
                  src={posterUrl}
                  alt="Poster preview"
                  className="max-w-xs rounded-lg shadow-lg"
                />
              </div>
            )}
          </div>

          {/* Banner Upload */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Movie Banner</h2>
            <ImageUpload
              value={bannerUrl}
              onChange={setBannerUrl}
              placeholder="Enter banner URL or upload image"
            />
            {bannerUrl && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Preview:</p>
                <img
                  src={bannerUrl}
                  alt="Banner preview"
                  className="w-full max-h-64 object-cover rounded-lg shadow-lg"
                />
              </div>
            )}
          </div>

          {/* Debug Info */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Debug Info</h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-300">
                <span className="font-medium">Poster URL:</span> {posterUrl || 'None'}
              </p>
              <p className="text-gray-300">
                <span className="font-medium">Banner URL:</span> {bannerUrl || 'None'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default UploadTestPage;