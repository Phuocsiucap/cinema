import { useState, type FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { Input, Button, Divider } from '../../components/ui';
import { SocialButton } from '../../components/ui/SocialButton';
import { GoogleIcon, GithubIcon, MicrosoftIcon } from '../../components/icons';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const {user, login, loginWithGoogle, loginWithGithub, loginWithMicrosoft, isLoading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
  });

  // Check for login message from protected route
  useEffect(() => {
    const loginMessage = localStorage.getItem('loginMessage');
    if (loginMessage) {
      alert(loginMessage);
      localStorage.removeItem('loginMessage');
    }
  }, []);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) return;

    try {
      await login(formData);
      if (user && user.role === 'admin') {
        navigate('/admin');
        return;
      }
      navigate('/');
    } catch {
      
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <AuthLayout 
      title="Welcome back" 
      subtitle="Log in to your account"
    >
      {/* Social Login Buttons */}
      <div className="space-y-3">
        <SocialButton 
          icon={<GoogleIcon />}
          onClick={loginWithGoogle}
        >
          Google
        </SocialButton>
        
        <SocialButton 
          icon={<GithubIcon />}
          onClick={loginWithGithub}
        >
          GitHub
        </SocialButton>
        
        <SocialButton 
          icon={<MicrosoftIcon />}
          onClick={loginWithMicrosoft}
          disabled
        >
          Microsoft (Coming Soon)
        </SocialButton>
      </div>

      <Divider text="or continue with email" />

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Login Form */}
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
          <Link 
            to="/forgot-password" 
            className="text-sm text-green-400 hover:text-green-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button 
          type="submit" 
          variant="primary"
          isLoading={isLoading}
        >
          Log in
        </Button>
      </form>

      {/* Terms */}
      <p className="mt-6 text-xs text-gray-500 text-center">
        By logging in, you agree to the{' '}
        <Link to="/terms" className="text-gray-400 hover:text-white underline">
          Terms of Service
        </Link>
        {' '}and our{' '}
        <Link to="/privacy" className="text-gray-400 hover:text-white underline">
          Privacy Policy
        </Link>
        .
      </p>

      {/* Register Link */}
      <p className="mt-8 text-center text-gray-400">
        Don't have an account?{' '}
        <Link 
          to="/register" 
          className="text-green-400 hover:text-green-300 font-medium transition-colors"
        >
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}

export default LoginPage;
