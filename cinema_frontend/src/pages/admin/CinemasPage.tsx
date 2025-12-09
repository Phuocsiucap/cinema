import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building2, 
  Loader2,
  ChevronDown
} from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { cinemaService } from '../../services';
import type { Cinema } from '../../types/cinema';

export function CinemasPage() {
  const navigate = useNavigate();
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch cinemas
  useEffect(() => {
    fetchCinemas();
  }, []);

  const fetchCinemas = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await cinemaService.getCinemas();
      setCinemas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cinemas');
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique cities for filter
  const cities = [...new Set(cinemas.map(c => c.city))];

  // Filter cinemas by search term and city
  const filteredCinemas = cinemas.filter(cinema => {
    const matchesSearch = cinema.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cinema.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter === 'all' || cinema.city === cityFilter;
    return matchesSearch && matchesCity;
  });

  // Handle delete
  const handleDelete = async () => {
    if (!selectedCinema) return;
    
    try {
      setIsDeleting(true);
      setError(null);
      await cinemaService.deleteCinema(selectedCinema.id);
      setCinemas(cinemas.filter(c => c.id !== selectedCinema.id));
      setDeleteModalOpen(false);
      setSelectedCinema(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete cinema');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open delete modal
  const openDeleteModal = (cinema: Cinema) => {
    setSelectedCinema(cinema);
    setDeleteModalOpen(true);
  };

  // Get room count from rooms array
  const getRoomCount = (cinema: Cinema) => {
    return cinema.rooms?.length || cinema.total_rooms || 0;
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Manage Cinemas</h1>
            <p className="text-gray-400 mt-1">
              View, edit, and manage all cinema locations.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/cinemas/add')}
            className="flex items-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
            Add New Cinema
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
            />
          </div>
          <div className="relative">
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="appearance-none px-4 py-2.5 pr-10 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 cursor-pointer min-w-[160px]"
            >
              <option value="all">Filter by City</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={40} className="animate-spin text-pink-500" />
          </div>
        ) : filteredCinemas.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <Building2 size={64} className="mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-medium text-white mb-2">
              {searchTerm || cityFilter !== 'all' ? 'No cinemas found' : 'No cinemas yet'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || cityFilter !== 'all' ? 'Try a different search or filter' : 'Start by adding your first cinema'}
            </p>
            {!searchTerm && cityFilter === 'all' && (
              <button
                onClick={() => navigate('/admin/cinemas/add')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-lg transition-colors"
              >
                <Plus size={20} />
                Add New Cinema
              </button>
            )}
          </div>
        ) : (
          /* Cinemas Table */
          <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Name</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">City</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Address</th>
                  <th className="text-center px-6 py-4 text-gray-400 font-medium text-sm">Rooms</th>
                  <th className="text-right px-6 py-4 text-gray-400 font-medium text-sm w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filteredCinemas.map((cinema) => (
                  <tr 
                    key={cinema.id} 
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{cinema.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400">{cinema.city}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400">{cinema.address}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-white">{getRoomCount(cinema)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/cinemas/${cinema.id}/edit`)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(cinema)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && selectedCinema && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-2">Confirm Delete</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete <span className="text-white font-medium">"{selectedCinema.name}"</span>? 
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setSelectedCinema(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default CinemasPage;
