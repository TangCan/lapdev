export const BACKEND_PORT = parseInt(import.meta.env.VITE_BACKEND_PORT || '3333');

export const API_URL = import.meta.env.VITE_API_URL || '/api';

export const WS_URL = import.meta.env.VITE_WS_URL || '/ws';

export const FRONTEND_PORT = parseInt(import.meta.env.VITE_PORT || '5173');

export const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');

export const WS_TIMEOUT = parseInt(import.meta.env.VITE_WS_TIMEOUT || '30000');

export const FILE_TREE_REFRESH_INTERVAL = parseInt(import.meta.env.VITE_FILE_TREE_REFRESH_INTERVAL || '3000');

export const PAGE_LOAD_TIMEOUT = parseInt(import.meta.env.VITE_PAGE_LOAD_TIMEOUT || '3000');

export const HEARTBEAT_INTERVAL = parseInt(import.meta.env.VITE_HEARTBEAT_INTERVAL || '30000');
