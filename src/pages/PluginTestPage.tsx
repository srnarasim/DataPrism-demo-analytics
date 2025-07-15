/**
 * Plugin Test Page
 * 
 * Dedicated page for testing the plugin system implementation
 * Can be added to the navigation for easy access during development
 */

import React, { useState, useEffect } from 'react';
import { useDataPrism } from '../contexts/DataPrismContext';
import { AnalyticsPluginManager } from '../plugins/AnalyticsPluginManager';
import { verifyPluginInterfaces } from '../utils/pluginInterfaceVerification';
import TestRunner from '../tests/TestRunner';
import PluginSystemTest from '../tests/PluginSystemTest';

export const PluginTestPage: React.FC = () => {
  const { 
    isInitialized, 
    pluginSystemAvailable, 
    pluginInterfaces,
    pluginManager,
    engine 
  } = useDataPrism();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'quick-test' | 'detailed-test'>('overview');
  const [pluginManagerInstance, setPluginManagerInstance] = useState<AnalyticsPluginManager | null>(null);
  const [managerStatus, setManagerStatus] = useState<any>(null);

  useEffect(() => {
    if (isInitialized && pluginSystemAvailable && !pluginManagerInstance) {
      const initManager = async () => {
        try {
          const manager = new AnalyticsPluginManager({ engine });
          await manager.initialize();
          setPluginManagerInstance(manager);
          setManagerStatus(manager.getStatus());
        } catch (error) {
          console.error('Failed to initialize plugin manager:', error);
        }
      };
      
      initManager();
    }
  }, [isInitialized, pluginSystemAvailable, engine]);

  const refreshManagerStatus = () => {
    if (pluginManagerInstance) {
      setManagerStatus(pluginManagerInstance.getStatus());
    }
  };

  const tabStyle = (tabName: string) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    backgroundColor: activeTab === tabName ? '#007bff' : '#f8f9fa',
    color: activeTab === tabName ? 'white' : 'black',
    border: '1px solid #ddd',
    borderBottom: activeTab === tabName ? '1px solid #007bff' : '1px solid #ddd'
  });

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔬 Plugin System Test Center</h1>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <div 
          style={tabStyle('overview')}
          onClick={() => setActiveTab('overview')}
        >
          📋 Overview
        </div>
        <div 
          style={tabStyle('quick-test')}
          onClick={() => setActiveTab('quick-test')}
        >
          🧪 Quick Test
        </div>
        <div 
          style={tabStyle('detailed-test')}
          onClick={() => setActiveTab('detailed-test')}
        >
          🔍 Detailed Test
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <h2>System Overview</h2>
          
          {/* DataPrism Status */}
          <div style={{ marginBottom: '20px' }}>
            <h3>DataPrism Engine Status</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #ddd' }}>
                <strong>Engine Initialization:</strong>
                <div style={{ marginTop: '5px', color: isInitialized ? 'green' : 'red' }}>
                  {isInitialized ? '✅ Initialized' : '❌ Not Initialized'}
                </div>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #ddd' }}>
                <strong>Plugin System:</strong>
                <div style={{ marginTop: '5px', color: pluginSystemAvailable ? 'green' : 'red' }}>
                  {pluginSystemAvailable ? '✅ Available' : '❌ Not Available'}
                </div>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #ddd' }}>
                <strong>Plugin Interfaces:</strong>
                <div style={{ marginTop: '5px', color: pluginInterfaces ? 'green' : 'red' }}>
                  {pluginInterfaces ? '✅ Loaded' : '❌ Not Loaded'}
                </div>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #ddd' }}>
                <strong>Plugin Manager:</strong>
                <div style={{ marginTop: '5px', color: pluginManager ? 'green' : 'red' }}>
                  {pluginManager ? '✅ Active' : '❌ Not Active'}
                </div>
              </div>
            </div>
          </div>

          {/* Plugin Interface Verification */}
          <div style={{ marginBottom: '20px' }}>
            <h3>Plugin Interface Verification</h3>
            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #ddd' }}>
              {(() => {
                const verification = verifyPluginInterfaces();
                return (
                  <div>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>Status:</strong> {verification.available ? '✅ Available' : '❌ Not Available'}
                      {verification.error && <span style={{ color: 'red', marginLeft: '10px' }}>({verification.error})</span>}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      <div>
                        <strong>Interfaces:</strong>
                        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                          {Object.entries(verification.interfaces).map(([name, available]) => (
                            <li key={name} style={{ color: available ? 'green' : 'red' }}>
                              {available ? '✅' : '❌'} {name}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <strong>Managers:</strong>
                        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                          {Object.entries(verification.managers).map(([name, available]) => (
                            <li key={name} style={{ color: available ? 'green' : 'red' }}>
                              {available ? '✅' : '❌'} {name}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <strong>Utilities:</strong>
                        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                          {Object.entries(verification.utilities).map(([name, available]) => (
                            <li key={name} style={{ color: available ? 'green' : 'red' }}>
                              {available ? '✅' : '❌'} {name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Plugin Manager Status */}
          {managerStatus && (
            <div style={{ marginBottom: '20px' }}>
              <h3>Analytics Plugin Manager Status</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span></span>
                <button 
                  onClick={refreshManagerStatus}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🔄 Refresh Status
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #ddd' }}>
                  <strong>Initialized:</strong>
                  <div style={{ marginTop: '5px', color: managerStatus.initialized ? 'green' : 'red' }}>
                    {managerStatus.initialized ? '✅ Yes' : '❌ No'}
                  </div>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #ddd' }}>
                  <strong>Registered Plugins:</strong>
                  <div style={{ marginTop: '5px', color: 'blue' }}>
                    📦 {managerStatus.registeredPlugins}
                  </div>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #ddd' }}>
                  <strong>Active Plugins:</strong>
                  <div style={{ marginTop: '5px', color: 'green' }}>
                    ⚡ {managerStatus.activePlugins}
                  </div>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #ddd' }}>
                  <strong>Plugin Types:</strong>
                  <div style={{ marginTop: '5px', fontSize: '12px' }}>
                    {Object.entries(managerStatus.pluginTypes).map(([type, count]) => (
                      <div key={type}>{type}: {String(count)}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div style={{ marginTop: '30px' }}>
            <h3>Testing Instructions</h3>
            <div style={{ padding: '15px', backgroundColor: '#e9ecef', borderRadius: '5px', border: '1px solid #ddd' }}>
              <ol>
                <li><strong>Quick Test:</strong> Run basic functionality tests to verify core components work</li>
                <li><strong>Detailed Test:</strong> Run comprehensive integration tests covering all plugin types</li>
                <li><strong>Manual Testing:</strong> Use the Data Explorer and Query Lab to test plugin functionality</li>
              </ol>
              
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '3px' }}>
                <strong>⚠️ Note:</strong> If plugin interfaces are not available, the tests will use fallback implementations. 
                For full functionality, ensure DataPrism plugin interfaces are exposed via CDN.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Test Tab */}
      {activeTab === 'quick-test' && (
        <div>
          <h2>Quick Test Suite</h2>
          <p>Run basic tests to verify core plugin system functionality.</p>
          <TestRunner />
        </div>
      )}

      {/* Detailed Test Tab */}
      {activeTab === 'detailed-test' && (
        <div>
          <h2>Detailed Test Suite</h2>
          <p>Comprehensive integration tests covering all plugin types and workflows.</p>
          <PluginSystemTest />
        </div>
      )}
    </div>
  );
};

export default PluginTestPage;