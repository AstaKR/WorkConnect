import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach JWT ───────────────────────────────────────────────────────
api.interceptors.request.use(
  config => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  error => Promise.reject(error),
);

// ── Response: transparent token refresh on 401 ───────────────────────────────
// Use a single in-flight promise so concurrent 401s don't all try to refresh.
let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      if (!refreshToken) {
        logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post('/api/auth/token/refresh/', { refresh: refreshToken })
            .then(res => {
              // SimpleJWT with ROTATE_REFRESH_TOKENS returns a new refresh too
              setTokens(res.data.access, res.data.refresh ?? refreshToken);
              return res.data.access;
            })
            .finally(() => { refreshPromise = null; });
        }

        const newAccess = await refreshPromise;
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch {
        logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
