/**
 * Simplified DataPrism Demo Analytics App
 * Core implementation for PRP validation
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataPrismProvider } from '@/contexts/DataPrismContext';
import { HomePage } from '@/pages/HomePage';
import { DataExplorerPage } from '@/pages/DataExplorerPage';
import { QueryLabPage } from '@/pages/QueryLabPage';
import { VisualizationPage } from '@/pages/VisualizationPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import './App.css';
import { useEffect } from 'react';

function App() {
  // Determine the correct basename for GitHub Pages deployment
  const getBasename = () => {
    if (!import.meta.env.PROD) {
      return '/'; // Development mode
    }
    
    // Production mode - GitHub Pages routing
    const pathname = window.location.pathname;
    
    // Handle GitHub Pages subdirectory routing
    if (pathname === '/' || pathname === '/index.html') {
      return '/';
    }
    
    // Extract the first path segment as the repository name
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      // Check if this is a known route or a repository name
      const knownRoutes = ['data-explorer', 'query-lab', 'visualization'];
      const firstSegment = pathSegments[0];
      
      if (knownRoutes.includes(firstSegment)) {
        // This is a direct route access, no basename needed
        return '/';
      } else {
        // This is likely a repository name (like DataPrism-demo-analytics or data-explorer)
        return `/${firstSegment}`;
      }
    }
    
    // Default fallback
    return '/';
  };
  
  const basename = getBasename();
  
  // Handle SPA redirect from 404.html
  useEffect(() => {
    const spaRedirect = sessionStorage.getItem('spa-redirect');
    if (spaRedirect) {
      sessionStorage.removeItem('spa-redirect');
      // The redirect should already be handled by the router
      console.log('SPA redirect handled:', spaRedirect);
    }
  }, []);
  
  return (
    <ErrorBoundary>
      <DataPrismProvider>
        <Router basename={basename}>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/data-explorer" element={<DataExplorerPage />} />
              <Route path="/query-lab" element={<QueryLabPage />} />
              <Route path="/visualization" element={<VisualizationPage />} />
            </Routes>
          </div>
        </Router>
      </DataPrismProvider>
    </ErrorBoundary>
  );
}

export default App;