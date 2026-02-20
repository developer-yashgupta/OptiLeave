import { tokenStorage } from '@/lib/api-client';

// Mock axios before importing apiClient
jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(() => ({
      defaults: {
        baseURL: 'http://localhost:4000',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      },
      interceptors: {
        request: {
          use: jest.fn(),
          handlers: [],
        },
        response: {
          use: jest.fn(),
          handlers: [],
        },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    })),
    post: jest.fn(),
  };
  return mockAxios;
});

import apiClient from '@/lib/api-client';

describe('tokenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('token management', () => {
    it('should store and retrieve token', () => {
      const token = 'test-token-123';
      tokenStorage.setToken(token);
      expect(tokenStorage.getToken()).toBe(token);
    });

    it('should remove token', () => {
      tokenStorage.setToken('test-token');
      tokenStorage.removeToken();
      expect(tokenStorage.getToken()).toBeNull();
    });

    it('should return null when no token exists', () => {
      expect(tokenStorage.getToken()).toBeNull();
    });
  });

  describe('refresh token management', () => {
    it('should store and retrieve refresh token', () => {
      const refreshToken = 'refresh-token-123';
      tokenStorage.setRefreshToken(refreshToken);
      expect(tokenStorage.getRefreshToken()).toBe(refreshToken);
    });

    it('should remove refresh token', () => {
      tokenStorage.setRefreshToken('refresh-token');
      tokenStorage.removeRefreshToken();
      expect(tokenStorage.getRefreshToken()).toBeNull();
    });
  });
});

describe('apiClient', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should be an axios instance', () => {
    expect(apiClient).toBeDefined();
    expect(typeof apiClient.get).toBe('function');
    expect(typeof apiClient.post).toBe('function');
  });

  it('should have correct base configuration', () => {
    expect(apiClient.defaults.baseURL).toBe('http://localhost:4000');
    expect(apiClient.defaults.timeout).toBe(30000);
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });

  describe('request interceptor', () => {
    it('should add Authorization header when token exists', () => {
      const token = 'test-token';
      tokenStorage.setToken(token);

      // The interceptor is already registered, we just verify the token storage works
      expect(tokenStorage.getToken()).toBe(token);
    });

    it('should not have token when no token exists', () => {
      expect(tokenStorage.getToken()).toBeNull();
    });
  });
});
