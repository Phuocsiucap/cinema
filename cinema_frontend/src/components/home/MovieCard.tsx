import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

export interface Movie {
  id: number | string;
  title: string;
  posterUrl: string;
  releaseDate?: string;
  rating?: number;
}

interface MovieCardProps {
  movie: Movie;
  variant?: 'release' | 'popular';
}

export function MovieCard({ movie, variant = 'release' }: MovieCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Link 
      to={`/movie/${movie.id}`}
      className="group block shrink-0"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      </div>

      {/* Info */}
      <div className="space-y-1">
        <h3 className="text-white text-sm font-medium truncate group-hover:text-red-400 transition-colors">
          {movie.title}
        </h3>
        
        {variant === 'release' && movie.releaseDate && (
          <p className="text-gray-500 text-xs">
            {formatDate(movie.releaseDate)}
          </p>
        )}

        {variant === 'popular' && movie.rating && (
          <div className="flex items-center gap-1">
            <Star className="text-yellow-500 fill-yellow-500" size={12} />
            <span className="text-gray-400 text-xs">{movie.rating}/5</span>
          </div>
        )}
      </div>
    </Link>
  );
}
