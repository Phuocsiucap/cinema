import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import advertisementService from '../../services/advertisementService';
import type { Banner } from '../../types/advertisement';

export function HeroSection() {
    const navigate = useNavigate();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const data = await advertisementService.getBanners(true); // Get only active banners
                if (data.length > 0) {
                    // Sort by display_order
                    const sortedBanners = data.sort((a, b) => a.display_order - b.display_order);
                    setBanners(sortedBanners);
                }
            } catch (error) {
                console.error('Failed to fetch banners:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBanners();
    }, []);

    // Auto-play carousel
    useEffect(() => {
        if (!isAutoPlaying || banners.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(interval);
    }, [isAutoPlaying, banners.length]);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
        setIsAutoPlaying(false); // Pause auto-play when user manually navigates
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
        setIsAutoPlaying(false);
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
        setIsAutoPlaying(false);
    };

    const handleBannerClick = (banner: Banner) => {
        if (banner.link_type === 'movie' && banner.movie_id) {
            navigate(`/movie/${banner.movie_id}`);
        } else if (banner.link_type === 'cinema' && banner.cinema_id) {
            navigate(`/cinemas`);
        }
    };

    if (isLoading) {
        return (
            <div className="relative w-full h-[85vh] min-h-[600px] flex items-end pb-16 overflow-hidden bg-background-dark">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                </div>
            </div>
        );
    }

    if (banners.length === 0) {
        return (
            <div className="relative w-full h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-background-dark">
                <div className="text-center">
                    <p className="text-white/60 text-lg">No banners available</p>
                </div>
            </div>
        );
    }

    const currentBanner = banners[currentIndex];

    return (
        <div className="relative w-full h-[85vh] min-h-[600px] flex items-end pb-16 overflow-hidden">
            {/* Background Images with Transition */}
            {banners.map((banner, index) => (
                <div
                    key={banner.id}
                    className={`absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 cursor-pointer ${index === currentIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                    style={{
                        backgroundImage: `linear-gradient(to top, #142210 5%, rgba(20, 34, 16, 0.4) 50%, rgba(20, 34, 16, 0.3) 100%), url('${banner.image_url}')`,
                    }}
                    onClick={() => handleBannerClick(banner)}
                />
            ))}

            {/* Navigation Arrows */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 size-12 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-all group"
                    >
                        <ChevronLeft size={24} className="group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 size-12 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-all group"
                    >
                        <ChevronRight size={24} className="group-hover:scale-110 transition-transform" />
                    </button>
                </>
            )}

            <div className="layout-container w-full z-10 px-6 sm:px-10 max-w-[1280px] mx-auto flex flex-col items-start justify-end gap-8">
                {/* Banner Text Content */}
                {currentBanner.text && (
                    <div className="flex flex-col gap-6 max-w-3xl">
                        <h1 className="text-white text-5xl md:text-7xl font-black leading-tight tracking-tight transition-all duration-500">
                            {currentBanner.text}
                        </h1>

                        {(currentBanner.link_type === 'movie' || currentBanner.link_type === 'cinema') && (
                            <div className="flex flex-wrap gap-4 mt-2">
                                <button
                                    onClick={() => handleBannerClick(currentBanner)}
                                    className="flex items-center justify-center gap-2 rounded-full h-14 px-8 bg-primary text-background-dark text-base font-bold tracking-wide hover:brightness-110 hover:scale-105 transition-all shadow-[0_0_20px_rgba(70,236,19,0.4)]"
                                >
                                    <span className="material-symbols-outlined">
                                        {currentBanner.link_type === 'movie' ? 'local_activity' : 'location_on'}
                                    </span>
                                    {currentBanner.link_type === 'movie' ? 'View Movie' : 'View Cinemas'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Slide Indicators */}
            {banners.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`h-1 rounded-full transition-all ${index === currentIndex
                                    ? 'w-8 bg-primary'
                                    : 'w-4 bg-white/30 hover:bg-white/50'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
