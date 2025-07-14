/**
 * Entry point for DataPrism Demo Analytics
 * Standalone application that consumes DataPrism via CDN
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Initialize application
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);