import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code) {
      // If we have a code, redirect to login with the code in the URL
      navigate(`/login?code=${code}${state ? `&state=${state}` : ''}`, { replace: true });
    } else {
      // No code, just redirect to login
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;