export type MovieStatus = 'upcoming' | 'now_showing' | 'closed';

export interface CastMember {
  actor_id?: string;
  name: string;
  photo_url?: string;
  role_name?: string;
}

export interface MovieCreate {
  title: string;
  synopsis: string;
  description?: string;
  duration_minutes: number;
  release_date?: string;
  genre: string;
  rating?: string;
  imdb_rating?: number;
  trailer_url?: string;
  poster_url?: string;
  background_url?: string;
  director?: string;
  status: MovieStatus;
  cast_members?: CastMember[];
}

export interface Actor {
  id: string;
  name: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MovieActorResponse {
  role_name?: string;
  actor: Actor;
}

export interface Movie {
  id: string;
  title: string;
  synopsis: string;
  description?: string;
  duration_minutes: number;
  release_date?: string;
  genre: string;
  rating?: string;
  imdb_rating?: number;
  trailer_url?: string;
  poster_url?: string;
  background_url?: string;
  director?: string;
  status: MovieStatus;
  created_at: string;
  updated_at: string;
  // API trả về actor_associations, alias là cast
  cast?: MovieActorResponse[];
  actor_associations?: MovieActorResponse[];
}

export interface PaginatedMovieResponse {
  total_count: number;
  page: number;
  size: number;
  items: Movie[];
}

export interface MovieFilters {
  search?: string;
  status?: MovieStatus | '';
  genre?: string;
  page?: number;
  size?: number;
}

export const RATING_OPTIONS = [
  { value: 'G', label: 'G - General Audiences' },
  { value: 'PG', label: 'PG - Parental Guidance' },
  { value: 'PG-13', label: 'PG-13 - Parents Strongly Cautioned' },
  { value: 'R', label: 'R - Restricted' },
  { value: 'NC-17', label: 'NC-17 - Adults Only' },
];

export const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Sắp công chiếu' },
  { value: 'now_showing', label: 'Đang chiếu' },
  { value: 'closed', label: 'Đã đóng' },
];

export const GENRE_OPTIONS = [
  'Action',
  'Adventure', 
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'War',
  'Western',
  'Historical',
];
