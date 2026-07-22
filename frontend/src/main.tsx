import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App';
import { ThemeProvider } from './theme/ThemeContext';
import { performanceService } from './services/performanceService';

window.addEventListener('error', (e) => {
  console.error('[Global Error]', e.error, e.message, e.filename, e.lineno);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[Global Unhandled Rejection]', e.reason);
});

console.log('[App] Starting...');
performanceService.start();

const IDE = lazy(() => import('./components/IDE/IDE'));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(({ SettingsPage }) => ({ default: SettingsPage })));
const Providers = lazy(() => import('./context/Providers'));

const Loading: React.FC = () => (
  <div className="loading-app">
    <div className="loading-spinner"></div>
    <p>Loading Lapdev...</p>
  </div>
);

const router = createBrowserRouter(
  [
    {
      element: (
        <Suspense fallback={<Loading />}>
          <Providers>
            <App />
          </Providers>
        </Suspense>
      ),
      children: [
        { 
          path: '/', 
          element: (
            <Suspense fallback={<Loading />}>
              <IDE />
            </Suspense>
          ) 
        },
        { 
          path: '/settings', 
          element: (
            <Suspense fallback={<Loading />}>
              <SettingsPage />
            </Suspense>
          ) 
        },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
);

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <RouterProvider router={router} />
  </ThemeProvider>
);