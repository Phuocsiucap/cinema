import { useState } from 'react';
import { Upload, Link as LinkIcon, Trash2, Image as ImageIcon } from 'lucide-react';

type InputMode = 'url' | 'upload';

interface MediaInputProps {
    label: string;
    subLabel?: string;
    value: string;
    onChange: (val: string) => void;
    onFileChange: (file: File | null) => void;
    previewUrl: string | null;
    onClear: () => void;
    aspectRatio?: 'video' | 'poster' | 'square';
}

export function MediaInput({
    label,
    subLabel,
    value,
    onChange,
    onFileChange,
    previewUrl,
    onClear,
    aspectRatio = 'video'
}: MediaInputProps) {
    const [mode, setMode] = useState<InputMode>('url');

    const aspectClasses = {
        video: 'aspect-video',
        poster: 'aspect-[2/3]',
        square: 'aspect-square'
    };

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
                        className={`px-3 py-1.5 rounded-md transition-colors ${mode === 'url' ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        URL
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('upload')}
                        className={`px-3 py-1.5 rounded-md transition-colors ${mode === 'upload' ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                            }`}
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
                                placeholder="https://example.com/image.jpg"
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

                <div className={`w-24 flex-shrink-0 bg-gray-800 border border-gray-600 rounded-lg overflow-hidden relative group ${aspectClasses[aspectRatio]}`}>
                    {previewUrl || value ? (
                        <>
                            <img
                                src={previewUrl || value}
                                alt="Preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Error';
                                }}
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
}

export default MediaInput;
