import { createContext, useContext, useReducer, useEffect, useRef, type ReactNode } from 'react';
import type { AuthState, AuthAction, LoginCredentials, RegisterCredentials } from '../types/auth';
import authService from '../services/authService';

// Initial State
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,  // Start with true, will be set to false after init
  error: null,
  isAuthenticated: false,
};

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        isAuthenticated: false,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,  // Don't show loading after logout
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

// Context Type
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  loginWithToken: (token: string) => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const initRef = useRef(false);

  // Check for existing token on mount
  useEffect(() => {
    if (initRef.current) return; // Prevent running twice in Strict Mode
    initRef.current = true;

    const init = async () => {
      dispatch({ type: 'AUTH_START' });
      try {
        const token = authService.getToken();
        if (token && authService.isAuthenticated()) {
          const user = await authService.getInfoUserByToken();
          if (user) {
            dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
          } else {
            // Invalid payload — remove stored token to avoid repeated failures
            authService.removeToken();
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        dispatch({ type: 'LOGOUT' });
      }
    };
    init();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authService.login(credentials);
      const token = response.token;
      authService.setToken(token);
      
      const user = await authService.getInfoUserByToken();
      if (user){
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
      } 
      
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: (error as Error).message });
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    dispatch({ type: 'AUTH_START' });
    try {
      await authService.register(credentials);
      // Auto login after register
      await login({ email: credentials.email, password: credentials.password });
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: (error as Error).message });
      throw error;
    }
  };

  const logout = async () => {
    const token = state.token;
    if (token) {
      try {
        await authService.logout(token);
      } catch {
        // Continue with logout even if API fails
      }
    }
    authService.removeToken();
    dispatch({ type: 'LOGOUT' });
  };

  const loginWithGoogle = async () => {
    await authService.loginWithGoogle();
  };

  const loginWithGithub = async () => {
    await authService.loginWithGithub();
  };

  const loginWithMicrosoft = async () => {
    await authService.loginWithMicrosoft();
  };

  const loginWithToken =async (token: string) => {
    authService.setToken(token);
    const user = await authService.getInfoUserByToken();
    if (user) {
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
    }
  };

  const refreshUser = async () => {
    try {
      const token = state.token;
      if (token) {
        const user = await authService.getInfoUserByToken();
        if (user) {
          dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
        }
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        loginWithGoogle,
        loginWithGithub,
        loginWithMicrosoft,
        loginWithToken,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
