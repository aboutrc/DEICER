import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
// Import App component lazily
const App = lazy(() => import('./App'));
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-white text-xl">Loading...</div>
  </div>}>
    <App />
  </Suspense>
);