export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Demo/dev mode uses explicit seller id until auth is implemented in backend.
export const DEFAULT_SELLER_ID = Number(import.meta.env.VITE_SELLER_ID || 1);
