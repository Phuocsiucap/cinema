import api from './api';
import type { User } from '../types/auth';

export interface UserFilters {
  search?: string;
  role?: 'customer' | 'admin' | 'seller';
  is_active?: boolean;
  is_verified?: boolean;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  skip: number;
  limit: number;
}

export interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  role?: 'customer' | 'admin' | 'seller';
}

export interface UpdateUserData {
  full_name?: string;
  phone_number?: string;
  avatar_url?: string;
  role?: 'customer' | 'admin' | 'seller';
  is_active?: boolean;
  is_verified?: boolean;
}

const USER_API = '/users';

export const userService = {
  // Get list of users with pagination and filters
  getUsers: async (
    skip: number = 0,
    limit: number = 10,
    filters?: UserFilters
  ): Promise<PaginatedUsers> => {
    const params = new URLSearchParams();
    params.append('skip', String(skip));
    params.append('limit', String(limit));

    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.role) {
      params.append('role', filters.role);
    }
    if (filters?.is_active !== undefined) {
      params.append('is_active', String(filters.is_active));
    }
    if (filters?.is_verified !== undefined) {
      params.append('is_verified', String(filters.is_verified));
    }

    return api.get<PaginatedUsers>(`${USER_API}/?${params.toString()}`);
  },

  // Get user info by ID
  getUser: async (id: string): Promise<User> => {
    return api.get<User>(`${USER_API}/${id}`);
  },

  // Create new user
  createUser: async (data: CreateUserData): Promise<User> => {
    return api.post<User>(`${USER_API}/`, data);
  },

  // Update user
  updateUser: async (id: string, data: UpdateUserData): Promise<User> => {
    return api.put<User>(`${USER_API}/${id}`, data);
  },

  // Delete user
  deleteUser: async (id: string): Promise<void> => {
    return api.delete(`${USER_API}/${id}`);
  },

  // Toggle active status
  toggleActive: async (id: string, is_active: boolean): Promise<User> => {
    return api.put<User>(`${USER_API}/${id}`, { is_active });
  },
};

export default userService;
