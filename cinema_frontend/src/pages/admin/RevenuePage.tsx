import { useState, useEffect, useRef } from 'react';
import {
  Download,
  Loader2,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Table as TableIcon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

import { AdminLayout } from '../../components/layouts/AdminLayout';
import { revenueService, type RevenueData } from '../../services/revenueService';
import { RevenueDetailModal } from '../../components/admin/RevenueDetailModal';

// Brighter palette for dark background (high contrast)
const COLORS = ['#60A5FA', '#34D399', '#F59E0B', '#FB7185', '#A78BFA', '#F97316', '#14B8A6', '#06B6D4'];

export function RevenuePage() {
  const [periodType, setPeriodType] = useState<'day' | 'month' | 'year'>('month');
  const [dateRange, setDateRange] = useState<{ start: string, end: string }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [filterType, setFilterType] = useState<'cinema' | 'room' | 'movie'>('cinema');
  const [limit, setLimit] = useState<number>(10);
  const [sortField, setSortField] = useState<string>('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const barChartRef = useRef<HTMLDivElement | null>(null);
  const pieChartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadRevenueData();
  }, [periodType, dateRange, filterType, limit]);

  const loadRevenueData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await revenueService.getRevenueData({
        periodType,
        startDate: dateRange.start,
        endDate: dateRange.end,
        filterType,
        limit: limit,
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
    const rounded = Math.round(amount);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' VND';
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleDownloadReport = async () => {
    if (!revenueData) {
      alert('No revenue data available. Please load data first.');
      return;
    }

    console.log('Exporting PDF with data:', revenueData); // Debug log

    const doc = new jsPDF('p', 'mm', 'a4');

    // Title and metadata
    doc.setFontSize(20);
    doc.text('Revenue Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 35);
    doc.text(`Type: ${filterType.charAt(0).toUpperCase() + filterType.slice(1)} Comparison`, 14, 40);

    // Try to capture charts (bar and pie) as images and add to PDF
    let yCursor = 48;
    try {
      if (barChartRef.current) {
        console.log('Capturing bar chart with html2canvas'); // Debug log
        const canvas = await html2canvas(barChartRef.current, { 
          scale: 3, 
          useCORS: true, 
          allowTaint: true, 
          backgroundColor: '#FFFFFF', // White background
        });
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 14, yCursor, 180, 70);
        yCursor += 74;
      }
      if (pieChartRef.current) {
        console.log('Capturing pie chart with html2canvas'); // Debug log
        const canvas = await html2canvas(pieChartRef.current, { 
          scale: 3, 
          useCORS: true, 
          allowTaint: true, 
          backgroundColor: '#FFFFFF', // White background
        });
        const imgData = canvas.toDataURL('image/png');
        // place next to chart if space, otherwise below
        if (yCursor < 120) {
          doc.addImage(imgData, 'PNG', 14, yCursor, 90, 70);
          yCursor += 74;
        } else {
          doc.addImage(imgData, 'PNG', 14, yCursor, 180, 70);
          yCursor += 74;
        }
      }
    } catch (e) {
      console.error('Chart capture failed:', e);
      // Continue to include table even if charts fail
    }

    // Summary
    const totalRevenue = revenueData.data.reduce((sum, item) => sum + item.revenue, 0);
    const totalTickets = revenueData.data.reduce((sum, item) => sum + item.tickets_sold, 0);
    console.log('Total Revenue:', totalRevenue, 'Total Tickets:', totalTickets); // Debug log
    doc.setFontSize(12);
    doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`, 14, yCursor + 6);
    doc.text(`Total Tickets Sold: ${totalTickets.toLocaleString()}`, 14, yCursor + 12);

    // Table
    const tableColumn = ["Name", "Revenue", "Tickets Sold", "Avg Price", "Shows"];
    const tableRows = revenueData.data.map(item => {
      let displayName = item.entity_name;
      if (filterType === 'room' && (item.entity_info as any)?.cinema_name) {
        displayName = `${item.entity_name} (${(item.entity_info as any).cinema_name})`;
      }
      // Remove accents for PDF compatibility
      displayName = displayName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      console.log('Table row:', displayName, item.revenue, item.tickets_sold); // Debug log
      return [
        displayName,
        formatCurrency(item.revenue),
        item.tickets_sold.toLocaleString(),
        formatCurrency(item.avg_ticket_price),
        item.shows_count
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: yCursor + 24,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 163, 74] }
    });

    doc.save(`revenue_report_${filterType}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Sort data manually for display if needed (though API mostly handles it)
  const sortedData = revenueData ? [...revenueData.data].sort((a: any, b: any) => {
    if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  }) : [];

  // Refine Pie Chart Data
  const pieChartData = sortedData.map(item => {
    let displayName = item.entity_name;
    if (filterType === 'room' && 'cinema_name' in item.entity_info) {
      displayName = `${item.entity_name} (${item.entity_info.cinema_name})`;
    }
    return {
      name: displayName,
      value: item.revenue
    };
  });

  // Prepare Bar Chart Data to use correct display name (append Cinema for rooms)
  const barChartData = sortedData.map(item => {
    let displayName = item.entity_name;
    if (filterType === 'room' && 'cinema_name' in item.entity_info) {
      displayName = `${item.entity_name} (${item.entity_info.cinema_name})`;
    }
    return {
      ...item,
      entity_name: displayName // Override for chart display
    };
  });

  if (isLoading && !revenueData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
              {error}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Revenue Management</h1>
              <p className="text-gray-400 mt-1">Analyze financial performance and trends.</p>
            </div>
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            >
              <Download size={18} />
              Download Report (PDF)
            </button>
          </div>

          {/* Filters Control Panel */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 md:p-6 space-y-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">

              <div className="flex flex-wrap gap-4 items-center">
                {/* Period Type */}
                <div className="flex bg-gray-800 p-1 rounded-lg">
                  {(['day', 'month', 'year'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => handlePeriodTypeChange(type)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${periodType === type
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Filter Type */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="cinema">By Cinemas</option>
                  <option value="room">By Rooms</option>
                  <option value="movie">By Movies</option>
                </select>

                {/* Limit */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Limit:</span>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Date Range */}
              <div className="flex gap-2 items-center bg-gray-800 px-3 py-2 rounded-lg border border-gray-700">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-transparent text-white text-sm focus:outline-none"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-transparent text-white text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Charts Section */}
          {revenueData && revenueData.data.length > 0 && (
            <div className="grid grid-cols-1 gap-8">
              {/* Bar Chart */}
              <div className="bg-white border border-gray-300 rounded-xl p-6">
                <h3 className="text-black text-lg font-semibold mb-6 flex items-center gap-2">
                  <BarChartIcon size={20} className="text-blue-500" />
                  Revenue Comparison
                </h3>
                <div ref={barChartRef} className="h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData.slice(0, 10)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="entity_name"
                        stroke="#374151"
                        fontSize={12}
                        tickFormatter={(val) => val.length > 20 ? val.slice(0, 20) + '...' : val}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis stroke="#374151" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'white', borderColor: '#ccc', color: 'black' }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill={COLORS[0]} radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#000', fontSize: 12 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="bg-white border border-gray-300 rounded-xl p-6">
                <h3 className="text-black text-lg font-semibold mb-6 flex items-center gap-2">
                  <PieChartIcon size={20} className="text-green-500" />
                  Revenue Distribution
                </h3>
                <div ref={pieChartRef} className="h-[500px] w-full flex justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                        outerRadius={180}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'white', borderColor: '#ccc', color: 'black' }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Table */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-white text-lg font-semibold flex items-center gap-2">
                <TableIcon size={20} className="text-purple-500" />
                Detailed Report
              </h3>
            </div>

            {revenueData && revenueData.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-gray-800 text-white text-xs uppercase font-medium">
                    <tr>
                      <th className="px-6 py-4">
                        <button onClick={() => handleSort('entity_name')} className="hover:text-blue-400 flex items-center gap-1">
                          Name {sortField === 'entity_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </button>
                      </th>
                      <th className="px-6 py-4">
                        <button onClick={() => handleSort('revenue')} className="hover:text-blue-400 flex items-center gap-1">
                          Revenue {sortField === 'revenue' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </button>
                      </th>
                      <th className="px-6 py-4">
                        <button onClick={() => handleSort('tickets_sold')} className="hover:text-blue-400 flex items-center gap-1">
                          Tickets {sortField === 'tickets_sold' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </button>
                      </th>
                      <th className="px-6 py-4">Avg Price</th>
                      <th className="px-6 py-4">Shows</th>
                      <th className="px-6 py-4">Occupancy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {sortedData.map((item, index) => (
                      <tr
                        key={index}
                        onClick={() => setSelectedEntityId(item.entity_id)}
                        className="hover:bg-gray-800/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 text-white font-medium group-hover:text-blue-400 transition-colors">{item.entity_name}</td>
                        <td className="px-6 py-4 text-blue-400">{formatCurrency(item.revenue)}</td>
                        <td className="px-6 py-4">{item.tickets_sold.toLocaleString()}</td>
                        <td className="px-6 py-4">{formatCurrency(item.avg_ticket_price)}</td>
                        <td className="px-6 py-4">{item.shows_count}</td>
                        <td className={`px-6 py-4 font-medium ${item.percentage > 70 ? 'text-green-400' :
                          item.percentage > 40 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                          {item.percentage ? item.percentage.toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No data available for the selected range.
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedEntityId && (
        <RevenueDetailModal
          isOpen={true}
          onClose={() => setSelectedEntityId(null)}
          entityType={filterType}
          entityId={selectedEntityId}
          dateRange={dateRange}
        />
      )}
    </AdminLayout>
  );
}