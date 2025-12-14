import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const [bgIndex, setBgIndex] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => setBgIndex((prev) => (prev === 0 ? 1 : 0)), 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900">
        {/* Background Images Layer - fade between them */}
        <div className="absolute inset-0 z-0">
          <img
            src="/img/authbackground1.png"
            alt="Cinema background 1"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out ${
              bgIndex === 0 ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <img
            src="/img/authbackground2.png"
            alt="Cinema background 2"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out ${
              bgIndex === 1 ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>

        {/* Background Pattern / overlay - Made semi-transparent */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/70 via-gray-950/60 to-black/80 z-10">
          {/* Decorative Elements with Animations */}
          <div className="absolute top-20 left-10 w-20 h-20 border border-green-500/30 rounded-lg transform rotate-12 animate-pulse" />
          <div className="absolute top-40 left-32 w-16 h-16 border border-green-500/20 rounded-lg transform -rotate-6 animate-bounce" style={{ animationDuration: '3s' }} />
          <div className="absolute top-60 left-16 w-12 h-12 bg-green-500/10 rounded-lg animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-40 left-20 w-24 h-24 border border-green-500/20 rounded-lg transform rotate-45 animate-spin" style={{ animationDuration: '20s' }} />
          <div className="absolute bottom-20 left-40 w-8 h-8 bg-green-500/20 rounded-lg animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
          
          {/* Floating Particles */}
          <div className="absolute top-1/4 right-20 w-2 h-2 bg-green-400/40 rounded-full animate-ping" />
          <div className="absolute top-1/3 right-40 w-3 h-3 bg-green-400/30 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-1/3 right-32 w-2 h-2 bg-green-400/50 rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />
        </div>
        
        {/* Content */}
        <div className="relative z-20 flex flex-col justify-center px-16">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">C</span>
            </div>
          </div>
          
          {/* Tagline */}
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
            Your Ultimate
            <br />
            <span className="text-green-400">Cinema Experience</span>
          </h1>
          
          <p className="mt-6 text-gray-400 text-lg max-w-md">
            Book tickets, discover movies, and enjoy exclusive offers. 
            Join thousands of cinema lovers today.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Header */}
        <div className="p-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
            Home
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Title */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              {subtitle && (
                <p className="mt-2 text-gray-400">{subtitle}</p>
              )}
            </div>

            {/* Form Content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;