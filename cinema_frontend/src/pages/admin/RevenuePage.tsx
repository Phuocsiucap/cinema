import { useState, useEffect } from 'react';
import {
  Download,
  Loader2
} from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { revenueService, type RevenueData } from '../../services/revenueService';

export function RevenuePage() {
  const [periodType, setPeriodType] = useState<'day' | 'month' | 'year'>('month');
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [filterType, setFilterType] = useState<'cinema' | 'room' | 'movie'>('cinema');
  const [sortField, setSortField] = useState<string>('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRevenueData();
  }, [periodType, dateRange, filterType]);

  const loadRevenueData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await revenueService.getRevenueData({
        periodType,
        startDate: dateRange.start,
        endDate: dateRange.end,
        filterType,
        limit: 10,
        sortBy: 'revenue'
      });
      setRevenueData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load revenue data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodTypeChange = (type: 'day' | 'month' | 'year') => {
    setPeriodType(type);
    // Reset date range based on period type
    const now = new Date();
    if (type === 'day') {
      setDateRange({
        start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        end: now.toISOString().split('T')[0]
      });
    } else if (type === 'month') {
      setDateRange({
        start: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
        end: now.toISOString().split('T')[0]
      });
    } else { // year
      setDateRange({
        start: new Date(now.getFullYear() - 2, 0, 1).toISOString().split('T')[0], // 3 years ago
        end: now.toISOString().split('T')[0]
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };



  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
      </AdminLayout>
    );
  }

  if (error || !revenueData) {
    return (
      <AdminLayout>
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
              {error || 'Failed to load revenue data'}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Revenue Management</h1>
                <p className="text-gray-400 mt-1">Analyze financial performance and trends across the cinema network.</p>
              </div>
              <button className="text-gray-400 hover:text-white text-sm flex items-center gap-2">
                <Download size={16} />
                Download Report
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              {/* Period Type */}
              <div className="flex bg-gray-800 p-1 rounded-lg">
                {(['day', 'month', 'year'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => handlePeriodTypeChange(type)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      periodType === type
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {/* Date Range */}
              <div className="flex gap-2 items-center">
                <label className="text-gray-400 text-sm">From:</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                />
                <label className="text-gray-400 text-sm">To:</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                />
              </div>

              {/* Comparison Type */}
              <div className="flex gap-2 items-center">
                <label className="text-gray-400 text-sm">Compare:</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'cinema' | 'room' | 'movie')}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                >
                  <option value="cinema">Cinemas</option>
                  <option value="room">Rooms</option>
                  <option value="movie">Movies</option>
                </select>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          {revenueData && revenueData.data && revenueData.data.length > 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-gray-800">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h3 className="text-white text-xl font-bold">
                    {filterType === 'movie' ? 'Movies Performance Comparison' :
                     filterType === 'cinema' ? 'Cinemas Performance Comparison' :
                     'Rooms Performance Comparison'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Period: {periodType}</span>
                    {dateRange.start && dateRange.end && (
                      <span>• {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}</span>
                    )}
                    <span>• Total: {revenueData.total_entities} {filterType}s</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-gray-800 text-white text-xs uppercase font-medium">
                    <tr>
                      <th className="px-6 py-4 rounded-l-lg">
                        <button
                          onClick={() => handleSort('entity_name')}
                          className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                        >
                          {filterType === 'cinema' ? 'Cinema' : filterType === 'room' ? 'Room' : 'Movie'}
                          {sortField === 'entity_name' && (
                            <span className="text-blue-400">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      </th>
                      {filterType === 'cinema' && (
                        <th className="px-6 py-4">City / Rooms</th>
                      )}
                      {filterType === 'room' && (
                        <th className="px-6 py-4">Cinema / Capacity</th>
                      )}
                      {filterType === 'movie' && (
                        <th className="px-6 py-4">Genre / Rating</th>
                      )}
                      <th className="px-6 py-4">
                        <button
                          onClick={() => handleSort('revenue')}
                          className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                        >
                          Revenue
                          {sortField === 'revenue' && (
                            <span className="text-blue-400">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4">
                        <button
                          onClick={() => handleSort('tickets_sold')}
                          className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                        >
                          Tickets Sold
                          {sortField === 'tickets_sold' && (
                            <span className="text-blue-400">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4">Avg Price</th>
                      <th className="px-6 py-4">
                        <button
                          onClick={() => handleSort('shows_count')}
                          className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                        >
                          Shows
                          {sortField === 'shows_count' && (
                            <span className="text-blue-400">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4">
                        <button
                          onClick={() => handleSort('occupancy_rate')}
                          className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                        >
                          Occupancy
                          {sortField === 'occupancy_rate' && (
                            <span className="text-blue-400">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4 rounded-r-lg text-right">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {revenueData.data.map((item, index) => (
                      <tr key={item.entity_id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {item.entity_name}
                              </p>
                            </div>
                          </div>
                        </td>
                        {filterType === 'cinema' && 'city' in item.entity_info && (
                          <td className="px-6 py-4">
                            <div className="text-gray-400">
                              {item.entity_info.city} • {item.entity_info.total_rooms} rooms
                            </div>
                          </td>
                        )}
                        {filterType === 'room' && 'cinema_name' in item.entity_info && (
                          <td className="px-6 py-4">
                            <div className="text-gray-400">
                              {item.entity_info.cinema_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              Capacity: {item.entity_info.seat_capacity}
                            </div>
                          </td>
                        )}
                        {filterType === 'movie' && 'genre' in item.entity_info && (
                          <td className="px-6 py-4">
                            <div className="text-gray-400">
                              {item.entity_info.genre}
                            </div>
                            <div className="text-xs text-gray-500">
                              Rating: {item.entity_info.rating} • {item.entity_info.director}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">
                            {formatCurrency(item.revenue)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">
                            {item.tickets_sold.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-400">
                            {formatCurrency(item.avg_ticket_price)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">
                            {item.shows_count}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`font-medium ${item.occupancy_rate > 70 ? 'text-green-400' : item.occupancy_rate > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {item.occupancy_rate.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(item.percentage, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-blue-400 text-sm font-medium">
                              {item.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <p className="text-gray-400">
                No data available for the selected period and filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}