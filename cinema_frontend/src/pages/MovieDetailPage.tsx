import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Movie } from '../types/movie';
import { movieService } from '../services';
import { MainLayout } from '../components/layouts';
import TrailerModal from '../components/ui/TrailerModal';

type TabType = 'overview' | 'cast' | 'reviews' | 'trailer';

const MovieDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await movieService.getMovie(id);
        setMovie(data);
      } catch (err) {
        console.error('Error loading movie information:', err);
        setError('Unable to load movie information');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !movie) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 text-lg mb-3">{error || 'Movie not found'}</p>
            <Link to="/" className="text-amber-400 hover:underline text-sm">
              Back to Home
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const cast = movie.actor_associations || movie.cast || [];
  const formattedDuration = `${Math.floor(movie.duration_minutes / 60)}h ${movie.duration_minutes % 60}m`;

  // Mock reviews data
  const reviews = [
    {
      id: 1,
      rating: 9,
      title: 'Epic Masterpiece',
      content: `${movie.synopsis?.substring(0, 100)}...`,
      author: 'User123'
    },
    {
      id: 2,
      rating: 8,
      title: 'Visually Stunning',
      content: 'Visually stunning, every image to antilins hiding copalations cairn the assemate scent.',
      author: 'MovieBuff'
    }
  ];

  // Get YouTube thumbnail
  const getYouTubeThumbnail = (url: string): string => {
    if (!url) return '';
    let videoId = '';
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) videoId = watchMatch[1];
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) videoId = shortMatch[1];
    const embedMatch = url.match(/embed\/([^?]+)/);
    if (embedMatch) videoId = embedMatch[1];
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'cast', label: 'Cast & Crew' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'trailer', label: 'Trailer' },
  ];

  return (
    <MainLayout>
      <div className="text-white min-h-screen relative">
        {/* Fixed Background Image - Full screen, không di chuyển */}
        <div 
          className="fixed inset-0 w-full h-full z-0"
          style={{ 
            backgroundImage: `url(${movie.background_url || movie.poster_url || ''})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
          }}
        >
          {/* Gradient overlay - Black gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/50" />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Hero Section */}
          <div className="max-w-5xl mx-auto px-6 pt-16 pb-4">
            <div className="flex gap-6">
              {/* Poster */}
              <div className="flex-shrink-0">
                <img
                  src={movie.poster_url || '/placeholder-poster.jpg'}
                  alt={movie.title}
                  className="w-40 h-60 object-cover rounded-lg shadow-2xl"
                />
              </div>

              {/* Movie Info */}
              <div className="flex-1 pt-2">
                <h1 className="text-2xl font-bold mb-1.5">{movie.title}</h1>
                
                {/* Genre */}
                <p className="text-gray-400 mb-1.5 text-sm">{movie.genre}</p>
                
                {/* Meta Info */}
                <div className="flex items-center gap-2 text-gray-300 text-xs mb-3">
                  <span className="px-1.5 py-0.5 border border-gray-500 rounded text-[10px]">
                    {movie.rating || 'PG-13'}
                  </span>
                  <span className="text-gray-500">|</span>
                  <span>{formattedDuration}</span>
                  <span className="text-gray-500">|</span>
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{movie.imdb_rating || 'N/A'}/10</span>
                  </div>
                </div>

                {/* description */}
                <p className="text-gray-300 text-xs leading-relaxed mb-3 max-w-lg">
                  {movie.description}
                </p>

                {/* Book Tickets Button */}
                <button 
                  onClick={() => navigate(`/booking/${movie.id}`)}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors text-sm"
                >
                  Book Tickets
                </button>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="max-w-5xl mx-auto px-6 pb-4">
            {/* Tab Navigation */}
            <div className="border-b border-gray-700 mb-4">
              <div className="flex gap-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`pb-2.5 text-xs font-medium transition-colors relative
                      ${activeTab === tab.key 
                        ? 'text-amber-400' 
                        : 'text-gray-400 hover:text-white'
                      }
                    `}
                  >
                    {tab.label}
                    {activeTab === tab.key && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="pb-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top Row: Trailer + Cast & Crew */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Trailer Thumbnail */}
                    <div>
                      {movie.trailer_url && (
                        <div 
                          className="relative rounded-lg overflow-hidden cursor-pointer group"
                          onClick={() => setIsTrailerOpen(true)}
                        >
                          {/* Trailer Label */}
                          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-black/70 rounded px-2 py-1">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                            <span className="text-[10px] text-white">Official Trailer - {movie.title}</span>
                          </div>
                          <img
                            src={getYouTubeThumbnail(movie.trailer_url) || movie.poster_url || ''}
                            alt={`${movie.title} Trailer`}
                            className="w-full aspect-video object-cover"
                          />
                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                              <svg className="w-6 h-6 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cast & Crew */}
                    <div>
                      <h3 className="text-base font-semibold mb-3">Cast & Crew</h3>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {cast.slice(0, 4).map((member, index) => (
                          <div key={member.actor.id || index} className="flex-shrink-0 text-center">
                            <div 
                              className="w-14 h-14 mx-auto mb-1.5 rounded-full bg-gray-700 overflow-hidden p-[2px]"
                              style={{ 
                                background: 'linear-gradient(135deg, #D4AF37, #C5A028, #B8860B, #DAA520, #FFD700)',
                                boxShadow: '0 0 12px rgba(212, 175, 55, 0.5)' 
                              }}
                            >
                              <div className="w-full h-full rounded-full overflow-hidden bg-gray-800">
                                {member.actor.photo_url ? (
                                  <img
                                    src={member.actor.photo_url}
                                    alt={member.actor.name}
                                    className="w-full h-full object-cover"
                                  />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center text-lg text-gray-400">
                                    {member.actor.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="text-[10px] font-medium text-white truncate w-14">{member.actor.name}</p>
                            <p className="text-[9px] text-gray-500 truncate w-14">{member.role_name}</p>
                          </div>
                        ))}
                        {/* Director */}
                        {movie.director && (
                          <div className="flex-shrink-0 text-center">
                            <div className="w-14 h-14 mx-auto mb-1.5 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
                              <span className="text-lg text-gray-400">{movie.director.charAt(0)}</span>
                            </div>
                            <p className="text-[10px] font-medium text-white truncate w-14">{movie.director}</p>
                            <p className="text-[9px] text-gray-500">Director</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* User Reviews */}
                  <div>
                    <h3 className="text-base font-semibold mb-3">User Reviews</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {reviews.map((review) => (
                        <div key={review.id} className="bg-[#252525]/80 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <svg className="w-3 h-3 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-xs font-medium">{review.rating}/10</span>
                            <span className="text-gray-500 text-xs">-</span>
                            <span className="text-xs font-medium">{review.title}</span>
                          </div>
                          <p className="text-gray-400 text-xs mb-1.5">{review.content}</p>
                          <p className="text-gray-500 text-[10px]">{review.author}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'cast' && (
                <div>
                  <h3 className="text-base font-semibold mb-3">Cast & Crew</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {cast.map((member, index) => (
                      <div key={member.actor.id || index} className="text-center">
                        <div 
                          className="w-12 h-12 mx-auto mb-1.5 rounded-full bg-gray-700 overflow-hidden p-[2px]"
                          style={{ 
                            background: 'linear-gradient(135deg, #D4AF37, #C5A028, #B8860B, #DAA520, #FFD700)',
                            boxShadow: '0 0 12px rgba(212, 175, 55, 0.5)' 
                          }}
                        >
                          <div className="w-full h-full rounded-full overflow-hidden bg-gray-800">
                            {member.actor.photo_url ? (
                              <img
                                src={member.actor.photo_url}
                                alt={member.actor.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-base text-gray-400">
                                {member.actor.name.charAt(0)}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] font-medium truncate">{member.actor.name}</p>
                        <p className="text-[9px] text-gray-500 truncate">{member.role_name}</p>
                      </div>
                    ))}
                    {/* Director */}
                    {movie.director && (
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-1.5 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
                          <span className="text-base text-gray-400">{movie.director.charAt(0)}</span>
                        </div>
                        <p className="text-[10px] font-medium truncate">{movie.director}</p>
                        <p className="text-[9px] text-gray-500">Director</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <h3 className="text-base font-semibold mb-3">User Reviews</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-[#252525] rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <svg className="w-3 h-3 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-[10px] font-medium">{review.rating}/10</span>
                          <span className="text-gray-500 text-[10px]">-</span>
                          <span className="text-[10px] font-medium">{review.title}</span>
                        </div>
                        <p className="text-gray-400 text-[10px] mb-1.5">{review.content}</p>
                        <p className="text-gray-500 text-[9px]">{review.author}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'trailer' && (
                <div>
                  <h3 className="text-base font-semibold mb-3">Trailer</h3>
                  {movie.trailer_url ? (
                    <div 
                      className="relative max-w-xl rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => setIsTrailerOpen(true)}
                    >
                      <img
                        src={getYouTubeThumbnail(movie.trailer_url) || movie.poster_url || ''}
                        alt={`${movie.title} Trailer`}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-xs">No trailer available for this movie.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        trailerUrl={movie.trailer_url || ''}
        movieTitle={movie.title}
      />
    </MainLayout>
  );
};

export default MovieDetailPage;