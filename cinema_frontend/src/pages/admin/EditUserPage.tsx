import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Loader2, Save, ArrowLeft, User, Mail, Phone, Shield, CheckCircle, XCircle } from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { userService, type UpdateUserData } from '../../services/userService';
import type { User as UserType } from '../../types/auth';

const ROLE_OPTIONS = [
  { value: 'customer', label: 'Customer', color: 'bg-gray-500/20 text-gray-400' },
  { value: 'seller', label: 'Seller', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'admin', label: 'Admin', color: 'bg-blue-500/20 text-blue-400' },
];

export function EditUserPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<{
    full_name: string;
    phone_number: string;
    avatar_url: string;
    role: 'customer' | 'admin' | 'seller';
    is_active: boolean;
    is_verified: boolean;
  }>({
    full_name: '',
    phone_number: '',
    avatar_url: '',
    role: 'customer',
    is_active: true,
    is_verified: false,
  });
  
  const [originalUser, setOriginalUser] = useState<UserType | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const user = await userService.getUser(id);
        setOriginalUser(user);
        setFormData({
          full_name: user.full_name,
          phone_number: user.phone_number || '',
          avatar_url: user.avatar_url || '',
          role: user.role,
          is_active: user.is_active,
          is_verified: user.is_verified,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: UpdateUserData = {
        full_name: formData.full_name,
        phone_number: formData.phone_number || undefined,
        avatar_url: formData.avatar_url || undefined,
        role: formData.role,
        is_active: formData.is_active,
        is_verified: formData.is_verified,
      };

      await userService.updateUser(id, updateData);
      setSuccess('User updated successfully!');
      
      // Navigate back after short delay
      setTimeout(() => {
        navigate('/admin/users');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <Loader2 size={48} className="animate-spin text-red-500 mx-auto mb-4" />
            <p className="text-gray-400">Loading user data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!originalUser) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-4">User not found</p>
            <button
              onClick={() => navigate('/admin/users')}
              className="text-gray-400 hover:text-white flex items-center gap-2 mx-auto"
            >
              <ArrowLeft size={18} />
              Back to Users
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <button
              onClick={() => navigate('/admin/users')}
              className="hover:text-white transition-colors"
            >
              Users
            </button>
            <ChevronRight size={16} />
            <span className="text-white">Edit User</span>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              {originalUser.avatar_url ? (
                <img
                  src={originalUser.avatar_url}
                  alt={originalUser.full_name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(originalUser.full_name)}&background=dc2626&color=fff&size=64`;
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl font-bold">
                  {originalUser.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">{originalUser.full_name}</h1>
                <p className="text-gray-400">{originalUser.email}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/users')}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
              Back
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-green-400">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User size={20} className="text-red-500" />
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Mail size={14} className="inline mr-1" />
                    Email (Read-only)
                  </label>
                  <input
                    type="email"
                    value={originalUser.email}
                    disabled
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Phone size={14} className="inline mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="+84 xxx xxx xxx"
                  />
                </div>

                {/* Avatar URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Role & Permissions Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield size={20} className="text-red-500" />
                Role & Permissions
              </h2>

              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  User Role
                </label>
                <div className="flex flex-wrap gap-3">
                  {ROLE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: option.value as 'customer' | 'admin' | 'seller' })}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        formData.role === option.value
                          ? `${option.color} ring-2 ring-offset-2 ring-offset-gray-900 ring-current`
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Status */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {formData.is_active ? (
                      <CheckCircle size={24} className="text-green-500" />
                    ) : (
                      <XCircle size={24} className="text-red-500" />
                    )}
                    <div>
                      <p className="text-white font-medium">Account Status</p>
                      <p className="text-sm text-gray-400">
                        {formData.is_active ? 'Account is active' : 'Account is disabled'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      formData.is_active ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        formData.is_active ? 'left-8' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Verified Status */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {formData.is_verified ? (
                      <CheckCircle size={24} className="text-blue-500" />
                    ) : (
                      <XCircle size={24} className="text-gray-500" />
                    )}
                    <div>
                      <p className="text-white font-medium">Verification</p>
                      <p className="text-sm text-gray-400">
                        {formData.is_verified ? 'Email verified' : 'Not verified'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_verified: !formData.is_verified })}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      formData.is_verified ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        formData.is_verified ? 'left-8' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="px-6 py-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
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
      </div>
    </AdminLayout>
  );
}
