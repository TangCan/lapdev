export const TEST_CONFIG = {
  BASE_URL: process.env.BASE_URL || 'http://localhost:3333',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3333',
  VITE_API_URL: process.env.VITE_API_URL || 'http://localhost:3333',
  WS_URL: (process.env.BASE_URL || 'http://localhost:3333').replace('http://', 'ws://').replace('https://', 'wss://'),
  
  TIMEOUTS: {
    DEFAULT: 30000,
    LONG: 60000,
    SHORT: 5000,
  },
  
  PORTS: {
    BACKEND: parseInt(process.env.TEST_BACKEND_PORT || '3333'),
    FRONTEND: parseInt(process.env.TEST_FRONTEND_PORT || '5173'),
  },
} as const;

export const {
  BASE_URL,
  API_BASE_URL,
  VITE_API_URL,
  WS_URL,
  TIMEOUTS,
  PORTS,
} = TEST_CONFIG;
