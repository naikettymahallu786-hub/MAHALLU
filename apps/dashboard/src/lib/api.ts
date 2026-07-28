import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://mahallu-backend-clae.onrender.com/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mahallu-auth');
      if (stored) {
        const { state } = JSON.parse(stored);
        if (state?.tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${state.tokens.accessToken}`;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401, refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const stored = localStorage.getItem('mahallu-auth');
        if (stored) {
          const { state } = JSON.parse(stored);
          if (state?.tokens?.refreshToken) {
            const { data } = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
              { refreshToken: state.tokens.refreshToken },
            );
            const newTokens = data.data.tokens;

            // Update stored tokens
            const updatedState = { ...state, tokens: newTokens };
            localStorage.setItem('mahallu-auth', JSON.stringify({ state: updatedState }));

            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch {
        // Refresh failed — redirect to login
        localStorage.removeItem('mahallu-auth');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
