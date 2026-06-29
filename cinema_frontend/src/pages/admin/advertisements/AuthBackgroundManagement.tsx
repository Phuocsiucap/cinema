import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Palette, Eye, EyeOff } from 'lucide-react';
import { ConfirmModal, MediaInput } from '../../../components/ui';
import advertisementService from '../../../services/advertisementService';
import { uploadService } from '../../../services';
import type { AuthBackground } from '../../../types/advertisement';

export function AuthBackgroundManagement() {
    const [backgrounds, setBackgrounds] = useState<AuthBackground[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showActiveOnly, setShowActiveOnly] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingBg, setEditingBg] = useState<AuthBackground | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; bg: AuthBackground | null }>({
        isOpen: false,
        bg: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Image upload states
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        image_url: '',
        title: '',
        is_active: true,
        display_order: 0,
    });

    useEffect(() => {
        fetchBackgrounds();
    }, [showActiveOnly]);

    const fetchBackgrounds = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await advertisementService.getAuthBackgrounds(showActiveOnly);
            setBackgrounds(data);
        } catch (err) {
            setError('Failed to load auth backgrounds');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (bg?: AuthBackground) => {
        if (bg) {
            setEditingBg(bg);
            setFormData({
                image_url: bg.image_url,
                title: bg.title || '',
                is_active: bg.is_active,
                display_order: bg.display_order,
            });
            setImageFile(null);
            setImagePreview(null);
        } else {
            setEditingBg(null);
            setFormData({
                image_url: '',
                title: '',
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
                const uploadResult = await uploadService.uploadFile(imageFile);
                if (uploadResult.success) {
                    finalImageUrl = uploadResult.url;
                }
            } else if (formData.image_url && formData.image_url.trim()) {
                const uploadResult = await uploadService.uploadFromUrl(formData.image_url);
                if (uploadResult.success) {
                    finalImageUrl = uploadResult.url;
                }
            }

            const submitData = {
                ...formData,
                image_url: finalImageUrl,
            };

            if (editingBg) {
                await advertisementService.updateAuthBackground(editingBg.id, submitData);
            } else {
                await advertisementService.createAuthBackground(submitData);
            }
            setShowModal(false);
            fetchBackgrounds();
        } catch (err) {
            console.error('Save error:', err);
            setError('Failed to save auth background');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.bg) return;
        try {
            setIsDeleting(true);
            await advertisementService.deleteAuthBackground(deleteModal.bg.id);
            setDeleteModal({ isOpen: false, bg: null });
            fetchBackgrounds();
        } catch (err) {
            console.error('Delete error:', err);
            setError('Failed to delete auth background');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Auth Background Management</h2>
                    <p className="text-gray-400">Manage login/register page backgrounds</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    Add Background
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                            <Palette className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Total Backgrounds</p>
                            <p className="text-2xl font-bold text-white">{backgrounds.length}</p>
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
                                {backgrounds.filter((b) => b.is_active).length}
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
                                {backgrounds.filter((b) => !b.is_active).length}
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
                        id="authActiveOnly"
                        checked={showActiveOnly}
                        onChange={(e) => setShowActiveOnly(e.target.checked)}
                        className="w-4 h-4 text-red-600 bg-gray-800 border-gray-700 rounded focus:ring-red-500"
                    />
                    <label htmlFor="authActiveOnly" className="text-gray-300">
                        Show active only
                    </label>
                </div>
            </div>

            {/* Backgrounds Grid */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-red-500" size={40} />
                    </div>
                ) : backgrounds.length === 0 ? (
                    <div className="text-center py-12">
                        <Palette className="mx-auto mb-4 text-gray-600" size={48} />
                        <p className="text-gray-400 mb-4">No backgrounds found</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                            Add First Background
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {backgrounds.map((bg) => (
                            <div
                                key={bg.id}
                                className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors"
                            >
                                <div className="aspect-video bg-gray-900 relative">
                                    <img src={bg.image_url} alt={bg.title || 'Background'} className="w-full h-full object-cover" />
                                    {!bg.is_active && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">Inactive</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <p className="text-white font-medium mb-2">{bg.title || 'No title'}</p>
                                    <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                                        <span>Order: {bg.display_order}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleOpenModal(bg)}
                                            className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                                        >
                                            <Edit2 size={14} className="inline mr-1" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal({ isOpen: true, bg })}
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
                    <div className="bg-gray-900 rounded-lg max-w-2xl w-full">
                        <div className="p-6 border-b border-gray-800">
                            <h2 className="text-2xl font-bold text-white">
                                {editingBg ? 'Edit Background' : 'Add Background'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Image Upload with MediaInput */}
                            <MediaInput
                                label="Background Image"
                                subLabel="Recommended: 1920x1080px (16:9 ratio)"
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
                                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600"
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
                                    id="bg_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-red-600 bg-gray-800 border-gray-700 rounded focus:ring-red-500"
                                />
                                <label htmlFor="bg_active" className="text-gray-300">Active</label>
                            </div>
                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : editingBg ? 'Update' : 'Create'}
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
                onClose={() => setDeleteModal({ isOpen: false, bg: null })}
                onConfirm={handleDelete}
                title="Delete Background"
                message="Are you sure you want to delete this background? This action cannot be undone."
                confirmText="Delete"
                isLoading={isDeleting}
                variant="danger"
            />
        </>
    );
}

export default AuthBackgroundManagement;
