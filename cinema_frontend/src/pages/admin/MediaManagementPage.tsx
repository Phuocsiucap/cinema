import { useState } from 'react';
import { Image, Film, Palette } from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { BannerManagement } from './advertisements/BannerManagement';
import { AuthBackgroundManagement } from './advertisements/AuthBackgroundManagement';
import { PosterAdManagement } from './advertisements/PosterAdManagement';

type TabType = 'banners' | 'auth-backgrounds' | 'poster-ads';

export function MediaManagementPage() {
    const [activeTab, setActiveTab] = useState<TabType>('banners');

    const tabs = [
        { id: 'banners' as TabType, label: 'Banners', icon: Image },
        { id: 'auth-backgrounds' as TabType, label: 'Auth Backgrounds', icon: Palette },
        { id: 'poster-ads' as TabType, label: 'Poster Ads', icon: Film },
    ];

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-950 p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-white mb-2">Media Management</h1>
                    <p className="text-gray-400">Manage banners, backgrounds, and poster advertisements</p>
                </div>

                {/* Tabs */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 mb-6">
                    <div className="flex border-b border-gray-800">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${activeTab === tab.id
                                            ? 'text-red-500'
                                            : 'text-gray-400 hover:text-gray-300'
                                        }`}
                                >
                                    <Icon size={20} />
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                {activeTab === 'banners' && <BannerManagement />}
                {activeTab === 'auth-backgrounds' && <AuthBackgroundManagement />}
                {activeTab === 'poster-ads' && <PosterAdManagement />}
            </div>
        </AdminLayout>
    );
}

export default MediaManagementPage;
