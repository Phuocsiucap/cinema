import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight,
  Upload,
  Plus,
  X,
  Loader2,
  Users,
  Search,
  Image as ImageIcon,
  Link as LinkIcon,
  Youtube,
  Eye,
  Trash2,
  FileUp
} from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import {
  type MovieCreate,
  type CastMember,
  type Actor,
  RATING_OPTIONS,
  STATUS_OPTIONS,
  GENRE_OPTIONS
} from '../../types/movie';
import { movieService, actorService, uploadService } from '../../services';

interface ActorSuggestion {
  id: string;
  name: string;
  photo_url: string;
}

// Mở rộng type CastMember trong file này để hỗ trợ file upload tạm thời
interface CastMemberState extends CastMember {
  photo_file?: File | null;
  photo_preview?: string | null; // Dùng để hiển thị preview khi upload file
}

type TabType = 'basic' | 'details';
type InputMode = 'url' | 'upload';

// --- COMPONENT: MEDIA INPUT (Dùng cho Poster & Background) ---
const MediaInput = ({
  label,
  subLabel,
  value,
  onChange,
  onFileChange,
  previewUrl,
  onClear
}: {
  label: string;
  subLabel?: string;
  value: string;
  onChange: (val: string) => void;
  onFileChange: (file: File | null) => void;
  previewUrl: string | null;
  onClear: () => void;
}) => {
  const [mode, setMode] = useState<InputMode>('url');

  return (
    <div className="bg-[#2a2a2a] p-4 rounded-lg border border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-300">
            {label}
          </label>
          {subLabel && <p className="text-xs text-gray-500 mt-1">{subLabel}</p>}
        </div>

        <div className="flex bg-gray-800 rounded-lg p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-3 py-1.5 rounded-md transition-colors ${mode === 'url' ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            URL
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-3 py-1.5 rounded-md transition-colors ${mode === 'upload' ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            Upload
          </button>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        <div className="flex-1">
          {mode === 'url' ? (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon size={16} className="text-gray-500" />
              </div>
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  onChange(e.target.value);
                  onFileChange(null);
                }}
                placeholder={`https://example.com/image.jpg`}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 hover:bg-gray-800 transition-colors text-center cursor-pointer relative group">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onFileChange(file);
                    onChange('');
                  }
                }}
              />
              <Upload className="mx-auto text-gray-400 mb-2 group-hover:text-red-500 transition-colors" size={24} />
              <p className="text-sm text-gray-400 group-hover:text-gray-300">
                Click or drag file
              </p>
            </div>
          )}
        </div>

        <div className="w-24 h-32 flex-shrink-0 bg-gray-800 border border-gray-600 rounded-lg overflow-hidden relative group">
          {previewUrl || value ? (
            <>
              <img
                src={previewUrl || value}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Error'; }}
              />
              <button
                type="button"
                onClick={onClear}
                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <ImageIcon size={24} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: CAST PHOTO INPUT (Nhỏ gọn hơn cho list) ---
const CastPhotoInput = ({
  value,
  onChange,
  onFileChange
}: {
  value: string;
  onChange: (val: string) => void;
  onFileChange: (file: File) => void;
}) => {
  const [mode, setMode] = useState<InputMode>('url');

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-medium text-gray-400">Photo Source</label>
        <div className="flex bg-gray-900 rounded p-0.5">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${mode === 'url' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            URL
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${mode === 'upload' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Upload
          </button>
        </div>
      </div>

      {mode === 'url' ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      ) : (
        <div className="relative w-full h-[38px] border border-dashed border-gray-600 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors flex items-center justify-center cursor-pointer group">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileChange(file);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex items-center gap-2 text-gray-400 group-hover:text-white">
            <FileUp size={14} />
            <span className="text-xs">Select Image</span>
          </div>
        </div>
      )}
    </div>
  );
};

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

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  // Update state type to support local file handling
  const [castMembers, setCastMembers] = useState<CastMemberState[]>([]);

  // Actor search state
  const [actorSearchIndex, setActorSearchIndex] = useState<number | null>(null);
  const [actorSuggestions, setActorSuggestions] = useState<ActorSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // File states (Main Poster/Background)
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabs = [{ id: 'basic' as TabType, label: 'Basic Info' }, { id: 'details' as TabType, label: 'Details' }];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'duration_minutes' || name === 'imdb_rating' ? (value ? Number(value) : undefined) : value,
    }));
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) => prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]);
  };

  const handleAddCastMember = () => {
    setCastMembers((prev) => [
      ...prev,
      { name: '', role_name: '', photo_url: '', photo_file: null, photo_preview: null },
    ]);
  };

  const handleRemoveCastMember = (index: number) => {
    setCastMembers((prev) => prev.filter((_, i) => i !== index));
    setShowSuggestions(false);
  };

  const handleCastMemberChange = (index: number, field: keyof CastMemberState, value: any) => {
    setCastMembers((prev) =>
      prev.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      )
    );
  };

  // Hàm xử lý riêng cho việc upload ảnh Cast Member
  const handleCastPhotoFileChange = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setCastMembers((prev) =>
        prev.map((member, i) =>
          i === index ? {
            ...member,
            photo_file: file,
            photo_preview: reader.result as string, // Lưu preview để hiển thị
            photo_url: '' // Xóa URL cũ nếu upload file mới
          } : member
        )
      );
    };
    reader.readAsDataURL(file);
  };

  // Search Logic (giữ nguyên)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      if (index === actorSearchIndex) {
        setActorSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      }
    } catch (err) {
      console.error(err);
    }
  }, [actorSearchIndex]);

  const handleActorNameChange = (index: number, value: string) => {
    handleCastMemberChange(index, 'name', value);
    setActorSearchIndex(index);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => searchActorsFromAPI(value, index), 300);
  };

  useEffect(() => {
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, []);

  const handleSelectActor = (index: number, actor: ActorSuggestion) => {
    setCastMembers((prev) =>
      prev.map((member, i) =>
        i === index
          ? {
            ...member,
            actor_id: actor.id,
            name: actor.name,
            photo_url: actor.photo_url,
            photo_file: null,    // Reset file nếu chọn từ danh sách có sẵn
            photo_preview: null
          }
          : member
      )
    );
    setShowSuggestions(false);
    setActorSuggestions([]);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Title required';
    if (!formData.synopsis.trim()) errors.synopsis = 'Synopsis required';
    if (!formData.duration_minutes || formData.duration_minutes <= 0) errors.duration_minutes = 'Invalid duration';
    if (selectedGenres.length === 0) errors.genre = 'Select a genre';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError('Please fill in all required fields');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // Upload poster image
      let finalPosterUrl = formData.poster_url || undefined;
      if (posterFile) {
        // Upload file
        const posterUploadResult = await uploadService.uploadFile(posterFile);
        if (posterUploadResult.success) {
          finalPosterUrl = posterUploadResult.url;
        }
      } else if (formData.poster_url && formData.poster_url.trim()) {
        // Upload URL to Cloudinary
        const posterUploadResult = await uploadService.uploadFromUrl(formData.poster_url);
        if (posterUploadResult.success) {
          finalPosterUrl = posterUploadResult.url;
        }
      }

      // Upload background image
      let finalBgUrl = formData.background_url || undefined;
      if (bgFile) {
        // Upload file
        const bgUploadResult = await uploadService.uploadFile(bgFile);
        if (bgUploadResult.success) {
          finalBgUrl = bgUploadResult.url;
        }
      } else if (formData.background_url && formData.background_url.trim()) {
        // Upload URL to Cloudinary
        const bgUploadResult = await uploadService.uploadFromUrl(formData.background_url);
        if (bgUploadResult.success) {
          finalBgUrl = bgUploadResult.url;
        }
      }

      // Upload cast member photos
      const processedCastMembers: CastMember[] = await Promise.all(
        castMembers
          .filter((c) => c.name.trim() !== '')
          .map(async ({ photo_file, photo_preview, ...rest }) => {
            if (photo_file) {
              // Upload file
              const uploadResult = await uploadService.uploadFile(photo_file);
              if (uploadResult.success) {
                return { ...rest, photo_url: uploadResult.url };
              }
            } else if (rest.photo_url && rest.photo_url.trim()) {
              // Upload URL to Cloudinary
              const uploadResult = await uploadService.uploadFromUrl(rest.photo_url);
              if (uploadResult.success) {
                return { ...rest, photo_url: uploadResult.url };
              }
            }
            return rest;
          })
      );

      const movieData: MovieCreate = {
        ...formData,
        description: formData.description || undefined,
        release_date: formData.release_date || undefined,
        genre: selectedGenres.join(', '),
        rating: formData.rating || undefined,
        imdb_rating: formData.imdb_rating || undefined,
        trailer_url: formData.trailer_url || undefined,
        poster_url: finalPosterUrl,
        background_url: finalBgUrl,
        director: formData.director || undefined,
        cast_members: processedCastMembers,
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
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/admin" className="hover:text-white transition-colors">Admin</Link>
          <ChevronRight size={16} />
          <Link to="/admin/movies" className="hover:text-white transition-colors">Movies</Link>
          <ChevronRight size={16} />
          <span className="text-white">Add New</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-8">Add New Movie</h1>

        <div className="flex gap-6 border-b border-gray-800 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === tab.id ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
            >
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />}
            </button>
          ))}
        </div>

        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">{error}</div>}

        <div className="max-w-4xl">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* ... (Các field Basic Info giữ nguyên như cũ) ... */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Movie Title <span className="text-red-500">*</span></label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} className={`w-full px-4 py-3 bg-[#2a2a2a] border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 ${fieldErrors.title ? 'border-red-500' : 'border-gray-700'}`} />
                  {fieldErrors.title && <p className="text-red-500 text-xs mt-1">{fieldErrors.title}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                  <select name="rating" value={formData.rating} onChange={handleInputChange} className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500">
                    {RATING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Genre <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {GENRE_OPTIONS.map((g) => (
                    <button key={g} type="button" onClick={() => handleGenreToggle(g)} className={`px-3 py-1.5 rounded-full text-sm transition-colors ${selectedGenres.includes(g) ? 'bg-red-600 text-white' : 'bg-[#2a2a2a] text-gray-400 hover:bg-gray-700'}`}>{g}</button>
                  ))}
                </div>
                {fieldErrors.genre && <p className="text-red-500 text-xs mt-1">{fieldErrors.genre}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Synopsis <span className="text-red-500">*</span></label>
                <textarea name="synopsis" value={formData.synopsis} onChange={handleInputChange} rows={4} className={`w-full px-4 py-3 bg-[#2a2a2a] border rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:ring-red-500 ${fieldErrors.synopsis ? 'border-red-500' : 'border-gray-700'}`} />
                {fieldErrors.synopsis && <p className="text-red-500 text-xs mt-1">{fieldErrors.synopsis}</p>}
              </div>

              {/* ... (Các field Description, Date, Duration, Director, IMDB, Status giữ nguyên) ... */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Release Date</label>
                  <input type="date" name="release_date" value={formData.release_date} onChange={handleInputChange} className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Duration <span className="text-red-500">*</span></label>
                  <input type="number" name="duration_minutes" value={formData.duration_minutes || ''} onChange={handleInputChange} className={`w-full px-4 py-3 bg-[#2a2a2a] border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 ${fieldErrors.duration_minutes ? 'border-red-500' : 'border-gray-700'}`} />
                  {fieldErrors.duration_minutes && <p className="text-red-500 text-xs mt-1">{fieldErrors.duration_minutes}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Director</label>
                  <input type="text" name="director" value={formData.director} onChange={handleInputChange} className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">IMDB</label>
                  <input type="number" name="imdb_rating" value={formData.imdb_rating || ''} onChange={handleInputChange} step="0.1" max="10" className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500">
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Trailer */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Trailer URL</label>
                <div className="relative">
                  <Youtube size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500" />
                  <input type="text" name="trailer_url" value={formData.trailer_url} onChange={handleInputChange} placeholder="https://youtube.com..." className="w-full pl-10 pr-20 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
                  {formData.trailer_url && <a href={formData.trailer_url} target="_blank" rel="noreferrer" className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1.5 rounded flex items-center gap-1"><Eye size={12} /> Test</a>}
                </div>
              </div>

              {/* Media Inputs (Poster & Background) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MediaInput
                  label="Poster Image"
                  value={formData.poster_url || ''}
                  onChange={(url) => setFormData(prev => ({ ...prev, poster_url: url }))}
                  onFileChange={(file) => {
                    setPosterFile(file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setPosterPreview(reader.result as string);
                      reader.readAsDataURL(file);
                    } else setPosterPreview(null);
                  }}
                  previewUrl={posterPreview}
                  onClear={() => { setFormData(prev => ({ ...prev, poster_url: '' })); setPosterFile(null); setPosterPreview(null); }}
                />
                <MediaInput
                  label="Background Image"
                  subLabel="(Optional)"
                  value={formData.background_url || ''}
                  onChange={(url) => setFormData(prev => ({ ...prev, background_url: url }))}
                  onFileChange={(file) => {
                    setBgFile(file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setBgPreview(reader.result as string);
                      reader.readAsDataURL(file);
                    } else setBgPreview(null);
                  }}
                  previewUrl={bgPreview}
                  onClear={() => { setFormData(prev => ({ ...prev, background_url: '' })); setBgFile(null); setBgPreview(null); }}
                />
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Cast Members</h2>
                <button type="button" onClick={handleAddCastMember} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                  <Plus size={18} /> Add Cast Member
                </button>
              </div>

              {castMembers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No cast members added yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {castMembers.map((member, index) => (
                    <div key={index} className="bg-[#2a2a2a] border border-gray-700 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        {/* PHOTO PREVIEW (Avatar) */}
                        <div className="w-20 h-20 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-600">
                          {(member.photo_preview || member.photo_url) ? (
                            <img
                              src={member.photo_preview || member.photo_url}
                              alt={member.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Error'; }}
                            />
                          ) : (
                            <Users size={24} className="text-gray-600" />
                          )}
                        </div>

                        {/* FIELDS */}
                        <div className="flex-1 grid grid-cols-3 gap-4">
                          {/* Actor Name (Autocomplete) */}
                          <div className="relative" ref={actorSearchIndex === index ? suggestionRef : null}>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Actor Name</label>
                            <div className="relative">
                              <input
                                type="text"
                                value={member.name}
                                onChange={(e) => handleActorNameChange(index, e.target.value)}
                                onFocus={() => { setActorSearchIndex(index); if (member.name?.trim()) searchActorsFromAPI(member.name, index); }}
                                placeholder="Search actor..."
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 pr-8"
                              />
                              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            </div>
                            {showSuggestions && actorSearchIndex === index && actorSuggestions.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                                {actorSuggestions.map((actor) => (
                                  <button key={actor.id} type="button" onClick={() => handleSelectActor(index, actor)} className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-700 transition-colors text-left">
                                    <img src={actor.photo_url} alt={actor.name} className="w-8 h-8 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=?'; }} />
                                    <span className="text-white text-sm">{actor.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Role Name */}
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Role Name</label>
                            <input
                              type="text"
                              value={member.role_name || ''}
                              onChange={(e) => handleCastMemberChange(index, 'role_name', e.target.value)}
                              placeholder="Character name"
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          </div>

                          {/* NEW: PHOTO INPUT (URL or Upload) */}
                          <div>
                            <CastPhotoInput
                              value={member.photo_url || ''}
                              onChange={(val) => {
                                handleCastMemberChange(index, 'photo_url', val);
                                handleCastMemberChange(index, 'photo_preview', null); // Clear preview if typing URL
                                handleCastMemberChange(index, 'photo_file', null);
                              }}
                              onFileChange={(file) => handleCastPhotoFileChange(index, file)}
                            />
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button type="button" onClick={() => handleRemoveCastMember(index)} className="p-2 text-gray-400 hover:text-red-500 transition-colors mt-6">
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

        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-800">
          <button type="button" onClick={() => navigate('/admin/movies')} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={isLoading} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50">
            {isLoading && <Loader2 size={18} className="animate-spin" />} Add Movie
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}