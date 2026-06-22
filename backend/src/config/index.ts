export const PORT = parseInt(Deno.env.get('PORT') || '3333');

export const FRONTEND_PORT = parseInt(Deno.env.get('FRONTEND_PORT') || '5173');

export const ALLOWED_ORIGINS = [
  `http://localhost:${PORT}`,
  `http://localhost:${FRONTEND_PORT}`,
  `http://127.0.0.1:${PORT}`,
  `http://127.0.0.1:${FRONTEND_PORT}`,
];

export const API_TIMEOUT = 30000;

export const WS_HEARTBEAT_INTERVAL = 30000;

export const FILE_WATCHER_INTERVAL = 3000;
