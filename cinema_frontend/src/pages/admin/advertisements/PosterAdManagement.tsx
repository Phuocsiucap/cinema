import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Film, Eye, EyeOff } from 'lucide-react';
import { ConfirmModal, MediaInput } from '../../../components/ui';
import advertisementService from '../../../services/advertisementService';
import { uploadService } from '../../../services';
import type { PosterAd } from '../../../types/advertisement';

export function PosterAdManagement() {
    const [posterAds, setPosterAds] = useState<PosterAd[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showActiveOnly, setShowActiveOnly] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingAd, setEditingAd] = useState<PosterAd | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; ad: PosterAd | null }>({
        isOpen: false,
        ad: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Image upload states
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        poster_url: '',
        movie_id: '',
        title: '',
        description: '',
        is_active: true,
        display_order: 0,
    });

    useEffect(() => {
        fetchPosterAds();
    }, [showActiveOnly]);

    const fetchPosterAds = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await advertisementService.getPosterAds(showActiveOnly);
            setPosterAds(data);
        } catch (err) {
            setError('Failed to load poster ads');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (ad?: PosterAd) => {
        if (ad) {
            setEditingAd(ad);
            setFormData({
                poster_url: ad.poster_url,
                movie_id: ad.movie_id,
                title: ad.title || '',
                description: ad.description || '',
                is_active: ad.is_active,
                display_order: ad.display_order,
            });
            setImageFile(null);
            setImagePreview(null);
        } else {
            setEditingAd(null);
            setFormData({
                poster_url: '',
                movie_id: '',
                title: '',
                description: '',
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
            let finalPosterUrl = formData.poster_url;
            if (imageFile) {
                const uploadResult = await uploadService.uploadFile(imageFile);
                if (uploadResult.success) {
                    finalPosterUrl = uploadResult.url;
                }
            } else if (formData.poster_url && formData.poster_url.trim()) {
                const uploadResult = await uploadService.uploadFromUrl(formData.poster_url);
                if (uploadResult.success) {
                    finalPosterUrl = uploadResult.url;
                }
            }

            const submitData = {
                ...formData,
                poster_url: finalPosterUrl,
            };

            if (editingAd) {
                await advertisementService.updatePosterAd(editingAd.id, submitData);
            } else {
                await advertisementService.createPosterAd(submitData);
            }
            setShowModal(false);
            fetchPosterAds();
        } catch (err) {
            console.error('Save error:', err);
            setError('Failed to save poster ad');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.ad) return;
        try {
            setIsDeleting(true);
            await advertisementService.deletePosterAd(deleteModal.ad.id);
            setDeleteModal({ isOpen: false, ad: null });
            fetchPosterAds();
        } catch (err) {
            console.error('Delete error:', err);
            setError('Failed to delete poster ad');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Poster Ad Management</h2>
                    <p className="text-gray-400">Manage movie poster advertisements</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    Add Poster Ad
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                            <Film className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Total Poster Ads</p>
                            <p className="text-2xl font-bold text-white">{posterAds.length}</p>
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
                                {posterAds.filter((a) => a.is_active).length}
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
                                {posterAds.filter((a) => !a.is_active).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="posterActiveOnly"
                        checked={showActiveOnly}
                        onChange={(e) => setShowActiveOnly(e.target.checked)}
                        className="w-4 h-4 text-red-600 bg-gray-800 border-gray-700 rounded focus:ring-red-500"
                    />
                    <label htmlFor="posterActiveOnly" className="text-gray-300">
                        Show active only
                    </label>
                </div>
            </div>

            {/* Poster Ads Grid */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-red-500" size={40} />
                    </div>
                ) : posterAds.length === 0 ? (
                    <div className="text-center py-12">
                        <Film className="mx-auto mb-4 text-gray-600" size={48} />
                        <p className="text-gray-400 mb-4">No poster ads found</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                            Add First Poster Ad
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
                        {posterAds.map((ad) => (
                            <div
                                key={ad.id}
                                className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors"
                            >
                                <div className="aspect-[2/3] bg-gray-900 relative">
                                    <img src={ad.poster_url} alt={ad.title || 'Poster'} className="w-full h-full object-cover" />
                                    {!ad.is_active && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">Inactive</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <p className="text-white font-medium mb-1 line-clamp-1">{ad.title || 'No title'}</p>
                                    <p className="text-gray-400 text-xs mb-2 line-clamp-2">{ad.description || 'No description'}</p>
                                    <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                                        <span className="text-xs">Order: {ad.display_order}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleOpenModal(ad)}
                                            className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                                        >
                                            <Edit2 size={14} className="inline mr-1" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal({ isOpen: true, ad })}
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
                                {editingAd ? 'Edit Poster Ad' : 'Add Poster Ad'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Image Upload with MediaInput */}
                            <MediaInput
                                label="Poster Image"
                                subLabel="Recommended: 600x900px (2:3 ratio)"
                                value={formData.poster_url}
                                onChange={(url) => setFormData({ ...formData, poster_url: url })}
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
                                    setFormData({ ...formData, poster_url: '' });
                                    setImageFile(null);
                                    setImagePreview(null);
                                }}
                                aspectRatio="poster"
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Movie ID</label>
                                <input
                                    type="text"
                                    value={formData.movie_id}
                                    onChange={(e) => setFormData({ ...formData, movie_id: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600"
                                    placeholder="Optional movie ID"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Display Order</label>
                                <input
                                    type="number"
                                    value={formData.display_order}
                                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="ad_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-red-600 bg-gray-800 border-gray-700 rounded focus:ring-red-500"
                                />
                                <label htmlFor="ad_active" className="text-gray-300">Active</label>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : editingAd ? 'Update' : 'Create'}
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
                onClose={() => setDeleteModal({ isOpen: false, ad: null })}
                onConfirm={handleDelete}
                title="Delete Poster Ad"
                message="Are you sure you want to delete this poster ad? This action cannot be undone."
                confirmText="Delete"
                isLoading={isDeleting}
                variant="danger"
            />
        </>
    );
}

export default PosterAdManagement;
