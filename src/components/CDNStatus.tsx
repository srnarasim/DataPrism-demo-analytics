/**
 * CDN Status Component
 * Displays real-time CDN status and DataPrism loading information
 */

import React from 'react';
import { useDataPrism } from '@/contexts/DataPrismContext';

export const CDNStatus: React.FC = () => {
  const { 
    cdnStatus, 
    isInitialized, 
    isInitializing,
    initializationError, 
    cdnInfo,
    retry 
  } = useDataPrism();

  const getStatusColor = () => {
    switch (cdnStatus) {
      case 'loading': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'loaded': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    if (isInitializing) return '🔄';
    switch (cdnStatus) {
      case 'loading': return '⏳';
      case 'loaded': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getStatusText = () => {
    if (isInitializing) return 'Initializing...';
    if (isInitialized && cdnStatus === 'error') return 'Ready (Mock Mode)';
    if (isInitialized) return 'Ready';
    if (initializationError) return 'Failed';
    return 'Loading...';
  };

  return (
    <div className={`flex items-center space-x-3 p-4 border rounded-lg ${getStatusColor()}`}>
      <span className="text-2xl animate-pulse">{getStatusIcon()}</span>
      
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="font-semibold">
            CDN Status: {getStatusText()}
          </span>
          {cdnInfo.version && (
            <span className="text-sm opacity-75">
              v{cdnInfo.version}
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4 mt-1 text-sm opacity-75">
          {cdnInfo.latency && (
            <span>Latency: {cdnInfo.latency}ms</span>
          )}
          {cdnInfo.available !== undefined && (
            <span>Available: {cdnInfo.available ? 'Yes' : 'No'}</span>
          )}
          {isInitialized && (
            <span className="text-green-600 font-medium">
              {cdnStatus === 'error' ? 'Mock Implementation Active' : 'DataPrism Ready (Hybrid Architecture)'}
            </span>
          )}
        </div>
        
        {cdnStatus === 'error' && isInitialized && (
          <div className="mt-2 text-sm">
            <div className="flex items-center space-x-2 text-yellow-600">
              <span>ℹ️</span>
              <span>Using mock implementation - CDN hybrid architecture unavailable (dependency loading issue)</span>
            </div>
          </div>
        )}
        
        {initializationError && !isInitialized && (
          <div className="mt-2">
            <details className="text-sm">
              <summary className="cursor-pointer font-medium">
                Error: {initializationError.message}
              </summary>
              <pre className="mt-1 text-xs opacity-75 overflow-x-auto">
                {initializationError.stack}
              </pre>
            </details>
          </div>
        )}
      </div>
      
      {initializationError && (
        <button
          onClick={retry}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
};