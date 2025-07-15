/**
 * Simplified DataPrism Demo Analytics App
 * Core implementation for PRP validation
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataPrismProvider } from '@/contexts/DataPrismContext';
import { HomePage } from '@/pages/HomePage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import './App.css';

function App() {
  // Use base path for production deployment
  const basename = import.meta.env.PROD ? '/DataPrism-demo-analytics' : '/';
  
  return (
    <ErrorBoundary>
      <DataPrismProvider>
        <Router basename={basename}>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<HomePage />} />
            </Routes>
          </div>
        </Router>
      </DataPrismProvider>
    </ErrorBoundary>
  );
}

export default App;