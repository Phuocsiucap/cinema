import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, Loader2, Tag, Calendar, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { ConfirmModal } from '../../components/ui';
import { promotionService, type Promotion } from '../../services/promotionService';

const ITEMS_PER_PAGE = 10;

export function PromotionsPage() {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPromotions, setTotalPromotions] = useState(0);
  const totalPages = Math.ceil(totalPromotions / ITEMS_PER_PAGE);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; promotion: Promotion | null }>({
    isOpen: false,
    promotion: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, [currentPage, searchQuery, statusFilter]);

  const fetchPromotions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params: any = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      };

      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.is_active = statusFilter === 'active';

      const data = await promotionService.getPromotions(params);
      setPromotions(data.promotions);
      setTotalPromotions(data.total);
    } catch (err) {
      setError('Failed to load promotions');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.promotion) return;

    try {
      setIsDeleting(true);
      await promotionService.deletePromotion(deleteModal.promotion.id);
      setDeleteModal({ isOpen: false, promotion: null });
      fetchPromotions();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete promotion');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
        Active
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400">
        Inactive
      </span>
    );
  };

  const getDiscountDisplay = (promotion: Promotion) => {
    if (promotion.discount_type === 'PERCENTAGE') {
      return `${promotion.discount_value}%`;
    }
    return `$${promotion.discount_value}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getApplicableLabel = (applicableTo?: string) => {
    switch (applicableTo) {
      case 'MOVIES': return 'Phim';
      case 'COMBOS': return 'Combo';
      case 'TICKETS': return 'Tickets';
      default: return 'All';
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
        <div className="text-sm text-gray-400">
          Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalPromotions)} to{' '}
          {Math.min(currentPage * ITEMS_PER_PAGE, totalPromotions)} of {totalPromotions} promotions
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="px-4 py-2 text-sm text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-950 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Promotions Management</h1>
              <p className="text-gray-400">Manage discount codes and promotional campaigns</p>
            </div>
            <button
              onClick={() => navigate('/admin/promotions/add')}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus size={20} />
              Add Promotion
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Tag className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Promotions</p>
                <p className="text-2xl font-bold text-white">{totalPromotions}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <TrendingUp className="text-green-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Active Promotions</p>
                <p className="text-2xl font-bold text-white">
                  {promotions.filter((p) => p.is_active).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Calendar className="text-purple-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Inactive Promotions</p>
                <p className="text-2xl font-bold text-white">
                  {promotions.filter((p) => !p.is_active).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by title or code..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-600"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-left text-white flex items-center justify-between hover:border-gray-600 transition-colors"
              >
                <span className="text-gray-300">
                  {statusFilter === 'active'
                    ? 'Active'
                    : statusFilter === 'inactive'
                    ? 'Inactive'
                    : 'All Status'}
                </span>
                <ChevronLeft
                  size={16}
                  className={`text-gray-400 transition-transform ${
                    showStatusDropdown ? '-rotate-90' : 'rotate-180'
                  }`}
                />
              </button>
              {showStatusDropdown && (
                <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                  {['all', 'active', 'inactive'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status === 'all' ? '' : status);
                        setShowStatusDropdown(false);
                        setCurrentPage(1);
                      }}
                      className="w-full px-4 py-2.5 text-left text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                      {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Promotions Table */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-red-500" size={40} />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={fetchPromotions}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : promotions.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="mx-auto mb-4 text-gray-600" size={48} />
                <p className="text-gray-400 mb-4">No promotions found</p>
                <button
                  onClick={() => navigate('/admin/promotions/add')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Add First Promotion
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-800/50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Discount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Conditions
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Usage
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Valid Period
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {promotions.map((promotion) => (
                        <tr key={promotion.id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="px-4 py-4">
                            <span className="font-mono text-sm text-blue-400 font-semibold">
                              {promotion.code}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-white font-medium">{promotion.title}</p>
                            {promotion.description && (
                              <p className="text-sm text-gray-400 line-clamp-1">
                                {promotion.description}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-green-400 font-semibold">
                              {getDiscountDisplay(promotion)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-500">Applies to:</span>
                                <span className="text-gray-300 font-medium">
                                  {getApplicableLabel(promotion.applicable_to)}
                                </span>
                              </div>
                              {promotion.min_tickets && promotion.min_tickets > 1 && (
                                <div className="text-gray-400">
                                  Min {promotion.min_tickets} tickets
                                </div>
                              )}
                              {promotion.min_purchase && (
                                <div className="text-gray-400">
                                  Min {promotion.min_purchase.toLocaleString()} VND
                                </div>
                              )}
                              {promotion.applicable_items && promotion.applicable_items.length > 0 && (
                                <div className="text-blue-400">
                                  {promotion.applicable_items.length} item(s)
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-gray-400 text-sm">
                            {promotion.used_count} / {promotion.usage_limit || '∞'}
                          </td>
                          <td className="px-4 py-4 text-gray-400 text-sm">
                            <div>{formatDate(promotion.start_date)}</div>
                            <div className="text-xs">to {formatDate(promotion.end_date)}</div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {getStatusBadge(promotion.is_active)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => navigate(`/admin/promotions/edit/${promotion.id}`)}
                                className="p-1.5 rounded-md text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                                title="Edit promotion"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => setDeleteModal({ isOpen: true, promotion })}
                                className="p-1.5 rounded-md text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                title="Delete promotion"
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
                {renderPagination()}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, promotion: null })}
        onConfirm={handleDelete}
        title="Delete Promotion"
        message={`Are you sure you want to delete "${deleteModal.promotion?.code}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
        variant="danger"
      />
    </AdminLayout>
  );
}
