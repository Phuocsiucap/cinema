import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import authService from '../services/authService';

export function EmailVerification() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Check for verification message from protected route
  useEffect(() => {
    const verificationMessage = localStorage.getItem('verificationMessage');
    if (verificationMessage) {
      setMessage(verificationMessage);
      localStorage.removeItem('verificationMessage');
    }
  }, []);

  const sendOtp = async () => {
    if (!user?.email) return;

    setIsSendingOtp(true);
    setError('');
    setMessage('');

    try {
      const response = await authService.sendOtpEmail(user.id, user.email);
      
      if (response.success) {
        setMessage('Mã OTP đã được gửi đến email của bạn!');
        setOtpSent(true);
      } 
    } catch (err: any) {
      setError(err.message || err.error || 'Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!user?.id || !otp.trim()) return;

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await authService.verifyOtp(user.id, otp.trim());
      

      if (response.success) {
        setMessage('Xác thực email thành công! Đang cập nhật thông tin...');
        // Refresh user data to update verification status
        await verifyAccount();
        await refreshUser();
        setMessage('Xác thực email thành công!');
        // Redirect to home page after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(response.message || 'Mã OTP không hợp lệ.');
      }
    } catch (err: any) {
      setError(err.message || err.error || 'Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAccount = async () => {
    try {
      await authService.verifyAccount();
    } catch (err: any) {
      console.error('Failed to verify account:', err);
      // Don't show error to user as this is internal update
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#161b22] rounded-lg border border-gray-700 p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Xác thực Email</h1>
          <p className="text-gray-400">
            Để tiếp tục sử dụng dịch vụ, bạn cần xác thực địa chỉ email của mình.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-[#0d1117] p-4 rounded-lg border border-gray-600">
            <p className="text-sm text-gray-400 mb-1">Email của bạn:</p>
            <p className="text-white font-medium">{user?.email}</p>
          </div>

          {!otpSent ? (
            <Button
              onClick={sendOtp}
              disabled={isSendingOtp}
              className="w-full"
            >
              {isSendingOtp ? 'Đang gửi...' : 'Gửi mã xác thực'}
            </Button>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nhập mã OTP (6 chữ số)
                </label>
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>

              <Button
                onClick={verifyOtp}
                disabled={isLoading || otp.length !== 6}
                className="w-full"
              >
                {isLoading ? 'Đang xác thực...' : 'Xác thực'}
              </Button>

              <Button
                onClick={sendOtp}
                variant="outline"
                disabled={isSendingOtp}
                className="w-full"
              >
                {isSendingOtp ? 'Đang gửi...' : 'Gửi lại mã OTP'}
              </Button>
            </>
          )}

          {message && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-green-400 text-sm">{message}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-700">
            <Button
              onClick={logout}
              variant="outline"
              className="w-full text-red-400 border-red-400 hover:bg-red-400/10"
            >
              Đăng xuất
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}