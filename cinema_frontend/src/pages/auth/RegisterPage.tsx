import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { Input, Button, Divider } from '../../components/ui';
import { SocialButton } from '../../components/ui/SocialButton';
import { GoogleIcon, GithubIcon, MicrosoftIcon } from '../../components/icons';
import { useAuth } from '../../contexts/AuthContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, loginWithGoogle, loginWithGithub, loginWithMicrosoft, isLoading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
  });
  
  const [formErrors, setFormErrors] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
  });

  const validateForm = () => {
    const errors = {
      full_name: '',
      email: '',
      phone_number: '',
      password: '',
      confirmPassword: '',
    };
    let isValid = true;

    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required';
      isValid = false;
    }

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
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      await register({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone_number || undefined,
      });
      navigate('/');
    } catch {
      // Error is handled by context
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
      title="Create your free account" 
      subtitle="Connect to Cinema with:"
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

      {/* Register Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          placeholder="John Doe"
          value={formData.full_name}
          onChange={(e) => handleInputChange('full_name', e.target.value)}
          error={formErrors.full_name}
          autoComplete="name"
        />

        <Input
          label="Email"
          type="email"
          placeholder="youremail@email.com"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          error={formErrors.email}
          autoComplete="email"
        />

        <Input
          label="Phone Number (Optional)"
          type="tel"
          placeholder="+84 123 456 789"
          value={formData.phone_number}
          onChange={(e) => handleInputChange('phone_number', e.target.value)}
          error={formErrors.phone_number}
          autoComplete="tel"
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter a unique password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          error={formErrors.password}
          autoComplete="new-password"
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          error={formErrors.confirmPassword}
          autoComplete="new-password"
        />

        <Button 
          type="submit" 
          variant="primary"
          isLoading={isLoading}
        >
          Continue
        </Button>
      </form>

      {/* Terms */}
      <p className="mt-6 text-xs text-gray-500 text-center leading-relaxed">
        By creating an account you agree to the{' '}
        <Link to="/terms" className="text-gray-400 hover:text-white underline">
          Terms of Service
        </Link>
        {' '}and our{' '}
        <Link to="/privacy" className="text-gray-400 hover:text-white underline">
          Privacy Policy
        </Link>
        . We'll occasionally send you emails about news, products, and services; you can opt-out anytime.
      </p>

      {/* Login Link */}
      <p className="mt-8 text-center text-gray-400">
        Already have an account?{' '}
        <Link 
          to="/login" 
          className="text-green-400 hover:text-green-300 font-medium transition-colors"
        >
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default RegisterPage;
