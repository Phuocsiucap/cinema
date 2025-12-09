import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Loader2, MapPin, Building2, Save } from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { cinemaService } from '../../services';
import type { Cinema } from '../../types/cinema';

// Cinema form data
interface CinemaFormData {
  name: string;
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  description: string;
  is_active: boolean;
}

export function EditCinemaPage() {
  const navigate = useNavigate();
  const { cinemaId } = useParams<{ cinemaId: string }>();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cinema, setCinema] = useState<Cinema | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<CinemaFormData>({
    name: '',
    address: '',
    city: '',
    latitude: '',
    longitude: '',
    description: '',
    is_active: true,
  });

  // Fetch cinema data on mount
  useEffect(() => {
    const fetchCinema = async () => {
      if (!cinemaId) return;
      
      try {
        setIsFetching(true);
        const data = await cinemaService.getCinema(cinemaId);
        setCinema(data);
        setFormData({
          name: data.name || '',
          address: data.address || '',
          city: data.city || '',
          latitude: data.latitude?.toString() || '',
          longitude: data.longitude?.toString() || '',
          description: data.description || '',
          is_active: data.is_active ?? true,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch cinema');
      } finally {
        setIsFetching(false);
      }
    };

    fetchCinema();
  }, [cinemaId]);

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cinemaId) {
      setError('Cinema ID not found');
      return;
    }

    if (!formData.name || !formData.address || !formData.city) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prepare data for API
      const cinemaData = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        description: formData.description || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        is_active: formData.is_active,
      };

      // Call API to update cinema
      await cinemaService.updateCinema(cinemaId, cinemaData);
      
      // Navigate back to cinemas list
      navigate('/admin/cinemas');
    } catch (err) {
      console.error('Error updating cinema:', err);
      setError(err instanceof Error ? err.message : 'Failed to update cinema');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin text-pink-500 mx-auto mb-4" />
            <p className="text-gray-400">Đang tải thông tin...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!cinema) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-400 mb-4">Cinema not found</p>
            <button
              onClick={() => navigate('/admin/cinemas')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
            >
              Back to list
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <span className="hover:text-white cursor-pointer" onClick={() => navigate('/admin')}>
            Dashboard
          </span>
          <ChevronRight size={16} />
          <span className="hover:text-white cursor-pointer" onClick={() => navigate('/admin/cinemas')}>
            Cinemas
          </span>
          <ChevronRight size={16} />
          <span className="text-white">Edit Cinema</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-pink-600/20 rounded-lg">
              <Building2 size={28} className="text-pink-500" />
            </div>
            <h1 className="text-3xl font-bold text-white">Edit Cinema Information</h1>
          </div>
          <p className="text-gray-400 ml-14">Cập nhật thông tin rạp: {cinema.name}</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Cinema Details */}
          <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <MapPin size={20} className="text-pink-500" />
              Thông tin rạp
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cinema Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tên rạp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#0f0f1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
                  placeholder="VD: CGV Vincom Thủ Đức"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Địa chỉ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#0f0f1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
                  placeholder="VD: 216 Võ Văn Ngân"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Thành phố <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#0f0f1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
                  placeholder="VD: Hồ Chí Minh"
                />
              </div>

              {/* Latitude */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Vĩ độ (Latitude)
                </label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  step="any"
                  className="w-full px-4 py-3 bg-[#0f0f1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
                  placeholder="VD: 10.8505"
                />
              </div>

              {/* Longitude */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Kinh độ (Longitude)
                </label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  step="any"
                  className="w-full px-4 py-3 bg-[#0f0f1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
                  placeholder="VD: 106.7718"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0f0f1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 resize-none"
                  placeholder="Mô tả về rạp chiếu phim..."
                />
              </div>

              {/* Is Active */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded border-gray-600 bg-[#0f0f1a] text-pink-600 focus:ring-pink-500 focus:ring-offset-0"
                  />
                  <span className="text-gray-300">Rạp đang hoạt động</span>
                </label>
              </div>
            </div>
          </div>

          {/* Rooms Section */}
          <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Phòng chiếu ({cinema.rooms.length})</h2>
              <button
                type="button"
                onClick={() => navigate(`/admin/cinemas/${cinemaId}/rooms/add`)}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-sm"
              >
                Add Room
              </button>
            </div>
            
            {cinema.rooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cinema.rooms.map(room => (
                  <div
                    key={room.id}
                    className="bg-[#0f0f1a] border border-gray-700 rounded-lg p-4 hover:border-pink-500/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/cinemas/${cinemaId}/rooms/${room.id}/edit`)}
                  >
                    <h3 className="font-medium text-white mb-2">{room.name}</h3>
                    <p className="text-sm text-gray-400">{room.seat_count} ghế</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No screening rooms yet</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/cinemas')}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-8 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

export default EditCinemaPage;
