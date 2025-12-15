import api from './api';
import type { Movie, MovieCreate, PaginatedMovieResponse, MovieFilters } from '../types/movie';

const MOVIE_API = '/movies';

export const movieService = {
  // Create new movie
  createMovie: async (movieData: MovieCreate): Promise<Movie> => {
    return api.post<Movie>(MOVIE_API + '/', movieData);
  },

  // Get list of movies with filters and pagination
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

  // Get movie details
  getMovie: async (id: string): Promise<Movie> => {
    return api.get<Movie>(`${MOVIE_API}/${id}`);
  },

  // Update movie
  updateMovie: async (id: string, movieData: Partial<MovieCreate>): Promise<Movie> => {
    return api.put<Movie>(`${MOVIE_API}/${id}`, movieData);
  },

  // Delete movie
  deleteMovie: async (id: string): Promise<void> => {
    return api.delete(`${MOVIE_API}/${id}`);
  },
};
