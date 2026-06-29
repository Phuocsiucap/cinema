import api from './api';
import type {
    Banner,
    BannerCreate,
    BannerUpdate,
    AuthBackground,
    AuthBackgroundCreate,
    AuthBackgroundUpdate,
    PosterAd,
    PosterAdCreate,
    PosterAdUpdate,
} from '../types/advertisement';

const ADS_API = '/advertisements';

export const advertisementService = {
    // ================== BANNER OPERATIONS ==================

    getBanners: async (activeOnly: boolean = false): Promise<Banner[]> => {
        return api.get<Banner[]>(`${ADS_API}/banners?active_only=${activeOnly}`);
    },

    getBanner: async (id: string): Promise<Banner> => {
        return api.get<Banner>(`${ADS_API}/banners/${id}`);
    },

    createBanner: async (bannerData: BannerCreate): Promise<Banner> => {
        return api.post<Banner>(`${ADS_API}/banners`, bannerData);
    },

    updateBanner: async (id: string, bannerData: BannerUpdate): Promise<Banner> => {
        return api.put<Banner>(`${ADS_API}/banners/${id}`, bannerData);
    },

    deleteBanner: async (id: string): Promise<void> => {
        return api.delete(`${ADS_API}/banners/${id}`);
    },

    // ================== AUTH BACKGROUND OPERATIONS ==================

    getAuthBackgrounds: async (activeOnly: boolean = false): Promise<AuthBackground[]> => {
        return api.get<AuthBackground[]>(`${ADS_API}/auth-backgrounds?active_only=${activeOnly}`);
    },

    getAuthBackground: async (id: string): Promise<AuthBackground> => {
        return api.get<AuthBackground>(`${ADS_API}/auth-backgrounds/${id}`);
    },

    createAuthBackground: async (authBgData: AuthBackgroundCreate): Promise<AuthBackground> => {
        return api.post<AuthBackground>(`${ADS_API}/auth-backgrounds`, authBgData);
    },

    updateAuthBackground: async (id: string, authBgData: AuthBackgroundUpdate): Promise<AuthBackground> => {
        return api.put<AuthBackground>(`${ADS_API}/auth-backgrounds/${id}`, authBgData);
    },

    deleteAuthBackground: async (id: string): Promise<void> => {
        return api.delete(`${ADS_API}/auth-backgrounds/${id}`);
    },

    // ================== POSTER AD OPERATIONS ==================

    getPosterAds: async (activeOnly: boolean = false): Promise<PosterAd[]> => {
        return api.get<PosterAd[]>(`${ADS_API}/poster-ads?active_only=${activeOnly}`);
    },

    getPosterAd: async (id: string): Promise<PosterAd> => {
        return api.get<PosterAd>(`${ADS_API}/poster-ads/${id}`);
    },

    createPosterAd: async (posterAdData: PosterAdCreate): Promise<PosterAd> => {
        return api.post<PosterAd>(`${ADS_API}/poster-ads`, posterAdData);
    },

    updatePosterAd: async (id: string, posterAdData: PosterAdUpdate): Promise<PosterAd> => {
        return api.put<PosterAd>(`${ADS_API}/poster-ads/${id}`, posterAdData);
    },

    deletePosterAd: async (id: string): Promise<void> => {
        return api.delete(`${ADS_API}/poster-ads/${id}`);
    },
};

export default advertisementService;
