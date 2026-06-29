import { useEffect, useCallback, useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PosterAd } from '../../types/advertisement';

interface AdsModalProps {
  isOpen: boolean;
  onClose: () => void;
  posterAds: PosterAd[];
}

const AdsModal = ({ isOpen, onClose, posterAds }: AdsModalProps) => {
  const navigate = useNavigate();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  // Đóng modal khi nhấn Escape
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Ngăn scroll khi modal mở
    } else {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  // Tự động chuyển poster ad sau 5 giây
  useEffect(() => {
    if (!isOpen || posterAds.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % posterAds.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, posterAds.length]);

  // Reset về ad đầu khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      setCurrentAdIndex(0);
    }
  }, [isOpen]);

  if (!isOpen || posterAds.length === 0) return null;

  const currentAd = posterAds[currentAdIndex];

  const handleAdClick = () => {
    if (currentAd.movie_id) {
      // Chuyển đến trang chi tiết phim
      navigate(`/movie/${currentAd.movie_id}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
      {/* Modal container - 80% màn hình */}
      <div className="relative w-[80vw] h-[80vh] max-w-[1400px] max-h-[1000px]">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 z-10 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-colors shadow-lg"
          aria-label="Close advertisement"
        >
          <X size={24} />
        </button>

        {/* Poster image */}
        <div
          className="relative w-full h-full cursor-pointer group rounded-lg overflow-hidden shadow-2xl"
          onClick={handleAdClick}
        >
          <img
            src={currentAd.poster_url}
            alt={currentAd.title || 'Advertisement'}
            className="w-full h-full object-contain bg-gray-900"
          />

          {/* Overlay với title và description */}
          {(currentAd.title || currentAd.description) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6">
              {currentAd.title && (
                <h3 className="text-white text-2xl font-bold mb-2">{currentAd.title}</h3>
              )}
              {currentAd.description && (
                <p className="text-gray-300 text-sm line-clamp-2">{currentAd.description}</p>
              )}
              <div className="mt-3">
                <span className="inline-block px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors">
                  View Details →
                </span>
              </div>
            </div>
          )}

          {/* Hover effect */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
        </div>

        {/* Indicators cho multiple poster ads */}
        {posterAds.length > 1 && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex justify-center space-x-2">
            {posterAds.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentAdIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentAdIndex
                  ? 'bg-red-600 w-8'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                  }`}
                aria-label={`Go to ad ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Skip button */}
        <div className="absolute -bottom-8 right-0">
          <button
            onClick={onClose}
            className="text-white text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            Skip Ad ({posterAds.length > 1 ? `${currentAdIndex + 1}/${posterAds.length}` : '1/1'})
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdsModal;