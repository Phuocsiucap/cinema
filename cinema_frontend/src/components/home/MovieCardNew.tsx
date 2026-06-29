import { useNavigate } from 'react-router-dom';

interface MovieCardProps {
    id: string;
    title: string;
    posterUrl: string;
    genre: string;
    duration: number;
    rating?: number;
}

export function MovieCard({ id, title, posterUrl, genre, duration, rating }: MovieCardProps) {
    const navigate = useNavigate();

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    return (
        <div className="group relative flex flex-col gap-4">
            <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer shadow-lg">
                <img
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    src={posterUrl || 'https://via.placeholder.com/300x450?text=No+Poster'}
                    onClick={() => navigate(`/movie/${id}`)}
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4 p-4">
                    <button
                        onClick={() => navigate(`/movie/${id}`)}
                        className="w-full py-3 bg-primary text-background-dark rounded-full font-bold text-sm hover:brightness-110 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                    >
                        Book Now
                    </button>
                    <button
                        onClick={() => navigate(`/movie/${id}`)}
                        className="w-full py-3 bg-white/10 backdrop-blur-md text-white rounded-full font-bold text-sm hover:bg-white/20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75"
                    >
                        Details
                    </button>
                </div>

                {/* Rating Badge */}
                {rating && (
                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10">
                        <span className="material-symbols-outlined text-yellow-400 text-[16px]">star</span>
                        <span className="text-white text-xs font-bold">{rating.toFixed(1)}</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <h3 className="text-white text-lg font-bold group-hover:text-primary transition-colors line-clamp-2">
                    {title}
                </h3>
                <p className="text-text-muted text-sm">
                    {genre} • {formatDuration(duration)}
                </p>
            </div>
        </div>
    );
}
