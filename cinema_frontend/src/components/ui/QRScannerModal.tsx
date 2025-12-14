import { useState, useEffect, useRef } from 'react';
import { X, QrCode, CheckCircle, XCircle, Loader2, Move, Camera, CameraOff } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../services/api'

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ScanResult {
  success: boolean;
  message: string;
  data?: {
    seatbookingId: string;
    movieTitle: string;
    seat: string;
    customerName: string;
    showtime: string;
    qr_data: string;
  };
}

export function QRScannerModal({ isOpen, onClose }: QRScannerModalProps) {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Initialize scanner
  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      // Center modal on open
      setPosition({
        x: (window.innerWidth - 450) / 2,
        y: (window.innerHeight - 600) / 2
      });
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setError(null);
      setScanResult(null);

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        () => { } // Ignore scan failures
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Không thể truy cập camera. Vui lòng cấp quyền camera.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    // Stop scanner temporarily
    await stopScanner();

    // Process the scanned QR code
    await processQRCode(decodedText);
  };

  const processQRCode = async (qrData: string) => {
    setIsProcessing(true);
    setScanResult(null);

    try {

      if (qrData.startsWith('TICKET-')) {
        // Format: TICKET-{seatbookingId}
        console.log('Parsed QR Data:', qrData);
      } else {
        throw new Error('Mã QR không hợp lệ');
      }
      // Call API to verify and check-in
      const response = await api.post<{
        success: boolean;
        message: string;
        data?: {
          seatbookingId: string;
          movieTitle: string;
          seat: string;
          customerName: string;
          showtime: string;
          qr_data: string;
        }
      }>(`/bookings/seats/checkin`, {
        qr_data: qrData
      });

      if (response.success && response.data) {
        setScanResult({
          success: true,
          message: response.message || 'Check-in thành công!',
          data: {
            seatbookingId: response.data.seatbookingId,
            movieTitle: response.data.movieTitle,
            seat: response.data.seat,
            customerName: response.data.customerName,
            showtime: response.data.showtime,
            qr_data: response.data.qr_data,
          }
        });
      }
    } catch (err: any) {
      console.error('Check-in error:', err);
      setScanResult({
        success: false,
        message: err.message || 'Lỗi xác minh vé',
        data: undefined
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    startScanner();
  };

  // Draggable handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      const rect = modalRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 450, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      const touch = e.touches[0];
      setIsDragging(true);
      const rect = modalRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top
        });
      }
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      const touch = e.touches[0];
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 450, touch.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 100, touch.clientY - dragOffset.y))
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset]);

  const handleClose = () => {
    stopScanner();
    setScanResult(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop - click to close */}
      <div
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        onClick={handleClose}
      />

      {/* Modal - Draggable */}
      <div
        ref={modalRef}
        className="absolute bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl w-[420px] pointer-events-auto"
        style={{
          left: position.x,
          top: position.y,
          cursor: isDragging ? 'grabbing' : 'default'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Header - Drag Handle */}
        <div className="drag-handle flex items-center justify-between p-4 border-b border-gray-700 cursor-grab active:cursor-grabbing">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <QrCode size={24} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-white font-bold">Quét Vé Check-in</h2>
              <p className="text-gray-400 text-xs">Quét mã QR trên vé</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Move size={18} className="text-gray-500" />
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Scanner Area */}
        <div className="p-4">
          {/* QR Reader Container */}
          <div
            id="qr-reader"
            className="w-full bg-black rounded-xl overflow-hidden"
            style={{ minHeight: '300px' }}
          />

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Scanner Controls */}
          {!isScanning && !scanResult && (
            <button
              onClick={startScanner}
              className="w-full mt-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Camera size={20} />
              Bắt đầu quét
            </button>
          )}

          {isScanning && (
            <button
              onClick={stopScanner}
              className="w-full mt-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <CameraOff size={20} />
              Dừng quét
            </button>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
              <div className="flex items-center justify-center gap-3">
                <Loader2 size={24} className="text-yellow-400 animate-spin" />
                <span className="text-yellow-400 font-medium">Đang xác minh vé...</span>
              </div>
            </div>
          )}

          {/* Scan Result */}
          {scanResult && (
            <div className={`mt-4 p-4 rounded-lg border ${scanResult.success
              ? 'bg-green-500/20 border-green-500/50'
              : 'bg-red-500/20 border-red-500/50'
              }`}>
              <div className="flex items-center gap-3 mb-3">
                {scanResult.success ? (
                  <CheckCircle size={32} className="text-green-400" />
                ) : (
                  <XCircle size={32} className="text-red-400" />
                )}
                <span className={`font-bold text-lg ${scanResult.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                  {scanResult.message}
                </span>
              </div>

              {scanResult.success && scanResult.data && (
                <div className="space-y-3 border-t border-white/10 pt-3 mt-3">
                  {/* Movie Title - Highlighted */}
                  <div className="text-center pb-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Phim</p>
                    <h3 className="text-white font-bold text-lg">{scanResult.data.movieTitle}</h3>
                  </div>

                  {/* Seat - Big Badge */}
                  <div className="flex justify-center py-2">
                    <div className="bg-green-500/30 border border-green-500 rounded-lg px-6 py-3 text-center">
                      <p className="text-xs text-green-300 uppercase tracking-wider mb-1">Ghế</p>
                      <span className="text-green-400 font-bold text-2xl">{scanResult.data.seat}</span>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm bg-white/5 rounded-lg p-3">
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">Khách hàng</p>
                      <p className="text-white font-medium">{scanResult.data.customerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">Suất chiếu</p>
                      <p className="text-white font-medium">{scanResult.data.showtime}</p>
                    </div>
                  </div>

                  {/* Ticket ID - Small at bottom */}
                  <div className="text-center pt-2 border-t border-white/5">
                    <p className="text-gray-500 text-xs">Mã vé</p>
                    <p className="text-gray-400 font-mono text-xs mt-0.5">{scanResult.data.seatbookingId}</p>
                  </div>
                </div>
              )}

              <button
                onClick={resetScanner}
                className="w-full mt-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
              >
                Quét vé tiếp
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <p className="text-gray-500 text-xs text-center">
            Di chuyển modal bằng cách kéo thanh tiêu đề
          </p>
        </div>
      </div>
    </div>
  );
}

export default QRScannerModal;
