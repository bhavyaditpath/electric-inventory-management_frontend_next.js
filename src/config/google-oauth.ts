// Google OAuth Configuration
import '../types/google-oauth.types';
export const GOOGLE_OAUTH_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/google/callback` : '',
  scope: 'openid email profile',
  responseType: 'code',
  prompt: 'select_account',
};

// Google Identity Services script URL
export const GOOGLE_GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

// Load Google Identity Services script
export const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Cannot load Google script on server side'));
      return;
    }

    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_GIS_SCRIPT_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
    document.head.appendChild(script);
  });
};

// Initialize Google OAuth client
export const initializeGoogleOAuth = () => {
  if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services not loaded');
  }

  if (!GOOGLE_OAUTH_CONFIG.clientId) {
    throw new Error('Google Client ID not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.');
  }

  return window.google.accounts.oauth2.initCodeClient({
    client_id: GOOGLE_OAUTH_CONFIG.clientId,
    scope: GOOGLE_OAUTH_CONFIG.scope,
    ux_mode: 'redirect',
    redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
    state: 'google-oauth-state',
  });
};