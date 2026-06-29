import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { movieService } from '../../services';
import type { Movie } from '../../types/movie';

export function SearchFilterBar() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Movie[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Debounced search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            setShowResults(true);
            try {
                const response = await movieService.getMovies({
                    search: searchQuery,
                    size: 8
                });
                setSearchResults(response.items);
            } catch (error) {
                console.error('Failed to search movies:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleMovieClick = (movieId: string) => {
        setSearchQuery('');
        setSearchResults([]);
        setShowResults(false);
        navigate(`/movie/${movieId}`);
    };

    return (
        <div className="w-full px-6 -mt-8 z-20 relative">
            <div className="max-w-[1000px] mx-auto bg-surface-dark border border-border-dark rounded-2xl p-4 shadow-2xl flex flex-col md:flex-row gap-4 items-center">
                {/* Search Input */}
                <div className="flex-1 w-full relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
                        <span className="material-symbols-outlined">search</span>
                    </div>
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 bg-background-dark rounded-xl pl-12 pr-12 text-white placeholder-text-muted border border-transparent focus:border-primary focus:ring-0 transition-all outline-none"
                        placeholder="Search for movies, cinemas, or genres..."
                        type="text"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setSearchResults([]);
                                setShowResults(false);
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Date Picker Dummy */}
                <div className="flex-1 w-full md:w-auto md:max-w-[200px] relative">
                    <button className="w-full h-12 bg-background-dark rounded-xl px-4 flex items-center justify-between text-white border border-transparent hover:border-border-dark transition-all">
                        <span className="text-sm font-medium">Today, {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                        <span className="material-symbols-outlined text-text-muted">calendar_today</span>
                    </button>
                </div>

                {/* Location Dummy */}
                <div className="flex-1 w-full md:w-auto md:max-w-[200px] relative">
                    <button className="w-full h-12 bg-background-dark rounded-xl px-4 flex items-center justify-between text-white border border-transparent hover:border-border-dark transition-all">
                        <span className="text-sm font-medium">All Locations</span>
                        <span className="material-symbols-outlined text-text-muted">location_on</span>
                    </button>
                </div>
            </div>

            {/* Search Results Dropdown */}
            {showResults && (
                <div className="max-w-[1000px] mx-auto mt-2">
                    <div className="bg-surface-dark border border-border-dark rounded-2xl shadow-2xl overflow-hidden">
                        <div className="max-h-[400px] overflow-y-auto p-4">
                            {isSearching ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {searchResults.map((movie) => (
                                        <div
                                            key={movie.id}
                                            onClick={() => handleMovieClick(movie.id)}
                                            className="group cursor-pointer"
                                        >
                                            <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-background-dark">
                                                <img
                                                    src={movie.poster_url || 'https://via.placeholder.com/300x450'}
                                                    alt={movie.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                                {movie.imdb_rating && (
                                                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-yellow-400 text-[12px]">star</span>
                                                        <span className="text-white text-xs font-bold">{movie.imdb_rating.toFixed(1)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="text-white text-xs font-medium mt-2 line-clamp-2 group-hover:text-primary transition-colors">
                                                {movie.title}
                                            </h3>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-white/60">No movies found for "{searchQuery}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
