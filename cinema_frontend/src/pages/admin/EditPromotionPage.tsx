import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, Percent, DollarSign, Loader2, Search, X } from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { promotionService, type PromotionUpdate } from '../../services/promotionService';
import { movieService } from '../../services/movieService';
import type { Movie } from '../../types/movie';

export function EditPromotionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const movieSearchRef = useRef<HTMLDivElement>(null);
  
  // Movie search for applicable_items
  const [movieSearchQuery, setMovieSearchQuery] = useState('');
  const [movieSearchResults, setMovieSearchResults] = useState<Movie[]>([]);
  const [isSearchingMovies, setIsSearchingMovies] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);
  
  const [formData, setFormData] = useState<PromotionUpdate & { discount_type?: string }>({
    title: '',
    description: '',
    code: '',
    discount_type: 'PERCENTAGE',
    discount_value: 0,
    min_purchase: undefined,
    max_discount: undefined,
    usage_limit: undefined,
    start_date: undefined,
    end_date: undefined,
    banner_url: undefined,
    is_active: true,
    applicable_to: 'ALL',
    applicable_items: [],
    min_tickets: 1,
  });

  useEffect(() => {
    loadPromotion();
  }, [id]);

  const loadPromotion = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const promotion = await promotionService.getPromotion(id);
      
      setFormData({
        title: promotion.title,
        description: promotion.description || '',
        code: promotion.code,
        discount_type: promotion.discount_type,
        discount_value: promotion.discount_value,
        min_purchase: promotion.min_purchase || undefined,
        max_discount: promotion.max_discount || undefined,
        usage_limit: promotion.usage_limit || undefined,
        start_date: promotion.start_date ? new Date(promotion.start_date).toISOString().slice(0, 16) : undefined,
        end_date: promotion.end_date ? new Date(promotion.end_date).toISOString().slice(0, 16) : undefined,
        banner_url: promotion.banner_url || undefined,
        is_active: promotion.is_active,
        applicable_to: promotion.applicable_to || 'ALL',
        applicable_items: promotion.applicable_items || [],
        min_tickets: promotion.min_tickets || 1,
      });
      
      // Load selected movies if applicable_to is MOVIES
      if (promotion.applicable_to === 'MOVIES' && promotion.applicable_items?.length) {
        try {
          const moviePromises = promotion.applicable_items.map(movieId => 
            movieService.getMovie(movieId)
          );
          const movies = await Promise.all(moviePromises);
          setSelectedMovies(movies.filter(Boolean));
        } catch (err) {
          console.error('Failed to load movies:', err);
        }
      }
    } catch (err) {
      setError('Failed to load promotion');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Debounced movie search
  useEffect(() => {
    if (!movieSearchQuery.trim()) {
      setMovieSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingMovies(true);
      try {
        const response = await movieService.getMovies({ search: movieSearchQuery, size: 10 });
        setMovieSearchResults(response.items);
      } catch (err) {
        console.error('Failed to search movies:', err);
      } finally {
        setIsSearchingMovies(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [movieSearchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (movieSearchRef.current && !movieSearchRef.current.contains(event.target as Node)) {
        setMovieSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMovie = (movie: Movie) => {
    if (!selectedMovies.find(m => m.id === movie.id)) {
      const newSelected = [...selectedMovies, movie];
      setSelectedMovies(newSelected);
      setFormData(prev => ({ ...prev, applicable_items: newSelected.map(m => m.id) }));
    }
    setMovieSearchQuery('');
    setMovieSearchResults([]);
  };

  const handleRemoveMovie = (movieId: string) => {
    const newSelected = selectedMovies.filter(m => m.id !== movieId);
    setSelectedMovies(newSelected);
    setFormData(prev => ({ ...prev, applicable_items: newSelected.map(m => m.id) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSaving(true);
    setError(null);

    try {
      await promotionService.updatePromotion(id, formData);
      navigate('/admin/promotions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update promotion');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      is_active: e.target.checked,
    }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 size={40} className="animate-spin text-red-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-950 p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/promotions')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Promotions
          </button>
          <h1 className="text-3xl font-bold text-white">Edit Promotion</h1>
          <p className="text-gray-400 mt-2">Update promotion details</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Promotion Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white uppercase focus:outline-none focus:border-gray-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Discount Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="discount_type"
                  value={formData.discount_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600"
                  required
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (VND)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Discount Value <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  {formData.discount_type === 'PERCENTAGE' ? (
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  ) : (
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  )}
                  <input
                    type="number"
                    name="discount_value"
                    value={formData.discount_value}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Minimum Purchase (VND)
                </label>
                <input
                  type="number"
                  name="min_purchase"
                  value={formData.min_purchase || ''}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maximum Discount (VND)
                </label>
                <input
                  type="number"
                  name="max_discount"
                  value={formData.max_discount || ''}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Usage Limit
                </label>
                <input
                  type="number"
                  name="usage_limit"
                  value={formData.usage_limit || ''}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="datetime-local"
                    name="start_date"
                    value={formData.start_date || ''}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={formData.end_date || ''}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Banner URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Banner Image URL
              </label>
              <input
                type="url"
                name="banner_url"
                value={formData.banner_url || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600"
              />
            </div>

            {/* Conditions Section */}
            <div className="border-t border-gray-800 pt-6">
              <h3 className="text-lg font-semibold text-white mb-2">Application Conditions</h3>
              <p className="text-sm text-gray-400 mb-4">Set up conditions for promotion validity</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Apply To <span className="text-xs text-gray-500">(Target Type)</span>
                  </label>
                  <select
                    name="applicable_to"
                    value={formData.applicable_to}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600"
                  >
                    <option value="ALL">🎯 All (Movies, Tickets, Combos)</option>
                    <option value="MOVIES">🎬 Movies Only</option>
                    <option value="TICKETS">🎫 Tickets Only</option>
                    <option value="COMBOS">🍿 Combos Only</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select applicable products/services
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Minimum Tickets <span className="text-xs text-gray-500">(Per Order)</span>
                  </label>
                  <input
                    type="number"
                    name="min_tickets"
                    value={formData.min_tickets || 1}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum number of tickets required
                  </p>
                </div>
              </div>

              {formData.applicable_to !== 'ALL' && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <label className="block text-sm font-medium text-blue-300 mb-2">
                    🎯 {formData.applicable_to === 'MOVIES' ? 'Select Movies' : 'Specific IDs'} (Optional)
                  </label>
                  
                  {formData.applicable_to === 'MOVIES' ? (
                    <>
                      {/* Movie Search */}
                      <div className="relative mb-3" ref={movieSearchRef}>
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search movies..."
                          value={movieSearchQuery}
                          onChange={(e) => setMovieSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 bg-gray-800 border border-blue-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                        />
                        {isSearchingMovies && (
                          <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                        )}
                        {movieSearchQuery && !isSearchingMovies && (
                          <button
                            onClick={() => {
                              setMovieSearchQuery('');
                              setMovieSearchResults([]);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            <X size={18} />
                          </button>
                        )}
                        
                        {/* Search Results Dropdown */}
                        {movieSearchResults.length > 0 && (
                          <div className="absolute z-20 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                            {movieSearchResults.map((movie) => (
                              <button
                                key={movie.id}
                                onClick={() => handleSelectMovie(movie)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center gap-3"
                              >
                                {movie.poster_url && (
                                  <img
                                    src={movie.poster_url}
                                    alt={movie.title}
                                    className="w-12 h-16 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="text-white font-medium">{movie.title}</p>
                                  <p className="text-xs text-gray-400">{movie.genre}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Selected Movies */}
                      {selectedMovies.length > 0 && (
                        <div className="space-y-2">
                          {selectedMovies.map((movie) => (
                            <div
                              key={movie.id}
                              className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg"
                            >
                              {movie.poster_url && (
                                <img
                                  src={movie.poster_url}
                                  alt={movie.title}
                                  className="w-10 h-14 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">{movie.title}</p>
                                <p className="text-xs text-gray-400">{movie.id}</p>
                              </div>
                              <button
                                onClick={() => handleRemoveMovie(movie.id)}
                                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Manual ID Input for COMBOS/TICKETS */}
                      <div className="relative mb-3">
                        <input
                          type="text"
                          placeholder={`Enter ${formData.applicable_to === 'COMBOS' ? 'combo' : 'ticket'} IDs, separated by commas...`}
                          value={formData.applicable_items?.join(', ') || ''}
                          onChange={(e) => {
                            const items = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                            setFormData(prev => ({ ...prev, applicable_items: items }));
                          }}
                          className="w-full px-4 py-2.5 bg-gray-800 border border-blue-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                      
                      {/* Selected IDs Display */}
                      {formData.applicable_items && formData.applicable_items.length > 0 && (
                        <div className="space-y-2">
                          {formData.applicable_items.map((itemId, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-800 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                {formData.applicable_to === 'COMBOS' ? (
                                  <span className="text-2xl">🍿</span>
                                ) : (
                                  <span className="text-2xl">🎫</span>
                                )}
                                <div>
                                  <p className="text-white text-sm font-medium">{itemId}</p>
                                  <p className="text-xs text-gray-400">
                                    {formData.applicable_to === 'COMBOS' ? 'Combo ID' : 'Ticket ID'}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const newItems = formData.applicable_items?.filter((_, i) => i !== index) || [];
                                  setFormData(prev => ({ ...prev, applicable_items: newItems }));
                                }}
                                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  
                  <p className="text-xs text-blue-300/70 mt-2">
                    💡 {formData.applicable_to === 'MOVIES' 
                      ? 'Search and select movies from the list. Leave empty = apply to all movies' 
                      : `Enter list of ${formData.applicable_to === 'COMBOS' ? 'combo' : 'ticket'} IDs, separated by commas. Leave empty = apply to all`}
                  </p>
                </div>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={handleCheckboxChange}
                className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-red-600 focus:ring-red-600 focus:ring-offset-gray-900"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-300">
                Active (Users can use this promotion)
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-800">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {isSaving && <Loader2 size={18} className="animate-spin" />}
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/promotions')}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
