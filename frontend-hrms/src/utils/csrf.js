export function getCsrfToken() {
  const match = document.cookie.match(new RegExp('(^| )csrfToken=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// axios instance helper that attaches CSRF token header when available
import axios from 'axios';
export const apiClient = axios.create();
apiClient.interceptors.request.use(config => {
  const token = getCsrfToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers['X-CSRF-Token'] = token;
  }
  return config;
});
