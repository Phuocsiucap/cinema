import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Edit2, 
  Trash2, 
  Loader2,
  ChevronDown,
  X,
  Users
} from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { ConfirmModal } from '../../components/ui';
import { userService, type UserFilters, type PaginatedUsers } from '../../services/userService';
import type { User } from '../../types/auth';

const ITEMS_PER_PAGE = 10;

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'seller', label: 'Seller' },
  { value: 'customer', label: 'Customer' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

const VERIFIED_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Verified' },
  { value: 'false', label: 'Unverified' },
];

export function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');

  // Dropdown states
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showVerifiedDropdown, setShowVerifiedDropdown] = useState(false);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filters: UserFilters = {};
      
      if (debouncedSearch) {
        filters.search = debouncedSearch;
      }
      if (roleFilter) {
        filters.role = roleFilter as 'customer' | 'admin' | 'seller';
      }
      if (statusFilter) {
        filters.is_active = statusFilter === 'true';
      }
      if (verifiedFilter) {
        filters.is_verified = verifiedFilter === 'true';
      }

      const skip = (currentPage - 1) * ITEMS_PER_PAGE;
      const result: PaginatedUsers = await userService.getUsers(skip, ITEMS_PER_PAGE, filters);
      
      setUsers(result.users);
      setTotalUsers(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, roleFilter, statusFilter, verifiedFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async () => {
    if (!deleteModal.user) return;

    setIsDeleting(true);
    try {
      await userService.deleteUser(deleteModal.user.id);
      setDeleteModal({ isOpen: false, user: null });
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400">
            Admin
          </span>
        );
      case 'seller':
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-medium text-yellow-400">
            Seller
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-500/20 px-3 py-1 text-xs font-medium text-gray-400">
            Customer
          </span>
        );
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-400">
        Inactive
      </span>
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
    setStatusFilter('');
    setVerifiedFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || roleFilter || statusFilter || verifiedFilter;

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return (
      <div className="flex justify-between items-center mt-4 px-2">
        <p className="text-sm text-gray-400">
          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalUsers)} of {totalUsers} results
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>
          
          {pages.map((page, index) => (
            typeof page === 'number' ? (
              <button
                key={index}
                onClick={() => setCurrentPage(page)}
                className={`flex items-center justify-center h-8 w-8 rounded-lg text-sm transition-colors ${
                  currentPage === page
                    ? 'bg-red-600 text-white font-bold'
                    : 'hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {page}
              </button>
            ) : (
              <span key={index} className="flex items-center justify-center h-8 w-8 text-gray-400 text-sm">
                ...
              </span>
            )
          ))}
          
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h1 className="text-white text-4xl font-black leading-tight tracking-tight">
              Manage Users
            </h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="w-full">
              <label className="flex flex-col h-12 w-full">
                <div className="flex w-full flex-1 items-stretch rounded-lg h-full bg-white/5 border border-white/10 focus-within:border-red-500">
                  <div className="text-gray-400 flex items-center justify-center pl-4">
                    <Search size={20} />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex w-full min-w-0 flex-1 bg-transparent h-full placeholder:text-gray-500 px-4 text-base text-white focus:outline-none"
                    placeholder="Search by name, email, or phone..."
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-gray-400 hover:text-white px-3"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </label>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-3">
              {/* Role Filter */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowRoleDropdown(!showRoleDropdown);
                    setShowStatusDropdown(false);
                    setShowVerifiedDropdown(false);
                  }}
                  className={`flex h-8 items-center justify-center gap-2 rounded-lg border pl-3 pr-2 transition-colors ${
                    roleFilter
                      ? 'bg-red-600/20 border-red-500 text-red-400'
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-gray-300'
                  }`}
                >
                  <span className="text-sm font-medium">
                    {roleFilter ? ROLE_OPTIONS.find(r => r.value === roleFilter)?.label : 'Role'}
                  </span>
                  <ChevronDown size={16} />
                </button>
                {showRoleDropdown && (
                  <div className="absolute z-10 mt-1 w-40 rounded-lg bg-gray-800 border border-white/10 shadow-xl overflow-hidden">
                    {ROLE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setRoleFilter(option.value);
                          setShowRoleDropdown(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors ${
                          roleFilter === option.value ? 'text-red-400 bg-white/5' : 'text-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Filter */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowStatusDropdown(!showStatusDropdown);
                    setShowRoleDropdown(false);
                    setShowVerifiedDropdown(false);
                  }}
                  className={`flex h-8 items-center justify-center gap-2 rounded-lg border pl-3 pr-2 transition-colors ${
                    statusFilter
                      ? 'bg-red-600/20 border-red-500 text-red-400'
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-gray-300'
                  }`}
                >
                  <span className="text-sm font-medium">
                    {statusFilter ? STATUS_OPTIONS.find(s => s.value === statusFilter)?.label : 'Account Status'}
                  </span>
                  <ChevronDown size={16} />
                </button>
                {showStatusDropdown && (
                  <div className="absolute z-10 mt-1 w-40 rounded-lg bg-gray-800 border border-white/10 shadow-xl overflow-hidden">
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setStatusFilter(option.value);
                          setShowStatusDropdown(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors ${
                          statusFilter === option.value ? 'text-red-400 bg-white/5' : 'text-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Verified Filter */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowVerifiedDropdown(!showVerifiedDropdown);
                    setShowRoleDropdown(false);
                    setShowStatusDropdown(false);
                  }}
                  className={`flex h-8 items-center justify-center gap-2 rounded-lg border pl-3 pr-2 transition-colors ${
                    verifiedFilter
                      ? 'bg-red-600/20 border-red-500 text-red-400'
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-gray-300'
                  }`}
                >
                  <span className="text-sm font-medium">
                    {verifiedFilter ? VERIFIED_OPTIONS.find(v => v.value === verifiedFilter)?.label : 'Verification'}
                  </span>
                  <ChevronDown size={16} />
                </button>
                {showVerifiedDropdown && (
                  <div className="absolute z-10 mt-1 w-40 rounded-lg bg-gray-800 border border-white/10 shadow-xl overflow-hidden">
                    {VERIFIED_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setVerifiedFilter(option.value);
                          setShowVerifiedDropdown(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors ${
                          verifiedFilter === option.value ? 'text-red-400 bg-white/5' : 'text-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex h-8 items-center justify-center gap-1 rounded-lg bg-white/5 border border-white/10 hover:border-red-500 px-3 text-gray-300 hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                  <span className="text-sm font-medium">Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="w-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-red-500" size={48} />
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Users size={48} className="mb-4" />
                <p className="text-lg">No users found</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-2 text-red-400 hover:text-red-300"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
                  <table className="w-full">
                    <thead className="border-b border-b-white/10">
                      <tr className="bg-white/5">
                        <th className="px-4 py-3 text-left text-gray-300 w-1/4 text-sm font-medium">
                          Full Name
                        </th>
                        <th className="px-4 py-3 text-left text-gray-300 w-1/4 text-sm font-medium">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-gray-300 w-[15%] text-sm font-medium">
                          Phone Number
                        </th>
                        <th className="px-4 py-3 text-left text-gray-300 w-[10%] text-sm font-medium">
                          Role
                        </th>
                        <th className="px-4 py-3 text-center text-gray-300 w-[10%] text-sm font-medium">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-gray-300 w-[10%] text-sm font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className="border-t border-t-white/10 hover:bg-white/5"
                        >
                          <td className="h-[72px] px-4 py-2">
                            <div className="flex items-center gap-3">
                              {user.avatar_url ? (
                                <img
                                  src={user.avatar_url}
                                  alt={user.full_name}
                                  className="w-10 h-10 rounded-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=dc2626&color=fff`;
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                                  {user.full_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="text-white text-sm font-medium">{user.full_name}</p>
                                {user.is_verified && (
                                  <span className="text-xs text-green-400">✓ Verified</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="h-[72px] px-4 py-2 text-gray-400 text-sm">
                            {user.email}
                          </td>
                          <td className="h-[72px] px-4 py-2 text-gray-400 text-sm">
                            {user.phone_number || '-'}
                          </td>
                          <td className="h-[72px] px-4 py-2 text-sm">
                            {getRoleBadge(user.role)}
                          </td>
                          <td className="h-[72px] px-4 py-2 text-center text-sm">
                            {getStatusBadge(user.is_active)}
                          </td>
                          <td className="h-[72px] px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => navigate(`/admin/users/edit/${user.id}`)}
                                className="p-1.5 rounded-md text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                                title="Edit user"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => setDeleteModal({ isOpen: true, user })}
                                className="p-1.5 rounded-md text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                title="Delete user"
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
        onClose={() => setDeleteModal({ isOpen: false, user: null })}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteModal.user?.full_name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
        variant="danger"
      />
    </AdminLayout>
  );
}
