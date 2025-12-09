import { useState, useEffect } from 'react';
import {
  Percent,
  Calendar,
  Search,
  Copy,
  Loader2,
  Tag,
  Ticket,
  Film,
  Package,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MainLayout } from '../components/layouts';
import { promotionService, type Promotion } from '../services/promotionService';
import { movieService } from '../services/movieService';

export function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [movieNames, setMovieNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setIsLoading(true);
      const data = await promotionService.getActivePromotions();
      setPromotions(data);

      // Fetch movie names for promotions with MOVIES applicable_items
      const movieIds = new Set<string>();
      data.forEach(promo => {
        if (promo.applicable_to === 'MOVIES' && promo.applicable_items) {
          promo.applicable_items.forEach(id => movieIds.add(id));
        }
      });

      if (movieIds.size > 0) {
        const names: Record<string, string> = {};
        await Promise.all(
          Array.from(movieIds).map(async (id) => {
            try {
              const movie = await movieService.getMovie(id);
              names[id] = movie.title;
            } catch (err) {
              console.error(`Failed to fetch movie ${id}:`, err);
              names[id] = `Phim #${id}`;
            }
          })
        );
        setMovieNames(names);
      }
    } catch (err) {
      console.error('Failed to load promotions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredPromotions = promotions.filter(promo =>
    promo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    promo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    promo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDiscountText = (promo: Promotion) => {
    if (promo.discount_type === 'PERCENTAGE') {
      return `${promo.discount_value}% OFF`;
    }
    return `${promo.discount_value.toLocaleString()} VND OFF`;
  };

  const getApplicableIcon = (applicableTo?: string) => {
    switch (applicableTo) {
      case 'MOVIES': return <Film size={16} className="text-purple-400" />;
      case 'COMBOS': return <Package size={16} className="text-orange-400" />;
      case 'TICKETS': return <Ticket size={16} className="text-blue-400" />;
      default: return <Tag size={16} className="text-green-400" />;
    }
  };

  const getApplicableText = (applicableTo?: string) => {
    switch (applicableTo) {
      case 'MOVIES': return 'Movies Only';
      case 'COMBOS': return 'Combos Only';
      case 'TICKETS': return 'Tickets Only';
      default: return 'All Services';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isExpiringSoon = (endDate?: string) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7 && daysLeft > 0;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center">
          <Loader2 size={40} className="animate-spin text-red-500" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#0f0f23] py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Tag className="text-red-500" size={36} />
              Promotions
            </h1>
            <p className="text-gray-400">Use promotion codes to get discounts when booking tickets</p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search promotions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Stats */}
          {promotions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <Tag className="text-red-400" size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{promotions.length}</p>
                    <p className="text-sm text-gray-400">Available Promotions</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle2 className="text-green-400" size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {promotions.filter(p => !p.usage_limit || p.used_count < p.usage_limit).length}
                    </p>
                    <p className="text-sm text-gray-400">Uses Available</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <AlertCircle className="text-orange-400" size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {promotions.filter(p => isExpiringSoon(p.end_date)).length}
                    </p>
                    <p className="text-sm text-gray-400">Expiring Soon</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Promotions Grid */}
          {filteredPromotions.length === 0 ? (
            <div className="text-center py-16">
              <Tag className="mx-auto text-gray-600 mb-4" size={64} />
              <p className="text-gray-400 text-lg">
                {searchQuery ? 'No matching promotions found' : 'No promotions available'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPromotions.map((promo) => {
                const isLimited = promo.usage_limit && promo.used_count >= promo.usage_limit;
                const expiringSoon = isExpiringSoon(promo.end_date);

                return (
                  <div
                    key={promo.id}
                    className={`bg-[#1a1a2e] border rounded-xl overflow-hidden hover:scale-[1.02] transition-all ${
                      isLimited ? 'border-gray-700 opacity-60' : 'border-gray-700 hover:border-red-500/50'
                    }`}
                  >
                    {/* Banner */}
                    {promo.banner_url ? (
                      <div className="h-32 overflow-hidden">
                        <img
                          src={promo.banner_url}
                          alt={promo.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-32 bg-gradient-to-br from-red-500/20 to-purple-500/20 flex items-center justify-center">
                        <Percent size={48} className="text-red-400" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-5">
                      {/* Title & Badge */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="text-lg font-bold text-white line-clamp-2 flex-1">
                          {promo.title}
                        </h3>
                        {expiringSoon && (
                          <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded">
                            Expiring
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {promo.description && (
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                          {promo.description}
                        </p>
                      )}

                      {/* Discount Value */}
                      <div className="flex items-center gap-2 mb-3">
                        <Percent className="text-red-400" size={20} />
                        <span className="text-2xl font-bold text-red-400">
                          {getDiscountText(promo)}
                        </span>
                      </div>

                      {/* Applicable To */}
                      <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
                        {getApplicableIcon(promo.applicable_to)}
                        <span>{getApplicableText(promo.applicable_to)}</span>
                      </div>

                      {/* Conditions */}
                      <div className="space-y-1 mb-4 text-sm text-gray-400">
                        {promo.min_purchase && (
                          <p>• Min purchase: {promo.min_purchase.toLocaleString()} VND</p>
                        )}
                        {promo.max_discount && (
                          <p>• Max discount: {promo.max_discount.toLocaleString()} VND</p>
                        )}
                        {promo.min_tickets && promo.min_tickets > 1 && (
                          <p>• Minimum {promo.min_tickets} tickets</p>
                        )}
                        {promo.applicable_items && promo.applicable_items.length > 0 && (
                          <div>
                            <p>• Applies to {promo.applicable_items.length} specific {
                              promo.applicable_to === 'MOVIES' ? 'movies' : 
                              promo.applicable_to === 'COMBOS' ? 'combos' : 'tickets'
                            }:</p>
                            {promo.applicable_to === 'MOVIES' && (
                              <div className="ml-4 mt-1 space-y-0.5">
                                {promo.applicable_items.map((id) => (
                                  <p key={id} className="text-xs text-gray-500">
                                    - {movieNames[id] || `Loading...`}
                                  </p>
                                ))}
                              </div>
                            )}
                            {promo.applicable_to !== 'MOVIES' && (
                              <div className="ml-4 mt-1 space-y-0.5">
                                {promo.applicable_items.map((id) => (
                                  <p key={id} className="text-xs text-gray-500">
                                    - ID: {id}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {promo.usage_limit && (
                          <p>
                            • Used: {promo.used_count}/{promo.usage_limit}
                          </p>
                        )}
                      </div>

                      {/* Date Range */}
                      {(promo.start_date || promo.end_date) && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                          <Calendar size={14} />
                          <span>
                            {formatDate(promo.start_date)} - {formatDate(promo.end_date)}
                          </span>
                        </div>
                      )}

                      {/* Code */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Promo Code</p>
                          <p className="text-white font-mono font-bold tracking-wider">
                            {promo.code}
                          </p>
                        </div>
                        <button
                          onClick={() => copyCode(promo.code)}
                          disabled={!!isLimited}
                          className={`p-3 rounded-lg transition-colors ${
                            isLimited
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              : copiedCode === promo.code
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                        >
                          {copiedCode === promo.code ? (
                            <CheckCircle2 size={20} />
                          ) : (
                            <Copy size={20} />
                          )}
                        </button>
                      </div>

                      {isLimited && (
                        <p className="text-xs text-red-400 mt-2 text-center">
                          Usage limit reached
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-12">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 flex gap-4">
              <AlertCircle className="flex-shrink-0 text-blue-400" size={24} />
              <div>
                <h4 className="text-white font-semibold mb-2">How to use promotion code</h4>
                <p className="text-gray-300 text-sm">
                  Copy the promotion code using the copy button above, then enter the code at checkout to get the discount. 
                  Each code can be applied maximum 1 time per order.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
