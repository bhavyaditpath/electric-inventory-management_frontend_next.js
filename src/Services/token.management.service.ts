
// Token management
export const tokenManager = {
  setToken: (token: string) => {
    localStorage.setItem('token', token);
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  removeToken: () => {
    localStorage.removeItem('token');
  },

  isAuthenticated: () => {
    return !!tokenManager.getToken();
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
    const token = tokenManager.getToken();
    if (!token) return null;

    const decoded = tokenManager.decodeToken(token);
    return decoded?.role || null;
  },
};