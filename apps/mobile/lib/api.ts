import axios, { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth.store';
import Constants from 'expo-constants';

const hostUri = Constants.expoConfig?.hostUri;
const ip = hostUri ? hostUri.split(':')[0] : '127.0.0.1';

let rawUrl = process.env.EXPO_PUBLIC_API_URL || `http://${ip}:5000/api/v1`;

if (ip && ip !== '127.0.0.1' && ip !== 'localhost') {
  rawUrl = rawUrl.replace('localhost', ip).replace('127.0.0.1', ip);
}

export const baseURL = rawUrl;
export const baseOrigin = baseURL.replace(/\/api\/v1\/?$/, '');

export const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = useAuthStore.getState().tokens;
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401, refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const tokens = useAuthStore.getState().tokens;
        if (tokens?.refreshToken) {
          const { data } = await axios.post(`${baseURL}/auth/refresh`, {
            refreshToken: tokens.refreshToken,
          });
          const newTokens = data.data.tokens;
          useAuthStore.getState().setTokens(newTokens);
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
