import { useEffect, useState, useRef } from 'react';
import {
    X,
    Loader2,
    Calendar,
    Ticket,
    DollarSign
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { revenueService, type RevenueDetailResponse } from '../../services/revenueService';

interface RevenueDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    entityType: 'cinema' | 'room' | 'movie';
    entityId: string;
    dateRange: { start: string, end: string };
}

export function RevenueDetailModal({
    isOpen,
    onClose,
    entityType,
    entityId,
    dateRange
}: RevenueDetailModalProps) {
    const [data, setData] = useState<RevenueDetailResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const chartRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (isOpen && entityId) {
            fetchDetail();
        }
    }, [isOpen, entityId, dateRange]);

    const fetchDetail = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await revenueService.getRevenueDetail(
                entityType,
                entityId,
                dateRange.start,
                dateRange.end
            );
            setData(result);
        } catch (err) {
            setError('Failed to load details');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {isLoading ? 'Loading...' : data?.entity_name}
                            <span className="text-sm font-normal text-gray-400 bg-gray-800 px-2 py-1 rounded">
                                {entityType.toUpperCase()}
                            </span>
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                            <Calendar size={14} />
                            {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                // generate PDF for detail
                                if (!data) return;
                                const doc = new jsPDF('p', 'mm', 'a4');

                                doc.setFontSize(16);
                                doc.text(`Detail Revenue - ${data.entity_name}`, 14, 20);
                                doc.setFontSize(10);
                                doc.text(`Period: ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`, 14, 26);

                                let yCursor = 36;

                                // Capture chart
                                if (chartRef.current) {
                                    html2canvas(chartRef.current, { 
                                        scale: 3, 
                                        useCORS: true, 
                                        allowTaint: true, 
                                        backgroundColor: '#FFFFFF', // White background
                                        letterRendering: true 
                                    }).then(canvas => {
                                        const imgData = canvas.toDataURL('image/png');
                                        doc.addImage(imgData, 'PNG', 14, yCursor, 180, 70);
                                        yCursor += 74;

                                        // Add summary
                                        doc.setFontSize(12);
                                        doc.text(`Total Revenue: ${data.total_revenue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' VND'}`, 14, yCursor + 6);
                                        doc.text(`Total Tickets: ${data.total_tickets}`, 14, yCursor + 12);

                                        // Table
                                        const tableColumn = ["Date", "Revenue", "Tickets Sold"];
                                        const tableRows = data.data.map(row => [
                                            new Date(row.date).toLocaleDateString(),
                                            row.revenue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' VND',
                                            row.tickets_sold.toString()
                                        ]);

                                        autoTable(doc, {
                                            head: [tableColumn],
                                            body: tableRows,
                                            startY: yCursor + 24,
                                            styles: { fontSize: 9 },
                                            headStyles: { fillColor: [59,130,246] }
                                        });

                                        doc.save(`revenue_detail_${data.entity_id}_${new Date().toISOString().split('T')[0]}.pdf`);
                                    }).catch(e => {
                                        console.error('Chart capture failed:', e);
                                        // Fallback without chart
                                        doc.setFontSize(12);
                                        doc.text(`Total Revenue: ${data.total_revenue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' VND'}`, 14, yCursor + 6);
                                        doc.text(`Total Tickets: ${data.total_tickets}`, 14, yCursor + 12);

                                        const tableColumn = ["Date", "Revenue", "Tickets Sold"];
                                        const tableRows = data.data.map(row => [
                                            new Date(row.date).toLocaleDateString(),
                                            row.revenue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' VND',
                                            row.tickets_sold.toString()
                                        ]);

                                        autoTable(doc, {
                                            head: [tableColumn],
                                            body: tableRows,
                                            startY: yCursor + 24,
                                            styles: { fontSize: 9 },
                                            headStyles: { fillColor: [59,130,246] }
                                        });

                                        doc.save(`revenue_detail_${data.entity_id}_${new Date().toISOString().split('T')[0]}.pdf`);
                                    });
                                } else {
                                    // No chart ref, just table
                                    doc.setFontSize(12);
                                    doc.text(`Total Revenue: ${data.total_revenue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' VND'}`, 14, yCursor + 6);
                                    doc.text(`Total Tickets: ${data.total_tickets}`, 14, yCursor + 12);

                                    const tableColumn = ["Date", "Revenue", "Tickets Sold"];
                                    const tableRows = data.data.map(row => [
                                        new Date(row.date).toLocaleDateString(),
                                        row.revenue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' VND',
                                        row.tickets_sold.toString()
                                    ]);

                                    autoTable(doc, {
                                        head: [tableColumn],
                                        body: tableRows,
                                        startY: yCursor + 24,
                                        styles: { fontSize: 9 },
                                        headStyles: { fillColor: [59,130,246] }
                                    });

                                    doc.save(`revenue_detail_${data.entity_id}_${new Date().toISOString().split('T')[0]}.pdf`);
                                }
                            }}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                        >
                            Export
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                            <p className="text-gray-400">Fetching detailed data...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-64 text-red-400">
                            <p>{error}</p>
                            <button
                                onClick={fetchDetail}
                                className="mt-4 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-white transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : data ? (
                        <div className="space-y-6">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                                        <DollarSign size={16} className="text-blue-400" />
                                        Total Revenue
                                    </div>
                                    <div className="text-2xl font-bold text-white">
                                        {formatCurrency(data.total_revenue)}
                                    </div>
                                </div>
                                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                                        <Ticket size={16} className="text-purple-400" />
                                        Total Tickets
                                    </div>
                                    <div className="text-2xl font-bold text-white">
                                        {data.total_tickets.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div ref={chartRef} className="h-[400px] w-full bg-white rounded-xl p-4 border border-gray-300">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={data.data}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#374151"
                                            tickFormatter={formatDate}
                                            fontSize={12}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            stroke="#60A5FA"
                                            fontSize={12}
                                            tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            stroke="#F97316"
                                            fontSize={12}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'white', borderColor: '#ccc', color: 'black' }}
                                            formatter={(value: number, name: string) => [
                                                name === 'Revenue' ? formatCurrency(value) : value,
                                                name
                                            ]}
                                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                        />
                                        <Legend />
                                        <Bar
                                            yAxisId="right"
                                            dataKey="tickets_sold"
                                            name="Tickets"
                                            barSize={20}
                                            fill="#F97316" /* warm orange for tickets */
                                            radius={[4, 4, 0, 0]}
                                            opacity={0.95}
                                        />
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="revenue"
                                            name="Revenue"
                                            stroke="#06B6D4" /* bright cyan for revenue */
                                            strokeWidth={3}
                                            dot={{ r: 4, strokeWidth: 2 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
