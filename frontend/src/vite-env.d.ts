/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_PORT: string;
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_PORT: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_WS_TIMEOUT: string;
  readonly VITE_FILE_TREE_REFRESH_INTERVAL: string;
  readonly VITE_PAGE_LOAD_TIMEOUT: string;
  readonly VITE_HEARTBEAT_INTERVAL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
