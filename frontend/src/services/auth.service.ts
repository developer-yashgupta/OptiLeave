import apiClient from '@/lib/api-client';
import { AuthResult, LoginCredentials } from '@/types/auth';

export const authService = {
  /**
   * Authenticate user with email and password
   */
  login: async (credentials: LoginCredentials): Promise<AuthResult> => {
    const response = await apiClient.post<AuthResult>('/api/auth/login', credentials);
    return response.data;
  },

  /**
   * Refresh JWT token using refresh token
   */
  refresh: async (refreshToken: string): Promise<AuthResult> => {
    const response = await apiClient.post<AuthResult>('/api/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  /**
   * Logout user and invalidate token
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/api/auth/logout');
  },
};
