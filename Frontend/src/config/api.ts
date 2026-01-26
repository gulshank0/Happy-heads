/**
 * Centralized API configuration
 * All backend URLs should come from environment variables
 */

// Backend HTTP URL
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Backend WebSocket URL
export const WS_URL = import.meta.env.VITE_WS_URL;

// Frontend URL
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL;

// Validate required environment variables
if (!BACKEND_URL) {
  console.error("VITE_BACKEND_URL is not set in environment variables");
}
if (!WS_URL) {
  console.error("VITE_WS_URL is not set in environment variables");
}
if (!FRONTEND_URL) {
  console.error("VITE_FRONTEND_URL is not set in environment variables");
}

// Helper to construct API endpoints
export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_URL}${cleanPath}`;
};

// Default export for convenience
export default {
  BACKEND_URL,
  WS_URL,
  FRONTEND_URL,
  getApiUrl,
};
