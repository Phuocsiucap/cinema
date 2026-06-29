import { useState } from 'react';
import { MovieCard } from './MovieCardNew';
import type { Movie as MovieType } from '../../types/movie';

interface NowShowingSectionProps {
    movies: MovieType[];
}

const GENRE_FILTERS = ['All', 'Action', 'Sci-Fi', 'Romance', 'Comedy', 'Horror', 'Drama'];

export function NowShowingSection({ movies }: NowShowingSectionProps) {
    const [selectedGenre, setSelectedGenre] = useState('All');

    const filteredMovies = selectedGenre === 'All'
        ? movies
        : movies.filter(movie => movie.genre.toLowerCase().includes(selectedGenre.toLowerCase()));

    return (
        <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-white text-3xl font-bold tracking-tight border-l-4 border-primary pl-4">
                    Now Showing
                </h2>
                <div className="flex gap-2">
                    <button className="size-10 rounded-full border border-border-dark flex items-center justify-center text-white hover:bg-primary hover:text-background-dark transition-all">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <button className="size-10 rounded-full border border-border-dark flex items-center justify-center text-white hover:bg-primary hover:text-background-dark transition-all">
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                </div>
            </div>

            {/* Genre Chips */}
            <div className="flex flex-wrap gap-3 pb-2">
                {GENRE_FILTERS.map((genre) => (
                    <button
                        key={genre}
                        onClick={() => setSelectedGenre(genre)}
                        className={`h-9 px-5 rounded-full text-sm font-bold transition-transform hover:scale-105 ${selectedGenre === genre
                                ? 'bg-primary text-background-dark'
                                : 'bg-surface-dark border border-border-dark text-white hover:border-primary'
                            }`}
                    >
                        {genre}
                    </button>
                ))}
            </div>

            {/* Movie Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredMovies.slice(0, 8).map((movie) => (
                    <MovieCard
                        key={movie.id}
                        id={movie.id}
                        title={movie.title}
                        posterUrl={movie.poster_url || ''}
                        genre={movie.genre}
                        duration={movie.duration_minutes}
                        rating={movie.imdb_rating}
                    />
                ))}
            </div>

            {filteredMovies.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-white/60 text-lg">No movies found in this genre</p>
                </div>
            )}
        </section>
    );
}
