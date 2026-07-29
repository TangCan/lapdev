export type MonacoModule = typeof import('monaco-editor');

let monacoPromise: Promise<MonacoModule> | null = null;
let monacoCache: MonacoModule | null = null;
let environmentInitialized = false;

declare global {
  interface Window {
    MonacoEnvironment?: {
      getWorkerUrl?: (moduleId: string, label: string) => string;
      getWorker?: (moduleId: string, label: string) => Promise<Worker>;
    };
  }
}

function initMonacoEnvironment(): void {
  if (environmentInitialized) return;

  window.MonacoEnvironment = {
    async getWorker(moduleId: string, label: string) {
      switch (label) {
        case 'typescript':
        case 'javascript': {
          const tsWorker = await import('monaco-editor/esm/vs/language/typescript/ts.worker?worker');
          return new tsWorker.default();
        }
        case 'json': {
          const jsonWorker = await import('monaco-editor/esm/vs/language/json/json.worker?worker');
          return new jsonWorker.default();
        }
        case 'html': {
          const htmlWorker = await import('monaco-editor/esm/vs/language/html/html.worker?worker');
          return new htmlWorker.default();
        }
        case 'css': {
          const cssWorker = await import('monaco-editor/esm/vs/language/css/css.worker?worker');
          return new cssWorker.default();
        }
        default: {
          const editorWorker = await import('monaco-editor/esm/vs/editor/editor.worker?worker');
          return new editorWorker.default();
        }
      }
    },
  };

  environmentInitialized = true;
}

export function getMonaco(): Promise<MonacoModule> {
  if (monacoCache) {
    return Promise.resolve(monacoCache);
  }

  if (monacoPromise) {
    return monacoPromise;
  }

  initMonacoEnvironment();

  monacoPromise = import('monaco-editor').then((mod) => {
    monacoCache = mod;
    registerLanguageCallbacksSync(mod);
    return mod;
  }).catch((err) => {
    monacoPromise = null;
    environmentInitialized = false;
    throw err;
  });

  return monacoPromise;
}

export function getMonacoSync(): MonacoModule | null {
  return monacoCache;
}

const LANGUAGE_MODULES: Record<string, () => Promise<unknown>> = {
  typescript: () => import('monaco-editor/esm/vs/language/typescript/monaco.contribution.js'),
  javascript: () => import('monaco-editor/esm/vs/language/typescript/monaco.contribution.js'),
  json: () => import('monaco-editor/esm/vs/language/json/monaco.contribution.js'),
  html: () => import('monaco-editor/esm/vs/language/html/monaco.contribution.js'),
  css: () => import('monaco-editor/esm/vs/language/css/monaco.contribution.js'),
};

const loadedLanguages = new Set<string>();
const failedLanguages = new Set<string>();

export async function loadLanguage(language: string): Promise<void> {
  const normalizedLang = language.toLowerCase();

  if (loadedLanguages.has(normalizedLang)) {
    return;
  }

  if (failedLanguages.has(normalizedLang)) {
    return;
  }

  const loader = LANGUAGE_MODULES[normalizedLang];

  if (loader) {
    try {
      await loader();
      loadedLanguages.add(normalizedLang);
    } catch (error) {
      console.error(`[Monaco] Failed to load language ${normalizedLang}:`, error);
      failedLanguages.add(normalizedLang);
    }
  } else {
    loadedLanguages.add(normalizedLang);
  }
}

export function isLanguageLoaded(language: string): boolean {
  return loadedLanguages.has(language.toLowerCase());
}

function registerLanguageCallbacksSync(mod: MonacoModule): void {
  mod.languages.onLanguage('typescript', () => {
    loadLanguage('typescript');
  });

  mod.languages.onLanguage('javascript', () => {
    loadLanguage('javascript');
  });

  mod.languages.onLanguage('json', () => {
    loadLanguage('json');
  });

  mod.languages.onLanguage('html', () => {
    loadLanguage('html');
  });

  mod.languages.onLanguage('css', () => {
    loadLanguage('css');
  });
}

export function registerLanguageCallbacks(monacoModule: MonacoModule): void {
  registerLanguageCallbacksSync(monacoModule);
}