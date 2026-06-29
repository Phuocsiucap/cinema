export interface Banner {
    id: string;
    image_url: string;
    text?: string;
    link_type?: 'movie' | 'cinema';
    movie_id?: string;
    cinema_id?: string;
    is_active: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface BannerCreate {
    image_url: string;
    text?: string;
    link_type?: 'movie' | 'cinema';
    movie_id?: string;
    cinema_id?: string;
    is_active?: boolean;
    display_order?: number;
}

export interface BannerUpdate {
    image_url?: string;
    text?: string;
    link_type?: 'movie' | 'cinema';
    movie_id?: string;
    cinema_id?: string;
    is_active?: boolean;
    display_order?: number;
}

export interface AuthBackground {
    id: string;
    image_url: string;
    title?: string;
    is_active: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface AuthBackgroundCreate {
    image_url: string;
    title?: string;
    is_active?: boolean;
    display_order?: number;
}

export interface AuthBackgroundUpdate {
    image_url?: string;
    title?: string;
    is_active?: boolean;
    display_order?: number;
}

export interface PosterAd {
    id: string;
    poster_url: string;
    movie_id: string;
    title?: string;
    description?: string;
    is_active: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface PosterAdCreate {
    poster_url: string;
    movie_id: string;
    title?: string;
    description?: string;
    is_active?: boolean;
    display_order?: number;
}

export interface PosterAdUpdate {
    poster_url?: string;
    movie_id?: string;
    title?: string;
    description?: string;
    is_active?: boolean;
    display_order?: number;
}
