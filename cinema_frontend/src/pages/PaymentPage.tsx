import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Lock, CreditCard, ChevronRight } from 'lucide-react';
import { MainLayout } from '../components/layouts';
import { showtimeService, type Showtime } from '../services/showtimeService';
import { createBooking, confirmBooking } from '../services/bookingService';
import { useAuth } from '../contexts/AuthContext';
import { promotionService } from '../services'

interface PaymentState {
  showtime: Showtime;
  selectedSeats: {
    id: string;
    row: string;
    number: number;
    seat_type: 'STANDARD' | 'VIP' | 'COUPLE';
    price: number;
  }[];
  totalPrice: number;
}

type PaymentMethod = 'card' | 'paypal' | 'momo' | 'vnpay';

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = location.state as PaymentState | null;

  const [showtime, setShowtime] = useState<Showtime | null>(state?.showtime || null);
  const [selectedSeats] = useState(state?.selectedSeats || []);
  const [totalPrice] = useState(state?.totalPrice || 0);
  const [isLoading, setIsLoading] = useState(!state);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Promotion code state
  const [promotionCode, setPromotionCode] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState<{
    code: string;
    discount_amount: number;
    final_amount: number;
    title?: string;
  } | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // Get showtimeId from URL if state is not available
  const searchParams = new URLSearchParams(location.search);
  const showtimeId = searchParams.get('showtimeId');

  useEffect(() => {
    // If no state, try to load from API
    const loadData = async () => {
      if (!state && showtimeId) {
        try {
          setIsLoading(true);
          const showtimeData = await showtimeService.getShowtime(showtimeId);
          setShowtime(showtimeData);
          // Note: seat details would need to be fetched separately
        } catch (err) {
          console.error('Failed to load showtime:', err);
          navigate('/');
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (!state) {
      loadData();
    }
  }, [state, showtimeId, navigate]);

  // Redirect if no data
  useEffect(() => {
    if (!isLoading && !showtime) {
      navigate('/');
    }
  }, [isLoading, showtime, navigate]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + ' / ' + v.substring(2, 4);
    }
    return v;
  };

  const handleApplyPromotion = async () => {
    if (!promotionCode.trim()) {
      setPromoError('Vui lòng nhập mã giảm giá');
      return;
    }

    setIsValidatingPromo(true);
    setPromoError(null);

    try {
      const response = await promotionService.validatePromotionCode(promotionCode.trim().toUpperCase(), totalPrice);
      
      if (response.valid) {
        setAppliedPromotion({
          code: response.promotion.code,
          discount_amount: response.discount_amount,
          final_amount: response.final_amount,
          title: response.promotion.title,
        });
        setPromoError(null);
      } 
    } catch (err: any) {
      console.error('Error validating promotion:', err);
      setPromoError(err.error || 'Code is invalid or cannot be applied. Please select another code.');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromotion = () => {
    setAppliedPromotion(null);
    setPromotionCode('');
    setPromoError(null);
  };

  const handleConfirmPayment = async () => {
    if (paymentMethod === 'card') {
      if (!cardNumber || !expiryDate || !cvv || !cardName) {
        setError('Please fill in all card information');
        return;
      }
    }

    if (!user?.id || !showtime?.id) {
      setError('Please log in to continue');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Create booking (if not already created)
      let currentBookingId = bookingId;
      if (!currentBookingId) {
        const seatIds = selectedSeats.map(s => s.id);
        const createResult = await createBooking(
          showtime.id, 
          seatIds, 
          user.id,
          appliedPromotion?.code // Pass promotion code
        );
        
        if (!createResult.success) {
          setError(createResult.message || 'Unable to create booking');
          setIsProcessing(false);
          return;
        }
        
        currentBookingId = createResult.data!.booking_id;
        setBookingId(currentBookingId);
      }

      // Step 2: Simulate payment processing (in real app, integrate with payment gateway)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 3: Confirm payment
      const paymentMethodMap: Record<PaymentMethod, string> = {
        card: 'CREDIT_CARD',
        paypal: 'PAYPAL',
        momo: 'MOMO',
        vnpay: 'VNPAY',
      };

      const confirmResult = await confirmBooking(
        currentBookingId,
        paymentMethodMap[paymentMethod],
        `TXN-${Date.now()}` // Transaction reference
      );

      if (!confirmResult.success) {
        setError(confirmResult.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      // Navigate to success page or my tickets
      navigate('/my-tickets', { 
        state: { 
          success: true, 
          bookingId: currentBookingId,
          message: 'Payment successful!' 
        } 
      });
    } catch (err: any ) {
      console.error('Payment error:', err);
      setError(err.message || err.error || 'An error occurred during payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const getSeatLabel = () => {
    return selectedSeats
      .map(s => `${s.row}${s.number}`)
      .sort()
      .join(', ');
  };

  const getTicketBreakdown = () => {
    const standard = selectedSeats.filter(s => s.seat_type === 'STANDARD');
    const vip = selectedSeats.filter(s => s.seat_type === 'VIP');
    const couple = selectedSeats.filter(s => s.seat_type === 'COUPLE');
    
    const breakdown = [];
    if (standard.length > 0) {
      const price = standard[0].price;
      breakdown.push({ type: 'Standard Seat', count: standard.length, price, total: standard.length * price });
    }
    if (vip.length > 0) {
      const price = vip[0].price;
      breakdown.push({ type: 'VIP Seat', count: vip.length, price, total: vip.length * price });
    }
    if (couple.length > 0) {
      const price = couple[0].price;
      breakdown.push({ type: 'Couple Seat', count: couple.length, price, total: couple.length * price });
    }
    return breakdown;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (!showtime) {
    return null;
  }

  return (
    <MainLayout>
      {/* Background */}
      {showtime.movie?.poster_url && (
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
          style={{ 
            backgroundImage: `url(${showtime.movie.poster_url})`,
          }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
        </div>
      )}

      <div className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to={`/movie/${showtime.movie_id}`} className="hover:text-white transition-colors">
              {showtime.movie?.title}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link 
              to={`/booking/seats/${showtime.id}`} 
              className="hover:text-white transition-colors"
            >
              Select Seats
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Payment</span>
          </nav>

          {/* Page Heading */}
          <div className="mb-10">
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white">
              Payment
            </h1>
            <p className="text-base font-normal leading-normal text-gray-400">
              Complete payment to receive movie tickets
            </p>
          </div>

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
            {/* Left Column: Payment Details */}
            <div className="lg:col-span-2">
              <div className="flex flex-col gap-8">
                {/* Payment Method Section */}
                <div>
                  <h2 className="text-white text-[22px] font-bold leading-tight tracking-tight mb-4">
                    Choose payment method
                  </h2>
                  <div className="flex flex-col gap-3">
                    {/* Credit/Debit Card */}
                    <label className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 border-solid p-4 transition-all ${
                      paymentMethod === 'card' 
                        ? 'border-red-500 bg-red-500/10 ring-2 ring-red-500/50' 
                        : 'border-white/10 bg-black/40 hover:border-white/20'
                    }`}>
                      <input
                        type="radio"
                        name="payment-method"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="h-5 w-5 border-2 border-gray-500 bg-transparent text-red-500 focus:ring-red-500"
                      />
                      <div className="flex grow items-center justify-between">
                        <p className="text-white text-sm font-medium">Credit/Debit Card</p>
                        <div className="flex items-center gap-2">
                          <img className="h-6" src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" />
                          <img className="h-6" src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" />
                        </div>
                      </div>
                    </label>

                    {/* MoMo */}
                    <label className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 border-solid p-4 transition-all ${
                      paymentMethod === 'momo' 
                        ? 'border-red-500 bg-red-500/10 ring-2 ring-red-500/50' 
                        : 'border-white/10 bg-black/40 hover:border-white/20'
                    }`}>
                      <input
                        type="radio"
                        name="payment-method"
                        checked={paymentMethod === 'momo'}
                        onChange={() => setPaymentMethod('momo')}
                        className="h-5 w-5 border-2 border-gray-500 bg-transparent text-red-500 focus:ring-red-500"
                      />
                      <div className="flex grow items-center justify-between">
                        <p className="text-white text-sm font-medium">MoMo Wallet</p>
                        <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                          M
                        </div>
                      </div>
                    </label>

                    {/* VNPay */}
                    <label className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 border-solid p-4 transition-all ${
                      paymentMethod === 'vnpay' 
                        ? 'border-red-500 bg-red-500/10 ring-2 ring-red-500/50' 
                        : 'border-white/10 bg-black/40 hover:border-white/20'
                    }`}>
                      <input
                        type="radio"
                        name="payment-method"
                        checked={paymentMethod === 'vnpay'}
                        onChange={() => setPaymentMethod('vnpay')}
                        className="h-5 w-5 border-2 border-gray-500 bg-transparent text-red-500 focus:ring-red-500"
                      />
                      <div className="flex grow items-center justify-between">
                        <p className="text-white text-sm font-medium">VNPay</p>
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                          VN
                        </div>
                      </div>
                    </label>

                    {/* PayPal */}
                    <label className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 border-solid p-4 transition-all ${
                      paymentMethod === 'paypal' 
                        ? 'border-red-500 bg-red-500/10 ring-2 ring-red-500/50' 
                        : 'border-white/10 bg-black/40 hover:border-white/20'
                    }`}>
                      <input
                        type="radio"
                        name="payment-method"
                        checked={paymentMethod === 'paypal'}
                        onChange={() => setPaymentMethod('paypal')}
                        className="h-5 w-5 border-2 border-gray-500 bg-transparent text-red-500 focus:ring-red-500"
                      />
                      <div className="flex grow items-center justify-between">
                        <p className="text-white text-sm font-medium">PayPal</p>
                        <div className="text-blue-500 font-bold text-sm">PayPal</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Credit Card Form - Only show when card is selected */}
                {paymentMethod === 'card' && (
                  <div className="rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Card Information</h3>
                    <div className="grid grid-cols-1 gap-6">
                      <label className="flex flex-col">
                        <p className="text-sm font-medium leading-normal pb-2 text-gray-300">Card Number</p>
                        <div className="relative">
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                            maxLength={19}
                            className="w-full rounded-lg border border-white/10 bg-black/60 p-3 pl-10 text-base text-white placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                            placeholder="0000 0000 0000 0000"
                          />
                          <CreditCard className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        </div>
                      </label>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <label className="flex flex-col">
                          <p className="text-sm font-medium leading-normal pb-2 text-gray-300">Expiry Date</p>
                          <input
                            type="text"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
                            maxLength={7}
                            className="w-full rounded-lg border border-white/10 bg-black/60 p-3 text-base text-white placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                            placeholder="MM / YY"
                          />
                        </label>
                        <label className="flex flex-col">
                          <p className="text-sm font-medium leading-normal pb-2 text-gray-300">CVV</p>
                          <input
                            type="text"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                            maxLength={3}
                            className="w-full rounded-lg border border-white/10 bg-black/60 p-3 text-base text-white placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                            placeholder="123"
                          />
                        </label>
                      </div>
                      <label className="flex flex-col">
                        <p className="text-sm font-medium leading-normal pb-2 text-gray-300">Cardholder Name</p>
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value.toUpperCase())}
                          className="w-full rounded-lg border border-white/10 bg-black/60 p-3 text-base text-white placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                          placeholder="NGUYEN VAN A"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Other payment methods info */}
                {paymentMethod === 'momo' && (
                  <div className="rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm p-6 text-center">
                    <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                      M
                    </div>
                    <p className="text-white mb-2">You will be redirected to the MoMo app to complete payment</p>
                    <p className="text-gray-400 text-sm">Please ensure you have the MoMo app installed</p>
                  </div>
                )}

                {paymentMethod === 'vnpay' && (
                  <div className="rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm p-6 text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                      VNPay
                    </div>
                    <p className="text-white mb-2">You will be redirected to the VNPay payment gateway</p>
                    <p className="text-gray-400 text-sm">Supports payment via ATM cards, Visa, Mastercard</p>
                  </div>
                )}

                {paymentMethod === 'paypal' && (
                  <div className="rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm p-6 text-center">
                    <div className="text-blue-500 font-bold text-3xl mb-4">PayPal</div>
                    <p className="text-white mb-2">You will be redirected to PayPal to complete payment</p>
                    <p className="text-gray-400 text-sm">Secure payment with your PayPal account</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 flex flex-col gap-6 rounded-xl bg-black/60 backdrop-blur-sm p-6 border border-white/10">
                <h2 className="text-white text-[22px] font-bold leading-tight tracking-tight border-b border-white/10 pb-4">
                  Booking Information
                </h2>
                
                {/* Movie Info */}
                <div className="flex gap-4">
                  {showtime.movie?.poster_url && (
                    <img
                      className="h-32 w-24 rounded-lg object-cover"
                      src={showtime.movie.poster_url}
                      alt={showtime.movie.title}
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-white">{showtime.movie?.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {showtime.movie?.duration_minutes} min
                    </p>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="space-y-3 border-y border-white/10 py-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cinema</span>
                    <span className="font-medium text-white text-right">
                      {showtime.room?.cinema?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Room</span>
                    <span className="font-medium text-white">{showtime.room?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Show Date</span>
                    <span className="font-medium text-white text-right">
                      {formatDate(showtime.start_time)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Showtime</span>
                    <span className="font-medium text-white">{formatTime(showtime.start_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Seats</span>
                    <span className="font-medium text-white">{getSeatLabel()}</span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 text-sm">
                  {getTicketBreakdown().map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-gray-400">
                        {item.type} ({item.count} x {formatPrice(item.price)})
                      </span>
                      <span className="font-medium text-white">{formatPrice(item.total)}</span>
                    </div>
                  ))}
                </div>

                {/* Promotion Code Section */}
                <div className="border-t border-white/10 pt-4">
                  {!appliedPromotion ? (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-300">
                        Promotion Code
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promotionCode}
                          onChange={(e) => setPromotionCode(e.target.value.toUpperCase())}
                          placeholder="Enter code"
                          className="flex-1 rounded-lg border border-white/10 bg-black/60 p-3 text-sm text-white placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                          disabled={isValidatingPromo}
                        />
                        <button
                          onClick={handleApplyPromotion}
                          disabled={isValidatingPromo || !promotionCode.trim()}
                          className="px-6 py-3 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isValidatingPromo ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                          ) : (
                            'Apply'
                          )}
                        </button>
                      </div>
                      {promoError && (
                        <p className="text-xs text-red-400">{promoError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-400">
                            {appliedPromotion.code}
                          </p>
                          {appliedPromotion.title && (
                            <p className="text-xs text-gray-400 mt-1">{appliedPromotion.title}</p>
                          )}
                        </div>
                        <button
                          onClick={handleRemovePromotion}
                          className="text-xs text-red-400 hover:text-red-300 underline"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-green-500/20">
                        <span className="text-gray-400">Discount</span>
                        <span className="font-medium text-green-400">
                          - {formatPrice(appliedPromotion.discount_amount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-lg font-bold text-white">Total</span>
                  <span className="text-2xl font-black text-red-500">
                    {formatPrice(appliedPromotion ? appliedPromotion.final_amount : totalPrice)}
                  </span>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Confirm Button */}
                <button
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                  className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 bg-red-600 text-white gap-2 text-base font-bold leading-normal tracking-wide hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Confirm Payment</span>
                  )}
                </button>

                {/* Security Note */}
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Lock className="w-4 h-4" />
                  <span>Payment secured with SSL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
