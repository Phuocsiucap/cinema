import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Upload, Plus, X, Loader2, Users, Search } from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { 
  type MovieCreate, 
  type CastMember,
  type Actor,
  RATING_OPTIONS, 
  STATUS_OPTIONS, 
  GENRE_OPTIONS 
} from '../../types/movie';
import { movieService, actorService } from '../../services';

interface ActorSuggestion {
  id: string;
  name: string;
  photo_url: string;
}

type TabType = 'basic' | 'details';

export function AddMoviePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<MovieCreate>({
    title: '',
    synopsis: '',
    description: '',
    duration_minutes: 0,
    release_date: '',
    genre: '',
    rating: 'G',
    imdb_rating: undefined,
    trailer_url: '',
    poster_url: '',
    background_url: '',
    director: '',
    status: 'upcoming',
    cast_members: [],
  });

  // Selected genres
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Cast members state
  const [castMembers, setCastMembers] = useState<CastMember[]>([]);

  // Actor search/autocomplete state
  const [actorSearchIndex, setActorSearchIndex] = useState<number | null>(null);
  const [actorSuggestions, setActorSuggestions] = useState<ActorSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Poster preview (for uploaded file)
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const [posterFile, setPosterFile] = useState<File | null>(null); // For future upload to server

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabs = [
    { id: 'basic' as TabType, label: 'Basic Info' },
    { id: 'details' as TabType, label: 'Details' },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'duration_minutes' || name === 'imdb_rating' 
        ? (value ? Number(value) : undefined) 
        : value,
    }));
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genre)) {
        return prev.filter((g) => g !== genre);
      }
      return [...prev, genre];
    });
  };

  const handleAddCastMember = () => {
    setCastMembers((prev) => [
      ...prev,
      { name: '', role_name: '', photo_url: '' },
    ]);
  };

  const handleRemoveCastMember = (index: number) => {
    setCastMembers((prev) => prev.filter((_, i) => i !== index));
    setShowSuggestions(false);
  };

  const handleCastMemberChange = (
    index: number,
    field: keyof CastMember,
    value: string
  ) => {
    setCastMembers((prev) =>
      prev.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      )
    );
  };

  // Debounce ref for actor search
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search actors by name using API
  const searchActorsFromAPI = useCallback(async (query: string, index: number) => {
    if (!query.trim()) {
      setActorSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    try {
      const actors = await actorService.searchActors(query, 5);
      const suggestions: ActorSuggestion[] = actors.map((actor: Actor) => ({
        id: String(actor.id),
        name: actor.name,
        photo_url: actor.photo_url || '',
      }));
      
      // Only update if this is still the active search index
      if (index === actorSearchIndex) {
        setActorSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      }
    } catch (err) {
      console.error('Failed to search actors:', err);
      setActorSuggestions([]);
      setShowSuggestions(false);
    }
  }, [actorSearchIndex]);

  // Handle actor name input change with search
  const handleActorNameChange = (index: number, value: string) => {
    handleCastMemberChange(index, 'name', value);
    setActorSearchIndex(index);
    
    // Clear previous debounce
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    // Debounce the API call
    searchDebounceRef.current = setTimeout(() => {
      searchActorsFromAPI(value, index);
    }, 300);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Select actor from suggestions
  const handleSelectActor = (index: number, actor: ActorSuggestion) => {
    setCastMembers((prev) =>
      prev.map((member, i) =>
        i === index
          ? { ...member, actor_id: actor.id, name: actor.name, photo_url: actor.photo_url }
          : member
      )
    );
    setShowSuggestions(false);
    setActorSuggestions([]);
  };

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      // Clear poster URL when uploading file
      setFormData((prev) => ({ ...prev, poster_url: '' }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePosterUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, poster_url: value }));
    // Clear uploaded file when entering URL
    if (value) {
      setPosterPreview(null);
      setPosterFile(null);
    }
  };

  const clearPosterUpload = () => {
    setPosterPreview(null);
    setPosterFile(null);
  };

  // Validate form trước khi submit
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Movie title cannot be empty';
    }
    if (!formData.synopsis.trim()) {
      errors.synopsis = 'Movie synopsis cannot be empty';
    }
    if (!formData.duration_minutes || formData.duration_minutes <= 0) {
      errors.duration_minutes = 'Thời lượng phải lớn hơn 0';
    }
    if (selectedGenres.length === 0) {
      errors.genre = 'Please select at least one genre';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    // Validate trước
    if (!validateForm()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const movieData: MovieCreate = {
        title: formData.title,
        synopsis: formData.synopsis,
        description: formData.description || undefined,
        duration_minutes: formData.duration_minutes,
        release_date: formData.release_date || undefined,
        genre: selectedGenres.join(', '),
        rating: formData.rating || undefined,
        imdb_rating: formData.imdb_rating || undefined,
        trailer_url: formData.trailer_url || undefined,
        poster_url: formData.poster_url || undefined,
        background_url: formData.background_url || undefined,
        director: formData.director || undefined,
        status: formData.status,
        cast_members: castMembers.filter((c) => c.name.trim() !== ''),
      };

      await movieService.createMovie(movieData);
      navigate('/admin/movies');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create movie');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <span>Admin</span>
          <ChevronRight size={16} />
          <span>Movies</span>
          <ChevronRight size={16} />
          <span className="text-white">Add New</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-8">Add New Movie</h1>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-800 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-red-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
              )}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Tab Content */}
        <div className="max-w-4xl">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Movie Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Movie Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter the movie title"
                    className={`w-full px-4 py-3 bg-[#2a2a2a] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 ${fieldErrors.title ? 'border-red-500' : 'border-gray-700'}`}
                  />
                  {fieldErrors.title && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.title}</p>
                  )}
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rating
                  </label>
                  <select
                    name="rating"
                    value={formData.rating}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {RATING_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Genre */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Genre <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {GENRE_OPTIONS.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => handleGenreToggle(genre)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedGenres.includes(genre)
                          ? 'bg-red-600 text-white'
                          : 'bg-[#2a2a2a] text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
                {fieldErrors.genre && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.genre}</p>
                )}
              </div>

              {/* Synopsis */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Synopsis <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="synopsis"
                  value={formData.synopsis}
                  onChange={handleInputChange}
                  placeholder="Enter a brief summary of the movie..."
                  rows={4}
                  className={`w-full px-4 py-3 bg-[#2a2a2a] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none ${fieldErrors.synopsis ? 'border-red-500' : 'border-gray-700'}`}
                />
                {fieldErrors.synopsis && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.synopsis}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter detailed description..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Release Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Release Date
                  </label>
                  <input
                    type="date"
                    name="release_date"
                    value={formData.release_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="duration_minutes"
                    value={formData.duration_minutes || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 148"
                    className={`w-full px-4 py-3 bg-[#2a2a2a] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 ${fieldErrors.duration_minutes ? 'border-red-500' : 'border-gray-700'}`}
                  />
                  {fieldErrors.duration_minutes && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.duration_minutes}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Director */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Director
                  </label>
                  <input
                    type="text"
                    name="director"
                    value={formData.director}
                    onChange={handleInputChange}
                    placeholder="Enter director's name"
                    className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* IMDB Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    IMDB Rating
                  </label>
                  <input
                    type="number"
                    name="imdb_rating"
                    value={formData.imdb_rating || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 8.5"
                    step="0.1"
                    min="0"
                    max="10"
                    className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trailer URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Trailer URL
                </label>
                <input
                  type="text"
                  name="trailer_url"
                  value={formData.trailer_url}
                  onChange={handleInputChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Poster URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Poster URL
                </label>
                <input
                  type="text"
                  name="poster_url"
                  value={formData.poster_url}
                  onChange={handlePosterUrlChange}
                  placeholder="https://image.tmdb.org/..."
                  disabled={!!posterPreview}
                  className={`w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    posterPreview ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Background URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Background URL
                  <span className="text-gray-500 font-normal ml-2">(Optional - for movie detail page)</span>
                </label>
                <input
                  type="text"
                  name="background_url"
                  value={formData.background_url}
                  onChange={handleInputChange}
                  placeholder="https://image.tmdb.org/t/p/original/..."
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {formData.background_url && (
                  <div className="mt-3">
                    <img
                      src={formData.background_url}
                      alt="Background preview"
                      className="max-h-32 rounded-lg w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                {posterPreview && (
                  <p className="mt-1 text-xs text-yellow-500">
                    Image uploaded, delete image to enter URL
                  </p>
                )}
                {/* Poster Preview from URL */}
                {formData.poster_url && !posterPreview && (
                  <div className="mt-3">
                    <img
                      src={formData.poster_url}
                      alt="Poster preview"
                      className="max-h-48 rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Poster Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Or Upload Poster Image
                </label>
                <div className={`border-2 border-dashed border-gray-700 rounded-lg p-6 text-center transition-colors ${
                  formData.poster_url ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-600'
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePosterChange}
                    className="hidden"
                    id="poster-upload"
                    disabled={!!formData.poster_url}
                  />
                  <label 
                    htmlFor="poster-upload" 
                    className={formData.poster_url ? 'cursor-not-allowed' : 'cursor-pointer'}
                  >
                    {posterPreview ? (
                      <div className="space-y-3">
                        <img
                          src={posterPreview}
                          alt="Poster preview"
                          className="max-h-48 mx-auto rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            clearPosterUpload();
                          }}
                          className="text-red-500 hover:text-red-400 text-sm flex items-center gap-1 mx-auto"
                        >
                          <X size={16} />
                          Delete image
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload size={28} className="mx-auto text-gray-500" />
                        <p className="text-gray-400 text-sm">
                          <span className="text-red-500">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-gray-500 text-xs">
                          SVG, PNG, JPG or GIF (MAX. 800x1200px)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
                {formData.poster_url && (
                  <p className="mt-1 text-xs text-yellow-500">
                    URL entered, delete URL to upload image
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Details Tab - Cast Members */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Cast Members</h2>
                <button
                  type="button"
                  onClick={handleAddCastMember}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={18} />
                  Add Cast Member
                </button>
              </div>

              {castMembers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No cast members added yet.</p>
                  <p className="text-sm">Click "Add Cast Member" to add actors.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {castMembers.map((member, index) => (
                    <div
                      key={index}
                      className="bg-[#2a2a2a] border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-4">
                        {/* Photo Preview */}
                        <div className="w-20 h-20 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {member.photo_url ? (
                            <img
                              src={member.photo_url}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Upload size={24} className="text-gray-600" />
                          )}
                        </div>

                        {/* Fields */}
                        <div className="flex-1 grid grid-cols-3 gap-4">
                          {/* Actor Name with Autocomplete */}
                          <div className="relative" ref={actorSearchIndex === index ? suggestionRef : null}>
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                              Actor Name
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={member.name}
                                onChange={(e) => handleActorNameChange(index, e.target.value)}
                                onFocus={() => {
                                  setActorSearchIndex(index);
                                  if (member.name && member.name.trim()) {
                                    searchActorsFromAPI(member.name, index);
                                  }
                                }}
                                placeholder="Search actor..."
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 pr-8"
                              />
                              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            </div>
                            
                            {/* Actor Suggestions Dropdown */}
                            {showSuggestions && actorSearchIndex === index && actorSuggestions.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl overflow-hidden">
                                {actorSuggestions.map((actor) => (
                                  <button
                                    key={actor.id}
                                    type="button"
                                    onClick={() => handleSelectActor(index, actor)}
                                    className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-700 transition-colors text-left"
                                  >
                                    <img
                                      src={actor.photo_url}
                                      alt={actor.name}
                                      className="w-8 h-8 rounded-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=?';
                                      }}
                                    />
                                    <span className="text-white text-sm">{actor.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                            
                            {/* Show actor_id if selected from list */}
                            {member.actor_id && (
                              <p className="text-xs text-green-500 mt-1">✓ Selected from list</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                              Role Name
                            </label>
                            <input
                              type="text"
                              value={member.role_name || ''}
                              onChange={(e) =>
                                handleCastMemberChange(index, 'role_name', e.target.value)
                              }
                              placeholder="Character name"
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                              Photo URL
                            </label>
                            <input
                              type="text"
                              value={member.photo_url || ''}
                              onChange={(e) =>
                                handleCastMemberChange(index, 'photo_url', e.target.value)
                              }
                              placeholder="https://..."
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveCastMember(index)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-800">
          <button
            type="button"
            onClick={() => navigate('/admin/movies')}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && <Loader2 size={18} className="animate-spin" />}
            Add Movie
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
