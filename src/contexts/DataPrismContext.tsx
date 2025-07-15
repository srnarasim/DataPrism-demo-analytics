/**
 * CDN-Based DataPrism Context
 * Loads DataPrism from CDN and provides React context for demo application
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { CDNAssetLoader } from '@/utils/cdnLoader';
import { getCDNConfig } from '@/config/cdn';
import { arrowLoader } from '@/utils/arrowLoader';

interface DataPrismContextValue {
  engine: any | null;
  isInitialized: boolean;
  isInitializing: boolean;
  initializationError: Error | null;
  cdnStatus: 'loading' | 'loaded' | 'error';
  cdnInfo: {
    version?: string;
    latency?: number;
    available?: boolean;
  };
  
  // Core operations
  query: (sql: string) => Promise<any>;
  loadData: (data: any[], tableName?: string) => Promise<void>;
  getTableInfo: (tableName: string) => Promise<any>;
  listTables: () => Promise<string[]>;
  
  // Performance monitoring
  getPerformanceMetrics: () => Promise<any>;
  
  // Utilities
  retry: () => Promise<void>;
  getCDNStatus: () => Promise<any>;
}

const DataPrismContext = createContext<DataPrismContextValue | null>(null);

export const DataPrismProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [engine, setEngine] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<Error | null>(null);
  const [cdnStatus, setCdnStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [cdnInfo, setCdnInfo] = useState<{
    version?: string;
    latency?: number;
    available?: boolean;
  }>({});

  const initializeDataPrism = useCallback(async () => {
    if (isInitializing || isInitialized) return;
    
    setIsInitializing(true);
    setInitializationError(null);
    setCdnStatus('loading');

    try {
      console.log('🚀 Initializing DataPrism from CDN...');
      
      const cdnConfig = getCDNConfig();
      const loader = new CDNAssetLoader(cdnConfig);
      
      // Get CDN status for monitoring
      const status = await loader.getCDNStatus();
      setCdnInfo({
        version: status.version,
        latency: status.latency,
        available: status.available
      });

      if (!status.available) {
        throw new Error(`CDN not available: ${status.error}`);
      }

      // Preload assets for better performance
      await loader.preloadAssets();
      
      // Preload Apache Arrow locally before DataPrism initialization
      console.log('📦 Preloading Apache Arrow dependencies...');
      await arrowLoader.ensureArrowLoaded();
      console.log('✅ Apache Arrow preloaded successfully');
      
      // Try to load DataPrism from CDN with fallback to mock implementation
      let engineInstance;
      try {
        // Load DataPrism from CDN
        const DataPrism = await loader.loadCoreBundle();
        setCdnStatus('loaded');
        
        // Initialize engine with enhanced dependency management configuration
        engineInstance = new DataPrism.DataPrismEngine({
          maxMemoryMB: 512,
          enableWasmOptimizations: true,
          logLevel: import.meta.env.DEV ? 'debug' : 'info',
          // Enhanced dependency management options from issue #17
          dependencyManagement: {
            enabled: true,
            timeout: 30000,
            retries: 5,
            progressTracking: true,
            preloadDependencies: true
          }
        });
        
        await engineInstance.initialize();
        
        console.log('⏳ DataPrism core initialized, now checking enhanced dependency management... [v4]');
        
        try {
          // Verify local Arrow is still available
          if (!arrowLoader.isArrowReady()) {
            console.log('⚠️ Local Apache Arrow not ready, reloading...');
            await arrowLoader.ensureArrowLoaded();
          }
          
          // Use enhanced dependency management from issue #17 resolution
          if (typeof engineInstance.waitForReady === 'function') {
            console.log('🔄 Using enhanced dependency readiness checking with local Arrow...');
            
            try {
              await engineInstance.waitForReady({
                timeout: 30000,
                retries: 5,
                onProgress: (progress: any) => {
                  console.log(`📊 Loading progress: ${progress.percentage}% - ${progress.status}`);
                }
              });
              console.log('✅ Enhanced dependency management confirmed all dependencies loaded');
            } catch (enhancedError) {
              console.warn('⚠️ Enhanced dependency management failed, but local Arrow is available. Testing direct query...', enhancedError);
              
              // Since we have local Arrow, test if DataPrism can work with it
              const testResult = await engineInstance.query('SELECT 1 as arrow_test');
              if (testResult && !testResult.error) {
                console.log('✅ DataPrism working with local Apache Arrow despite enhanced dependency management failure');
              } else {
                console.warn('⚠️ DataPrism still not working with local Arrow, trying manual resolution...', testResult.error);
                await resolveApacheArrowDependency(engineInstance);
              }
            }
          } else {
            console.log('⚠️ Enhanced dependency management not available, testing with local Arrow...');
            
            // Test if DataPrism works with local Arrow
            const testResult = await engineInstance.query('SELECT 1 as arrow_test');
            if (testResult && testResult.error) {
              console.warn('⚠️ DataPrism not working with local Arrow, trying manual resolution...', testResult.error);
              await waitForArrowDependency(engineInstance);
            } else {
              console.log('✅ DataPrism working with local Apache Arrow');
            }
          }
          
          console.log(`✅ DataPrism initialized from CDN with hybrid architecture (v${status.version}, ${status.latency}ms)`);
          console.log('🎯 Active features: Fast CDN loading, reliable DuckDB access, universal compatibility, local Apache Arrow');
        } catch (arrowError) {
          console.error('❌ Enhanced dependency loading failed:', arrowError);
          throw arrowError;
        }
      } catch (cdnError) {
        const errorMessage = cdnError instanceof Error ? cdnError.message : String(cdnError);
        
        // Enhanced error handling with more contextual error messages (issue #17)
        if (errorMessage.includes('selectBundle') || errorMessage.includes('DuckDB')) {
          console.warn('⚠️ CDN DataPrism DuckDB initialization failed, using mock implementation...', {
            error: errorMessage,
            context: 'DuckDB WebAssembly module failed to load',
            suggestion: 'Check network connectivity and CORS settings',
            fallbackActive: true
          });
        } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
          console.warn('⚠️ CDN DataPrism network timeout, using mock implementation...', {
            error: errorMessage,
            context: 'Network timeout during hybrid architecture loading',
            suggestion: 'Increase timeout or check network stability',
            fallbackActive: true
          });
        } else if (errorMessage.includes('connection') || errorMessage.includes('from')) {
          console.warn('⚠️ CDN DataPrism connection not ready, using mock implementation...', {
            error: errorMessage,
            context: 'DuckDB connection initialization failed',
            suggestion: 'Enhanced dependency management should resolve this automatically',
            fallbackActive: true
          });
        } else if (errorMessage.includes('RecordBatchReader') || errorMessage.includes('Arrow')) {
          console.warn('⚠️ CDN DataPrism Apache Arrow dependency issue, using mock implementation...', {
            error: errorMessage,
            context: 'Apache Arrow libraries not ready (should be resolved with enhanced dependency management)',
            suggestion: 'This should be automatically handled by the new waitForReady() method',
            fallbackActive: true
          });
        } else if (errorMessage.includes('waitForReady') || errorMessage.includes('dependency')) {
          console.warn('⚠️ CDN DataPrism enhanced dependency management failed, using mock implementation...', {
            error: errorMessage,
            context: 'Enhanced dependency management from issue #17 not working as expected',
            suggestion: 'Check if DataPrism CDN has been updated with latest dependency management features',
            fallbackActive: true
          });
        } else {
          console.warn('⚠️ CDN DataPrism initialization failed, using mock implementation...', {
            error: errorMessage,
            context: 'Unknown initialization error',
            suggestion: 'Check console for more details and network connectivity',
            fallbackActive: true
          });
        }
        setCdnStatus('error');
        
        // Use mock implementation as fallback
        const { MockDataPrismEngine } = await import('./MockDataPrismContext');
        engineInstance = new MockDataPrismEngine({
          maxMemoryMB: 512,
          enableWasmOptimizations: true,
          logLevel: import.meta.env.DEV ? 'debug' : 'info',
        });
        
        await engineInstance.initialize();
        console.log('✅ DataPrism initialized with mock implementation (CDN fallback active)');
      }
      
      setEngine(engineInstance);
      setIsInitialized(true);

      // Load sample datasets for demo
      await loadSampleData(engineInstance);
    } catch (error) {
      console.error('❌ Failed to initialize DataPrism from CDN:', error);
      setInitializationError(error as Error);
      setCdnStatus('error');
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, isInitialized]);

  const resolveApacheArrowDependency = async (engineInstance: any) => {
    console.log('🔧 Starting manual Apache Arrow dependency resolution...');
    
    try {
      // First, check if DataPrism has a manual dependency registration method
      if (typeof engineInstance.registerDependency === 'function') {
        console.log('🔄 Attempting to use DataPrism manual dependency registration...');
        
        try {
          await engineInstance.registerDependency('apache-arrow', {
            url: 'https://unpkg.com/apache-arrow@17.0.0/dist/Arrow.dom.min.js',
            timeout: 15000,
            retries: 3
          });
          console.log('✅ DataPrism manual dependency registration succeeded');
          return;
        } catch (regError) {
          console.warn('⚠️ DataPrism manual dependency registration failed, trying direct loading...', regError);
        }
      }
      
      // Fallback to direct loading with COEP-compatible approach
      console.log('🔄 Attempting direct Apache Arrow loading...');
      
      // Create a proxy approach that works with COEP restrictions
      const loadArrowViaProxy = async () => {
        try {
          // Use fetch to load the script content (this might work better with COEP)
          const response = await fetch('https://unpkg.com/apache-arrow@17.0.0/dist/Arrow.dom.min.js', {
            mode: 'cors',
            cache: 'force-cache'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const scriptContent = await response.text();
          
          // Execute the script content
          const script = document.createElement('script');
          script.textContent = scriptContent;
          document.head.appendChild(script);
          
          // Wait for initialization
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (typeof (window as any).Arrow !== 'undefined') {
            console.log('✅ Apache Arrow loaded via proxy method');
            return true;
          }
          
          throw new Error('Arrow not available after proxy loading');
        } catch (error) {
          console.warn('⚠️ Proxy loading failed:', error);
          return false;
        }
      };
      
      // Try proxy loading first
      const proxySuccess = await loadArrowViaProxy();
      
      if (!proxySuccess) {
        console.log('🔄 Proxy loading failed, trying alternative approach...');
        
        // Try to trigger DataPrism's internal dependency loading
        if (typeof engineInstance.reloadDependencies === 'function') {
          console.log('🔄 Triggering DataPrism internal dependency reload...');
          await engineInstance.reloadDependencies(['apache-arrow']);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // Final test
        const testResult = await engineInstance.query('SELECT 1 as arrow_test');
        if (testResult && testResult.error) {
          throw new Error(`Arrow dependency still not working: ${testResult.error.message}`);
        }
      }
      
      console.log('✅ Manual Apache Arrow dependency resolution completed successfully');
      
    } catch (error) {
      console.error('❌ Manual Apache Arrow dependency resolution failed:', error);
      throw error;
    }
  };

  const waitForArrowDependency = async (engineInstance: any) => {
    console.log('🔍 Starting Apache Arrow dependency verification... [v2]');
    const maxRetries = 5;
    const baseDelay = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Checking Arrow dependency (attempt ${attempt}/${maxRetries})...`);
        
        // Test with a simple query to verify Arrow is working
        const testResult = await engineInstance.query('SELECT 1 as arrow_test');
        
        console.log('📊 Query result structure:', testResult);
        
        // Check if the query result contains an error
        if (testResult && testResult.error) {
          console.warn('⚠️ Query returned with error:', testResult.error);
          throw new Error(testResult.error.message || 'Query returned error');
        }
        
        // Check if query succeeded and has data
        if (testResult && testResult.data && testResult.data.length >= 0) {
          console.log('✅ Apache Arrow dependency confirmed working');
          return;
        } else {
          console.warn('⚠️ Query succeeded but returned no data structure');
          throw new Error('Query returned no data');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`💥 Error during Arrow test (attempt ${attempt}):`, error);
        
        if (errorMessage.includes('RecordBatchReader') || errorMessage.includes('Arrow')) {
          console.warn(`⚠️ Arrow dependency not ready (attempt ${attempt}/${maxRetries}):`, errorMessage);
          
          if (attempt < maxRetries) {
            // Exponential backoff: 1s, 2s, 4s, 8s, 16s
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.error('❌ Arrow dependency failed to load after all retries');
            throw new Error('Apache Arrow dependency failed to load after multiple attempts');
          }
        } else {
          // Different error, might be more serious
          console.error('❌ Non-Arrow error during dependency check:', error);
          throw error;
        }
      }
    }
  };

  const safeQuery = async (engineInstance: any, sql: string, description: string = 'query') => {
    const maxRetries = 3;
    const baseDelay = 500; // 0.5 seconds
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await engineInstance.query(sql);
        
        // Check if result contains an error
        if (result && result.error) {
          const errorMessage = result.error.message || String(result.error);
          
          if (errorMessage.includes('RecordBatchReader') || errorMessage.includes('Arrow')) {
            console.warn(`⚠️ Arrow issue during ${description} (attempt ${attempt}/${maxRetries}):`, errorMessage);
            
            if (attempt < maxRetries) {
              const delay = baseDelay * Math.pow(2, attempt - 1);
              console.log(`⏳ Retrying ${description} in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            } else {
              throw new Error(errorMessage);
            }
          } else {
            throw new Error(errorMessage);
          }
        }
        
        // Return successful result
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('RecordBatchReader') || errorMessage.includes('Arrow')) {
          console.warn(`⚠️ Arrow issue during ${description} (attempt ${attempt}/${maxRetries}):`, errorMessage);
          
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`⏳ Retrying ${description} in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }
  };

  const loadSampleData = async (engineInstance: any) => {
    try {
      console.log('📊 Loading sample datasets...');
      
      // Verify engine is ready for data loading with safe query
      const testResult = await safeQuery(engineInstance, 'SELECT 1 as ready', 'readiness check');
      if (!testResult || !testResult.data) {
        throw new Error('Engine not ready for data loading');
      }
      
      // Sample sales data
      const salesData = generateSalesData(1000);
      await engineInstance.loadData(salesData, 'sales');
      console.log('📊 Loaded sample sales data (1000 records)');

      // Sample user analytics data
      const analyticsData = generateAnalyticsData(5000);
      await engineInstance.loadData(analyticsData, 'analytics');
      console.log('📈 Loaded sample analytics data (5000 records)');

      // Sample product data
      const productData = generateProductData(200);
      await engineInstance.loadData(productData, 'products');
      console.log('🛍️ Loaded sample product data (200 records)');
      
      // Verify data was loaded successfully
      try {
        const tableList = await engineInstance.listTables();
        console.log('✅ Sample data loading completed. Available tables:', tableList);
      } catch (error) {
        console.warn('⚠️ Could not verify table list, but data loading likely succeeded');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load sample data:', error);
      // Don't throw - this is not critical for demo functionality
    }
  };

  useEffect(() => {
    initializeDataPrism();
  }, [initializeDataPrism]);

  // Context methods
  const query = useCallback(
    async (sql: string) => {
      if (!engine) {
        throw new Error('DataPrism engine not initialized');
      }
      return await safeQuery(engine, sql, 'user query');
    },
    [engine],
  );

  const loadData = useCallback(
    async (data: any[], tableName = 'user_data') => {
      if (!engine) {
        throw new Error('DataPrism engine not initialized');
      }
      return await engine.loadData(data, tableName);
    },
    [engine],
  );

  const getTableInfo = useCallback(
    async (tableName: string) => {
      if (!engine) {
        throw new Error('DataPrism engine not initialized');
      }
      return await engine.getTableInfo(tableName);
    },
    [engine],
  );

  const listTables = useCallback(async () => {
    if (!engine) {
      throw new Error('DataPrism engine not initialized');
    }
    // Use safe query for table listing
    try {
      return await engine.listTables();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('RecordBatchReader') || errorMessage.includes('Arrow')) {
        console.warn('⚠️ Arrow issue during table listing, using fallback...');
        // Try a simpler approach
        const result = await safeQuery(engine, "SELECT name FROM sqlite_master WHERE type='table'", 'table listing');
        return result?.data?.map((row: any) => row.name) || [];
      }
      throw error;
    }
  }, [engine]);

  const getPerformanceMetrics = useCallback(async () => {
    if (!engine) {
      throw new Error('DataPrism engine not initialized');
    }
    return engine.getMetrics();
  }, [engine]);

  const retry = useCallback(async () => {
    setIsInitialized(false);
    setEngine(null);
    setInitializationError(null);
    await initializeDataPrism();
  }, [initializeDataPrism]);

  const getCDNStatus = useCallback(async () => {
    const cdnConfig = getCDNConfig();
    const loader = new CDNAssetLoader(cdnConfig);
    return await loader.getCDNStatus();
  }, []);

  const value: DataPrismContextValue = {
    engine,
    isInitialized,
    isInitializing,
    initializationError,
    cdnStatus,
    cdnInfo,
    query,
    loadData,
    getTableInfo,
    listTables,
    getPerformanceMetrics,
    retry,
    getCDNStatus
  };

  return (
    <DataPrismContext.Provider value={value}>
      {children}
    </DataPrismContext.Provider>
  );
};

export const useDataPrism = () => {
  const context = useContext(DataPrismContext);
  if (!context) {
    throw new Error('useDataPrism must be used within a DataPrismProvider');
  }
  return context;
};

// Sample data generators (same as original but kept for standalone operation)
function generateSalesData(count: number) {
  const regions = ['North', 'South', 'East', 'West'];
  const products = ['Widget A', 'Widget B', 'Gadget X', 'Gadget Y', 'Tool Z'];
  const salespeople = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    date: new Date(
      2023,
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1,
    )
      .toISOString()
      .split('T')[0],
    region: regions[Math.floor(Math.random() * regions.length)],
    product: products[Math.floor(Math.random() * products.length)],
    salesperson: salespeople[Math.floor(Math.random() * salespeople.length)],
    quantity: Math.floor(Math.random() * 100) + 1,
    unit_price: Math.round((Math.random() * 1000 + 50) * 100) / 100,
    total: 0, // Will be calculated
  })).map((row) => ({
    ...row,
    total: Math.round(row.quantity * row.unit_price * 100) / 100,
  }));
}

function generateAnalyticsData(count: number) {
  const sources = [
    'google',
    'facebook',
    'twitter',
    'linkedin',
    'direct',
    'email',
  ];
  const pages = ['/', '/products', '/about', '/contact', '/blog', '/pricing'];
  const devices = ['desktop', 'mobile', 'tablet'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    timestamp: new Date(
      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    user_id: `user_${Math.floor(Math.random() * 1000) + 1}`,
    session_id: `session_${Math.floor(Math.random() * 2000) + 1}`,
    source: sources[Math.floor(Math.random() * sources.length)],
    page: pages[Math.floor(Math.random() * pages.length)],
    device: devices[Math.floor(Math.random() * devices.length)],
    duration: Math.floor(Math.random() * 600) + 10, // 10 seconds to 10 minutes
    bounce: Math.random() < 0.4,
    conversion: Math.random() < 0.1,
  }));
}

function generateProductData(count: number) {
  const categories = [
    'Electronics',
    'Clothing',
    'Books',
    'Home & Garden',
    'Sports',
    'Toys',
  ];
  const brands = ['BrandA', 'BrandB', 'BrandC', 'BrandD', 'BrandE'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    category: categories[Math.floor(Math.random() * categories.length)],
    brand: brands[Math.floor(Math.random() * brands.length)],
    price: Math.round((Math.random() * 500 + 10) * 100) / 100,
    rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 to 5.0
    reviews_count: Math.floor(Math.random() * 1000),
    in_stock: Math.random() < 0.9,
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
  }));
}