import api from './api';
import type { Movie, MovieCreate, PaginatedMovieResponse, MovieFilters } from '../types/movie';

const MOVIE_API = '/movies';

export const movieService = {
  // Tạo phim mới
  createMovie: async (movieData: MovieCreate): Promise<Movie> => {
    return api.post<Movie>(MOVIE_API + '/', movieData);
  },

  // Lấy danh sách phim với filters và pagination
  getMovies: async (filters?: MovieFilters): Promise<PaginatedMovieResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.size) params.append('size', filters.size.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.genre) params.append('genre', filters.genre);
    
    const queryString = params.toString();
    const url = queryString ? `${MOVIE_API}/?${queryString}` : `${MOVIE_API}/`;
    
    return api.get<PaginatedMovieResponse>(url);
  },

  // Lấy chi tiết phim
  getMovie: async (id: string): Promise<Movie> => {
    return api.get<Movie>(`${MOVIE_API}/${id}`);
  },

  // Cập nhật phim
  updateMovie: async (id: string, movieData: Partial<MovieCreate>): Promise<Movie> => {
    return api.put<Movie>(`${MOVIE_API}/${id}`, movieData);
  },

  // Xóa phim
  deleteMovie: async (id: string): Promise<void> => {
    return api.delete(`${MOVIE_API}/${id}`);
  },
};
