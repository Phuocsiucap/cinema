import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Loader2, Image, Eye, EyeOff } from 'lucide-react';
import { ConfirmModal, MediaInput } from '../../../components/ui';
import advertisementService from '../../../services/advertisementService';
import { uploadService } from '../../../services';
import type { Banner } from '../../../types/advertisement';

export function BannerManagement() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showActiveOnly, setShowActiveOnly] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; banner: Banner | null }>({
        isOpen: false,
        banner: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Image upload states
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        image_url: '',
        text: '',
        link_type: '' as 'movie' | 'cinema' | '',
        movie_id: '',
        cinema_id: '',
        is_active: true,
        display_order: 0,
    });

    useEffect(() => {
        fetchBanners();
    }, [showActiveOnly]);

    const fetchBanners = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await advertisementService.getBanners(showActiveOnly);
            setBanners(data);
        } catch (err) {
            setError('Failed to load banners');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (banner?: Banner) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                image_url: banner.image_url,
                text: banner.text || '',
                link_type: banner.link_type || '',
                movie_id: banner.movie_id || '',
                cinema_id: banner.cinema_id || '',
                is_active: banner.is_active,
                display_order: banner.display_order,
            });
            setImageFile(null);
            setImagePreview(null);
        } else {
            setEditingBanner(null);
            setFormData({
                image_url: '',
                text: '',
                link_type: '',
                movie_id: '',
                cinema_id: '',
                is_active: true,
                display_order: 0,
            });
            setImageFile(null);
            setImagePreview(null);
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSaving(true);

            // Handle image upload
            let finalImageUrl = formData.image_url;
            if (imageFile) {
                // Upload file to Cloudinary
                const uploadResult = await uploadService.uploadFile(imageFile);
                if (uploadResult.success) {
                    finalImageUrl = uploadResult.url;
                }
            } else if (formData.image_url && formData.image_url.trim()) {
                // Upload URL to Cloudinary
                const uploadResult = await uploadService.uploadFromUrl(formData.image_url);
                if (uploadResult.success) {
                    finalImageUrl = uploadResult.url;
                }
            }

            const submitData = {
                ...formData,
                image_url: finalImageUrl,
                link_type: formData.link_type || undefined,
                movie_id: formData.movie_id || undefined,
                cinema_id: formData.cinema_id || undefined,
            };

            if (editingBanner) {
                await advertisementService.updateBanner(editingBanner.id, submitData);
            } else {
                await advertisementService.createBanner(submitData);
            }
            setShowModal(false);
            fetchBanners();
        } catch (err) {
            console.error('Save error:', err);
            setError('Failed to save banner');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.banner) return;
        try {
            setIsDeleting(true);
            await advertisementService.deleteBanner(deleteModal.banner.id);
            setDeleteModal({ isOpen: false, banner: null });
            fetchBanners();
        } catch (err) {
            console.error('Delete error:', err);
            setError('Failed to delete banner');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredBanners = banners.filter((banner) =>
        banner.text?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Banner Management</h2>
                    <p className="text-gray-400">Manage homepage banner advertisements</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    Add Banner
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                            <Image className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Total Banners</p>
                            <p className="text-2xl font-bold text-white">{banners.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/20 rounded-lg">
                            <Eye className="text-green-400" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Active</p>
                            <p className="text-2xl font-bold text-white">
                                {banners.filter((b) => b.is_active).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-500/20 rounded-lg">
                            <EyeOff className="text-gray-400" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Inactive</p>
                            <p className="text-2xl font-bold text-white">
                                {banners.filter((b) => !b.is_active).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by text..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-600"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="activeOnly"
                            checked={showActiveOnly}
                            onChange={(e) => setShowActiveOnly(e.target.checked)}
                            className="w-4 h-4 text-red-600 bg-gray-800 border-gray-700 rounded focus:ring-red-500"
                        />
                        <label htmlFor="activeOnly" className="text-gray-300">
                            Show active only
                        </label>
                    </div>
                </div>
            </div>

            {/* Banners Grid */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-red-500" size={40} />
                    </div>
                ) : filteredBanners.length === 0 ? (
                    <div className="text-center py-12">
                        <Image className="mx-auto mb-4 text-gray-600" size={48} />
                        <p className="text-gray-400 mb-4">No banners found</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                            Add First Banner
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {filteredBanners.map((banner) => (
                            <div
                                key={banner.id}
                                className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors"
                            >
                                <div className="aspect-video bg-gray-900 relative">
                                    <img
                                        src={banner.image_url}
                                        alt={banner.text || 'Banner'}
                                        className="w-full h-full object-cover"
                                    />
                                    {!banner.is_active && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                                                Inactive
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <p className="text-white font-medium mb-2 line-clamp-2">
                                        {banner.text || 'No text'}
                                    </p>
                                    <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                                        <span>Order: {banner.display_order}</span>
                                        {banner.link_type && (
                                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                                                {banner.link_type}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleOpenModal(banner)}
                                            className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                                        >
                                            <Edit2 size={14} className="inline mr-1" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal({ isOpen: true, banner })}
                                            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-800">
                            <h2 className="text-2xl font-bold text-white">
                                {editingBanner ? 'Edit Banner' : 'Add Banner'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Image Upload with MediaInput */}
                            <MediaInput
                                label="Banner Image"
                                subLabel="Recommended: 1920x600px (16:5 ratio)"
                                value={formData.image_url}
                                onChange={(url) => setFormData({ ...formData, image_url: url })}
                                onFileChange={(file) => {
                                    setImageFile(file);
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => setImagePreview(reader.result as string);
                                        reader.readAsDataURL(file);
                                    } else {
                                        setImagePreview(null);
                                    }
                                }}
                                previewUrl={imagePreview}
                                onClear={() => {
                                    setFormData({ ...formData, image_url: '' });
                                    setImageFile(null);
                                    setImagePreview(null);
                                }}
                                aspectRatio="video"
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Text</label>
                                <input
                                    type="text"
                                    value={formData.text}
                                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Link Type</label>
                                <select
                                    value={formData.link_type}
                                    onChange={(e) =>
                                        setFormData({ ...formData, link_type: e.target.value as 'movie' | 'cinema' | '' })
                                    }
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600"
                                >
                                    <option value="">None</option>
                                    <option value="movie">Movie</option>
                                    <option value="cinema">Cinema</option>
                                </select>
                            </div>

                            {formData.link_type === 'movie' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Movie ID</label>
                                    <input
                                        type="text"
                                        value={formData.movie_id}
                                        onChange={(e) => setFormData({ ...formData, movie_id: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600"
                                    />
                                </div>
                            )}

                            {formData.link_type === 'cinema' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Cinema ID</label>
                                    <input
                                        type="text"
                                        value={formData.cinema_id}
                                        onChange={(e) => setFormData({ ...formData, cinema_id: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Display Order</label>
                                <input
                                    type="number"
                                    value={formData.display_order}
                                    onChange={(e) =>
                                        setFormData({ ...formData, display_order: parseInt(e.target.value) })
                                    }
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-red-600 bg-gray-800 border-gray-700 rounded focus:ring-red-500"
                                />
                                <label htmlFor="is_active" className="text-gray-300">
                                    Active
                                </label>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : editingBanner ? 'Update' : 'Create'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, banner: null })}
                onConfirm={handleDelete}
                title="Delete Banner"
                message="Are you sure you want to delete this banner? This action cannot be undone."
                confirmText="Delete"
                isLoading={isDeleting}
                variant="danger"
            />
        </>
    );
}

export default BannerManagement;
