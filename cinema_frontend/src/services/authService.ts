import api from './api';
import type {User, AuthResponse, LoginCredentials, RegisterCredentials } from '../types/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/login', credentials);
  },

  async register(credentials: RegisterCredentials): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/register', credentials);
  },

  async logout(token: string): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/logout', { token });
  },

  async loginWithGoogle(): Promise<void> {
    // Redirect to Google OAuth
    const googleAuthUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8002'}/auth/google`;
    window.location.href = googleAuthUrl;
  },

  async loginWithGoogleToken(token: string): Promise<AuthResponse & { user: User }> {
    return api.post<AuthResponse & { user: User }>('/auth/google/token', { token });
  },

  async loginWithGithub(): Promise<void> {
    const githubAuthUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8002'}/auth/github`;
    window.location.href = githubAuthUrl;
  },

  async loginWithGithubCode(code: string): Promise<AuthResponse & { user: User }> {
    return api.post<AuthResponse >('/auth/github', { code });
  },

  async loginWithMicrosoft(): Promise<void> {
    const microsoftAuthUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8002'}/auth/microsoft`;
    window.location.href = microsoftAuthUrl;
  },

  // Parse JWT token to get user info
  parseToken(token: string) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  },

  // Get user info from API (uses token from localStorage via api.ts)
  async getInfoUserByToken(): Promise<User> {
    console.log('Calling getInfoUserByToken');
    const result = await api.get<User>('/users/me');
    console.log('getInfoUserByToken result:', result);
    return result;
  },
  
  // Store token in localStorage
  setToken(token: string): void {
    localStorage.setItem('token', token);
  },

  // Get token from localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  },

  // Remove token from localStorage
  removeToken(): void {
    localStorage.removeItem('token');
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    const payload = this.parseToken(token);
    if (!payload) return false;
    
    // Check if token is expired
    const now = Date.now() / 1000;
    return payload.exp > now;
  },

  // Email verification functions
  async sendOtpEmail(userId: string, recipientEmail: string): Promise<{ success: boolean; message?: string }> {
    return api.post<{ success: boolean; message?: string }>('/auth/send-otp-email', { userId, recipientEmail });
  },

  async verifyOtp(userId: string, otpCode: string): Promise<{ success: boolean; message?: string }> {
    return api.post<{ success: boolean; message?: string }>('/auth/verify-otp', { userId, otpCode });
  },

  async verifyAccount(): Promise<{ message: string; is_verified: boolean; user: User }> {
    return api.post<{ message: string; is_verified: boolean; user: User }>('/users/verify-account', {});
  },

  // Password reset functions
  async forgotPassword(email: string): Promise<{ success: boolean; message: string; reset_url?: string; userId?: string }> {
    return api.post<{ success: boolean; message: string; reset_url?: string; userId?: string }>('/auth/forgot-password', { recipientEmail: email });
  },

  async resetPasswordWithOTP(userId: string, otpCode: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return api.post<{ success: boolean; message: string }>('/auth/reset-password-otp', { userId, otpCode, newPassword });
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/reset-password', { token, new_password: newPassword });
  }
};

export default authService;
