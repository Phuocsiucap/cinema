// Upload Service - Handles image upload to Cloudinary via API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface UploadResponse {
  success: boolean;
  url: string;
  public_id: string;
  message: string;
}

function getToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * Upload a file to Cloudinary
 */
async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/upload/`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || 'Upload failed');
  }

  return response.json();
}

/**
 * Upload an image from URL to Cloudinary
 */
async function uploadFromUrl(imageUrl: string): Promise<UploadResponse> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/upload/upload-url`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ image_url: imageUrl }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || 'Upload failed');
  }

  return response.json();
}

export const uploadService = {
  uploadFile,
  uploadFromUrl,
};

export type { UploadResponse };
