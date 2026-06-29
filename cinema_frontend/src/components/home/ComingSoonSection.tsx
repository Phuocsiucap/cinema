import { useNavigate } from 'react-router-dom';
import type { Movie as MovieType } from '../../types/movie';

interface ComingSoonSectionProps {
    movies: MovieType[];
}

export function ComingSoonSection({ movies }: ComingSoonSectionProps) {
    const navigate = useNavigate();

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'TBA';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-white text-3xl font-bold tracking-tight border-l-4 border-white pl-4">
                    Coming Soon
                </h2>
                <a href="/movies?status=upcoming" className="text-primary text-sm font-bold hover:underline">
                    View All
                </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {movies.slice(0, 6).map((movie) => (
                    <div
                        key={movie.id}
                        className="flex gap-4 p-4 rounded-2xl bg-surface-dark border border-border-dark hover:border-primary/50 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/movie/${movie.id}`)}
                    >
                        <div className="w-24 shrink-0 rounded-xl overflow-hidden aspect-[2/3]">
                            <img
                                alt={movie.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                src={movie.poster_url || 'https://via.placeholder.com/96x144'}
                            />
                        </div>
                        <div className="flex flex-col justify-center gap-2 flex-1">
                            <span className="text-xs font-bold text-primary uppercase">
                                {formatDate(movie.release_date)}
                            </span>
                            <h4 className="text-white text-xl font-bold leading-tight line-clamp-2">
                                {movie.title}
                            </h4>
                            <p className="text-white/60 text-sm">{movie.genre}</p>
                            <div className="mt-2 flex gap-3">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/movie/${movie.id}`);
                                    }}
                                    className="text-white text-sm font-bold border-b border-white/30 pb-0.5 hover:text-primary hover:border-primary transition-colors"
                                >
                                    Notify Me
                                </button>
                                {movie.trailer_url && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(movie.trailer_url, '_blank');
                                        }}
                                        className="text-white text-sm font-bold border-b border-white/30 pb-0.5 hover:text-primary hover:border-primary transition-colors"
                                    >
                                        Trailer
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {movies.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-white/60 text-lg">No upcoming movies at the moment</p>
                </div>
            )}
        </section>
    );
}
