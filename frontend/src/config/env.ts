/**
 * Centralized environment configuration for the Frontend
 * All environment-dependent URLs should be imported from here
 * This ensures deployment to Vercel/AWS works correctly
 * 
 * IMPORTANT: In production, you MUST set these environment variables:
 *   - VITE_BACKEND_URL: Your AWS backend URL (e.g., https://api.yourapp.com)
 *   - VITE_WS_URL: Your AWS WebSocket URL (e.g., wss://api.yourapp.com)
 */

// Development mode check
export const isDevelopment = import.meta.env.DEV;

// Production mode check  
export const isProduction = import.meta.env.PROD;

// Backend API URL - required in production, optional in development
export const BACKEND_URL: string = (() => {
  const url = import.meta.env.VITE_BACKEND_URL;
  if (url) return url;
  
  if (isProduction) {
    throw new Error(
      'VITE_BACKEND_URL environment variable is required in production. ' +
      'Please set it in your Vercel environment settings to your AWS backend URL.'
    );
  }
  
  // Development fallback - warn but allow
  console.warn('⚠️ VITE_BACKEND_URL not set. Using hosted backend.');
  return 'https://backend-happy-heads.onrender.com';
})();

// WebSocket URL - required in production, optional in development  
export const WS_URL: string = (() => {
  const url = import.meta.env.VITE_WS_URL;
  if (url) return url;
  
  if (isProduction) {
    throw new Error(
      'VITE_WS_URL environment variable is required in production. ' +
      'Please set it in your Vercel environment settings to your AWS WebSocket URL.'
    );
  }
  
  // Development fallback - warn but allow
  console.warn('⚠️ VITE_WS_URL not set. Using hosted backend.');
  return 'wss://backend-happy-heads.onrender.com';
})();

// Helper to check if environment is configured properly
export const isEnvConfigured = (): boolean => {
  return Boolean(import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_WS_URL);
};

// Get API URL - convenience wrapper
export const getApiUrl = (path: string = ''): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_URL}${cleanPath}`;
};

// Get WebSocket URL - convenience wrapper
export const getWsUrl = (path: string = ''): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${WS_URL}${cleanPath}`;
};

export default {
  BACKEND_URL,
  WS_URL,
  isDevelopment,
  isProduction,
  isEnvConfigured,
  getApiUrl,
  getWsUrl,
};
