
// Token management
export const tokenManager = {
  // Legacy method for backward compatibility
  setToken: (token: string) => {
    localStorage.setItem('token', token);
  },

  getToken: () => {
    return localStorage.getItem('token') || localStorage.getItem('access_token');
  },

  removeToken: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  // OAuth specific methods
  setAccessToken: (token: string) => {
    localStorage.setItem('access_token', token);
  },

  getAccessToken: () => {
    return localStorage.getItem('access_token') || localStorage.getItem('token');
  },

  setRefreshToken: (token: string) => {
    localStorage.setItem('refresh_token', token);
  },

  getRefreshToken: () => {
    return localStorage.getItem('refresh_token');
  },

  isAuthenticated: () => {
    return !!(tokenManager.getAccessToken() || tokenManager.getToken());
  },

  decodeToken: (token: string) => {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      return decodedPayload;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  },

  getUserRole: () => {
    const token = tokenManager.getAccessToken() || tokenManager.getToken();
    if (!token) return null;

    const decoded = tokenManager.decodeToken(token);
    return decoded?.role || null;
  },

  getTokenExpiry: () => {
    const token = tokenManager.getAccessToken() || tokenManager.getToken();
    if (!token) return null;

    const decoded = tokenManager.decodeToken(token);
    return decoded?.exp ? new Date(decoded.exp * 1000) : null;
  },

  isTokenExpired: () => {
    const expiry = tokenManager.getTokenExpiry();
    if (!expiry) return true;
    return new Date() > expiry;
  },
};