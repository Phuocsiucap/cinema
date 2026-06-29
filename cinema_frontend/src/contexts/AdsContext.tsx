import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import advertisementService from '../services/advertisementService';
import type { PosterAd } from '../types/advertisement';

interface AdsContextType {
  showAdsModal: boolean;
  posterAds: PosterAd[];
  closeAdsModal: () => void;
  openAdsModal: () => void;
  testShowAds: () => void; // For testing purposes
}

const AdsContext = createContext<AdsContextType | undefined>(undefined);

const ADS_SHOWN_KEY = 'ads_last_shown';
const ADS_COOLDOWN_MINUTES = 30; // 30 phút

export function AdsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [showAdsModal, setShowAdsModal] = useState(false);
  const [posterAds, setPosterAds] = useState<PosterAd[]>([]);
  const [hasShownForCurrentSession, setHasShownForCurrentSession] = useState(false);

  // Fetch active poster ads
  const fetchPosterAds = useCallback(async () => {
    try {
      const activePosterAds = await advertisementService.getPosterAds(true);
      setPosterAds(activePosterAds);
      console.log('Fetched poster ads:', activePosterAds.length, activePosterAds);

      // If no poster ads, create a test poster ad for development
      if (activePosterAds.length === 0) {
        console.log('No active poster ads found, creating test poster ad...');
        try {
          const testPosterAd = await advertisementService.createPosterAd({
            poster_url: 'https://picsum.photos/600/900?random=1',
            movie_id: 'test-movie-id',
            title: 'Featured Movie Advertisement',
            description: 'Check out our latest movies!',
            is_active: true,
            display_order: 1
          });
          console.log('Created test poster ad:', testPosterAd);
          setPosterAds([testPosterAd]);
        } catch (createError) {
          console.error('Failed to create test poster ad:', createError);
        }
      }
    } catch (error) {
      console.error('Failed to fetch poster ads:', error);
    }
  }, []);

  // Load poster ads on mount
  useEffect(() => {
    fetchPosterAds();
  }, [fetchPosterAds]);

  // Check if ads should be shown based on timestamp (for page reloads)
  const shouldShowAdsOnReload = useCallback(() => {
    if (posterAds.length === 0) return false;

    const lastShown = localStorage.getItem(ADS_SHOWN_KEY);
    if (!lastShown) return true; // Never shown before

    const lastShownTime = parseInt(lastShown);
    const now = Date.now();
    const cooldownMs = ADS_COOLDOWN_MINUTES * 60 * 1000;

    return (now - lastShownTime) > cooldownMs;
  }, [posterAds.length]);

  // Show ads modal when user becomes authenticated
  useEffect(() => {
    const isOnHomePage = location.pathname === '/';
    console.log('Ads check:', { isAuthenticated, isLoading, posterAdsLength: posterAds.length, isOnHomePage, hasShownForCurrentSession });

    if (isAuthenticated && !isLoading && posterAds.length > 0 && isOnHomePage) {
      // Check if this is a fresh login or app reload
      const isPageReload = hasShownForCurrentSession;

      if (!isPageReload || shouldShowAdsOnReload()) {
        console.log('Showing ads modal on home page');
        // Small delay to ensure UI is ready
        const timer = setTimeout(() => {
          setShowAdsModal(true);
          setHasShownForCurrentSession(true);
          // Save timestamp when ads are shown
          localStorage.setItem(ADS_SHOWN_KEY, Date.now().toString());
        }, 1000);

        return () => clearTimeout(timer);
      } else {
        console.log('Ads not shown: either already shown in session or cooldown not met');
      }
    }
  }, [isAuthenticated, isLoading, posterAds.length, hasShownForCurrentSession, shouldShowAdsOnReload, location.pathname]);

  // Reset session flag when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setHasShownForCurrentSession(false);
    }
  }, [isAuthenticated]);

  const closeAdsModal = useCallback(() => {
    setShowAdsModal(false);
  }, []);

  const openAdsModal = useCallback(() => {
    if (posterAds.length > 0) {
      setShowAdsModal(true);
      setHasShownForCurrentSession(true);
      localStorage.setItem(ADS_SHOWN_KEY, Date.now().toString());
    }
  }, [posterAds.length]);

  const testShowAds = useCallback(() => {
    if (posterAds.length > 0) {
      console.log('Test showing ads modal');
      setShowAdsModal(true);
      setHasShownForCurrentSession(true);
      localStorage.setItem(ADS_SHOWN_KEY, Date.now().toString());
    } else {
      console.log('No poster ads available for test');
    }
  }, [posterAds.length]);

  return (
    <AdsContext.Provider
      value={{
        showAdsModal,
        posterAds,
        closeAdsModal,
        openAdsModal,
        testShowAds,
      }}
    >
      {children}
    </AdsContext.Provider>
  );
}

export function useAds() {
  const context = useContext(AdsContext);
  if (context === undefined) {
    throw new Error('useAds must be used within an AdsProvider');
  }
  return context;
}