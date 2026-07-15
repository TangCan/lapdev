export const PORT = parseInt(Deno.env.get('PORT') || '3333');

export const FRONTEND_PORT = parseInt(Deno.env.get('FRONTEND_PORT') || '5173');

export const ALLOWED_ORIGINS = [
  `http://localhost:${PORT}`,
  `http://localhost:${FRONTEND_PORT}`,
  `http://127.0.0.1:${PORT}`,
  `http://127.0.0.1:${FRONTEND_PORT}`,
  `https://localhost:${PORT}`,
  `https://127.0.0.1:${PORT}`,
];

export const API_TIMEOUT = 30000;

export const WS_HEARTBEAT_INTERVAL = 30000;

export const FILE_WATCHER_INTERVAL = 3000;

export function getWorkspacePath(): string {
  return Deno.env.get('WORKSPACE_PATH') || Deno.cwd();
}

export const WORKSPACE_PATH = getWorkspacePath();

export const TLS_ENABLED = Deno.env.get('TLS_ENABLED') === 'true';

export const TLS_CERT_PATH = Deno.env.get('TLS_CERT_PATH') || './backend/cert/cert.pem';

export const TLS_KEY_PATH = Deno.env.get('TLS_KEY_PATH') || './backend/cert/key.pem';
