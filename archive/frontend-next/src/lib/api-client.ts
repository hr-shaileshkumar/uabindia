import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const TENANT_SUBDOMAIN = process.env.NEXT_PUBLIC_TENANT_SUBDOMAIN || '';

const getTenantHeader = () => {
  if (typeof window === 'undefined') return TENANT_SUBDOMAIN || '';
  const hostname = window.location.hostname.toLowerCase();
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (hostname.endsWith('.localhost') && !isLocalhost) {
    return hostname.split('.')[0] || '';
  }

  return isLocalhost ? TENANT_SUBDOMAIN : '';
};

const shouldSendTenantHeader = () => {
  if (typeof window === 'undefined') return true;
  const hostname = window.location.hostname.toLowerCase();
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost');
};

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const headerTenant = getTenantHeader();
    if (headerTenant && config.headers && shouldSendTenantHeader()) {
      config.headers['X-Tenant'] = headerTenant;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
