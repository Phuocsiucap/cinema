import { useState, type FormEvent, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { Input, Button, Divider } from '../../components/ui';
import { SocialButton } from '../../components/ui/SocialButton';
import { GoogleIcon, GithubIcon, MicrosoftIcon } from '../../components/icons';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function LoginPage() {
  const navigate = useNavigate();
  const { user, login, loginWithGoogleToken, loginWithGithubCode, loginWithGithub, loginWithMicrosoft, isLoading, error, clearError } = useAuth();
  const githubCodeProcessed = useRef(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
  });

  // Check for login message
  useEffect(() => {
    const loginMessage = localStorage.getItem('loginMessage');
    if (loginMessage) {
      alert(loginMessage);
      localStorage.removeItem('loginMessage');
    }
  }, []);

  // Navigate when user is authenticated
  useEffect(() => {
    if (user && !isLoading) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  // --- CẬP NHẬT: Handle GitHub OAuth callback cho BrowserRouter ---
  useEffect(() => {
    // 1. Lấy code từ URL sạch sẽ (?code=...)
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');

    // 2. Kiểm tra nếu có code VÀ chưa từng xử lý
    if (code && !githubCodeProcessed.current) {
      console.log("Detect GitHub Code:", code);
      
      // Đánh dấu là đã xử lý ngay lập tức để chặn lần gọi thứ 2
      githubCodeProcessed.current = true;

      const executeGithubLogin = async () => {
        try {
          // 3. Gọi API Backend
          await loginWithGithubCode(code);
          
          // 4. Xóa code khỏi URL để nhìn cho chuyên nghiệp (giữ lại /login)
          window.history.replaceState({}, document.title, window.location.pathname);

          // Navigation sẽ được handle tự động khi user state thay đổi
          
        } catch (error: any) {
          console.error('Lỗi login GitHub:', error);
          alert('Đăng nhập thất bại: ' + (error.message || "Unknown error"));
          // Xóa code lỗi để người dùng không bấm F5 bị lỗi tiếp
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };

      executeGithubLogin();
    }
  }, [loginWithGithubCode, navigate]);
  // -------------------------------------------------------------

  const validateForm = () => {
    const errors = { email: '', password: '' };
    let isValid = true;

    if (!formData.email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
      isValid = false;
    }

    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Handle redirect after login
  useEffect(() => {
    if (user && !isLoading) {
      if (user.role && user.role.toLowerCase() === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validateForm()) return;
    try {
      await login(formData);
    } catch {}
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthLayout title="Welcome back" subtitle="Log in to your account">
        <div className="space-y-3">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                await loginWithGoogleToken(credentialResponse.credential!);
              } catch (error) {
                console.error('Google login failed:', error);
              }
            }}
            onError={() => console.log('Login Failed')}
            theme="filled_black"
            size="large"
            text="signin_with"
            shape="rectangular"
            width="100%"
          />
          
          {/* --- CẬP NHẬT: Nút GitHub cho BrowserRouter --- */}
          <SocialButton 
            icon={<GithubIcon />}
            onClick={loginWithGithub}
          >
            GitHub
          </SocialButton>
          
          <SocialButton icon={<MicrosoftIcon />} onClick={loginWithMicrosoft} disabled>
            Microsoft (Coming Soon)
          </SocialButton>
        </div>

        <Divider text="or continue with email" />

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="youremail@email.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={formErrors.email}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            error={formErrors.password}
          />

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-green-400 hover:text-green-300 transition-colors">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="primary" isLoading={isLoading}>
            Log in
          </Button>
        </form>

        <p className="mt-6 text-xs text-gray-500 text-center">
          By logging in, you agree to the{' '}
          <Link to="/terms" className="text-gray-400 hover:text-white underline">Terms of Service</Link>
          {' '}and our{' '}
          <Link to="/privacy" className="text-gray-400 hover:text-white underline">Privacy Policy</Link>.
        </p>

        <p className="mt-8 text-center text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-green-400 hover:text-green-300 font-medium transition-colors">
            Sign up
          </Link>
        </p>
      </AuthLayout>
    </GoogleOAuthProvider>
  );
}

export default LoginPage;
