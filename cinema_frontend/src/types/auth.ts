// Auth Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
  role: 'customer' | 'admin' | 'seller';
  is_active: boolean;
  is_verified: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

// Auth Actions
export type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };
