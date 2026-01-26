/**
 * Centralized API configuration
 * All backend URLs should come from environment variables
 */

// Backend HTTP URL
export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

// Backend WebSocket URL
export const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000";

// Frontend URL
export const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || "http://localhost:3000";

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
