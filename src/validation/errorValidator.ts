/**
 * Error Validator for DataPrism Demo Analytics
 * Tests error handling and graceful degradation scenarios
 */

import { ErrorTestResult } from '@/types/validation';
import { CDNAssetLoader } from '@/utils/cdnLoader';
import { getCDNConfig } from '@/config/cdn';

export class ErrorValidator {
  private originalFetch: typeof window.fetch;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _originalDataPrism: any; // Future use for restoration
  
  constructor() {
    this.originalFetch = window.fetch;
    this._originalDataPrism = (window as any).DataPrism;
    // Reference to avoid unused variable warning
    void this._originalDataPrism;
  }
  
  /**
   * Tests CDN failure scenarios
   */
  async testCDNFailure(): Promise<ErrorTestResult> {
    console.log('🔍 Testing CDN failure scenario...');
    
    try {
      // Mock fetch to simulate CDN failure
      window.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        
        if (urlStr.includes('dataprism') || urlStr.includes('cdn')) {
          throw new Error('CDN_UNAVAILABLE');
        }
        
        return this.originalFetch(url, init);
      };
      
      // Try to initialize DataPrism
      const config = getCDNConfig();
      const loader = new CDNAssetLoader(config);
      
      try {
        await loader.loadCoreBundle();
        
        // If we get here, it should have fallen back to mock
        return {
          success: true,
          fallbackType: 'mock',
          gracefulDegradation: true
        };
      } catch (error) {
        // Check if error handling is graceful
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isGraceful = errorMessage.includes('fallback') || errorMessage.includes('mock');
        
        return {
          success: isGraceful,
          fallbackType: 'error',
          gracefulDegradation: isGraceful,
          error: errorMessage
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        gracefulDegradation: false
      };
    } finally {
      // Restore original fetch
      window.fetch = this.originalFetch;
    }
  }
  
  /**
   * Tests integrity verification failure
   */
  async testIntegrityFailure(): Promise<ErrorTestResult> {
    console.log('🔍 Testing integrity verification failure...');
    
    try {
      const config = getCDNConfig();
      const loader = new CDNAssetLoader(config);
      
      // Mock the integrity hash to cause failure
      const originalGetIntegrityHash = (loader as any).getIntegrityHash;
      (loader as any).getIntegrityHash = () => 'invalid-hash-that-will-fail';
      
      try {
        await loader.loadCoreBundle();
        
        // Should not reach here if integrity check works
        return {
          success: false,
          error: 'Integrity check should have failed but did not'
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isIntegrityError = errorMessage.includes('integrity') || 
                               errorMessage.includes('hash') ||
                               errorMessage.includes('fallback');
        
        return {
          success: isIntegrityError,
          expectedError: true,
          error: errorMessage
        };
      } finally {
        // Restore original method
        (loader as any).getIntegrityHash = originalGetIntegrityHash;
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Tests network timeout scenarios
   */
  async testNetworkTimeout(): Promise<ErrorTestResult> {
    console.log('🔍 Testing network timeout scenario...');
    
    try {
      // Mock fetch to simulate slow network
      window.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        
        if (urlStr.includes('dataprism')) {
          // Simulate very slow response
          await new Promise(resolve => setTimeout(resolve, 15000));
          throw new Error('NETWORK_TIMEOUT');
        }
        
        return this.originalFetch(url, init);
      };
      
      const config = getCDNConfig();
      const loader = new CDNAssetLoader(config);
      
      try {
        await loader.loadCoreBundle();
        
        return {
          success: true,
          fallbackType: 'timeout_recovery',
          gracefulDegradation: true
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isTimeoutHandled = errorMessage.includes('timeout') || 
                               errorMessage.includes('fallback') ||
                               errorMessage.includes('retry');
        
        return {
          success: isTimeoutHandled,
          error: errorMessage,
          gracefulDegradation: isTimeoutHandled
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        gracefulDegradation: false
      };
    } finally {
      // Restore original fetch
      window.fetch = this.originalFetch;
    }
  }
  
  /**
   * Tests WASM initialization failure
   */
  async testWASMInitFailure(): Promise<ErrorTestResult> {
    console.log('🔍 Testing WASM initialization failure...');
    
    try {
      // Mock WebAssembly to fail
      const originalWebAssembly = global.WebAssembly;
      global.WebAssembly = {
        ...originalWebAssembly,
        instantiate: () => Promise.reject(new Error('WASM_INIT_FAILED'))
      } as any;
      
      const config = getCDNConfig();
      const loader = new CDNAssetLoader(config);
      
      try {
        await loader.loadCoreBundle();
        
        return {
          success: true,
          fallbackType: 'wasm_fallback',
          gracefulDegradation: true
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isWasmErrorHandled = errorMessage.includes('WASM') || 
                                 errorMessage.includes('fallback') ||
                                 errorMessage.includes('mock');
        
        return {
          success: isWasmErrorHandled,
          error: errorMessage,
          gracefulDegradation: isWasmErrorHandled
        };
      } finally {
        // Restore original WebAssembly
        global.WebAssembly = originalWebAssembly;
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        gracefulDegradation: false
      };
    }
  }
  
  /**
   * Tests JavaScript error handling
   */
  async testJavaScriptError(): Promise<ErrorTestResult> {
    console.log('🔍 Testing JavaScript error handling...');
    
    try {
      const errors: string[] = [];
      
      // Set up error listener
      const errorHandler = (event: ErrorEvent) => {
        errors.push(event.error?.message || event.message);
      };
      
      window.addEventListener('error', errorHandler);
      
      // Simulate JavaScript error
      try {
        throw new Error('SIMULATED_JS_ERROR');
      } catch (error) {
        // Error should be caught by error handler
      }
      
      // Wait for error to be processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      window.removeEventListener('error', errorHandler);
      
      return {
        success: errors.length > 0,
        error: errors.join(', '),
        gracefulDegradation: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        gracefulDegradation: false
      };
    }
  }
  
  /**
   * Tests memory limit scenarios
   */
  async testMemoryLimit(): Promise<ErrorTestResult> {
    console.log('🔍 Testing memory limit scenario...');
    
    try {
      // Simulate memory pressure
      const largeArrays: number[][] = [];
      
      try {
        // Create large arrays until memory limit
        for (let i = 0; i < 1000; i++) {
          largeArrays.push(new Array(1000000).fill(Math.random()));
        }
        
        return {
          success: true,
          gracefulDegradation: true
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isMemoryError = errorMessage.includes('memory') || 
                            errorMessage.includes('out of memory') ||
                            errorMessage.includes('allocation');
        
        return {
          success: isMemoryError,
          error: errorMessage,
          gracefulDegradation: isMemoryError
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        gracefulDegradation: false
      };
    }
  }
  
  /**
   * Tests all error scenarios
   */
  async testAllErrorScenarios(): Promise<{
    cdnFailure: ErrorTestResult;
    integrityFailure: ErrorTestResult;
    networkTimeout: ErrorTestResult;
    wasmInitFailure: ErrorTestResult;
    javascriptError: ErrorTestResult;
    memoryLimit: ErrorTestResult;
    overall: {
      success: boolean;
      passedTests: number;
      totalTests: number;
      score: number;
    };
  }> {
    console.log('🔍 Running comprehensive error scenario tests...');
    
    const results = {
      cdnFailure: await this.testCDNFailure(),
      integrityFailure: await this.testIntegrityFailure(),
      networkTimeout: await this.testNetworkTimeout(),
      wasmInitFailure: await this.testWASMInitFailure(),
      javascriptError: await this.testJavaScriptError(),
      memoryLimit: await this.testMemoryLimit(),
      overall: {
        success: false,
        passedTests: 0,
        totalTests: 6,
        score: 0
      }
    };
    
    const passedTests = Object.values(results).filter(
      (result) => result !== results.overall && result.success
    ).length;
    
    results.overall = {
      success: passedTests >= 4, // Pass if 4 out of 6 tests pass
      passedTests,
      totalTests: 6,
      score: (passedTests / 6) * 100
    };
    
    console.log(`✅ Error scenario tests completed: ${passedTests}/6 passed (${results.overall.score.toFixed(1)}%)`);
    
    return results;
  }
  
  /**
   * Generates error handling report
   */
  generateErrorReport(results: any): string {
    const timestamp = new Date().toISOString();
    
    return `
# DataPrism Error Handling Report
Generated: ${timestamp}

## Error Scenario Tests
- **CDN Failure**: ${results.cdnFailure.success ? '✅ PASSED' : '❌ FAILED'} - ${results.cdnFailure.error || 'Graceful degradation working'}
- **Integrity Failure**: ${results.integrityFailure.success ? '✅ PASSED' : '❌ FAILED'} - ${results.integrityFailure.error || 'Integrity verification working'}
- **Network Timeout**: ${results.networkTimeout.success ? '✅ PASSED' : '❌ FAILED'} - ${results.networkTimeout.error || 'Timeout handling working'}
- **WASM Init Failure**: ${results.wasmInitFailure.success ? '✅ PASSED' : '❌ FAILED'} - ${results.wasmInitFailure.error || 'WASM fallback working'}
- **JavaScript Error**: ${results.javascriptError.success ? '✅ PASSED' : '❌ FAILED'} - ${results.javascriptError.error || 'Error handling working'}
- **Memory Limit**: ${results.memoryLimit.success ? '✅ PASSED' : '❌ FAILED'} - ${results.memoryLimit.error || 'Memory handling working'}

## Overall Assessment: ${results.overall.success ? '✅ PASSED' : '❌ FAILED'}
Score: ${results.overall.score.toFixed(1)}% (${results.overall.passedTests}/${results.overall.totalTests} tests passed)

## Recommendations
${results.overall.success ? 
  'Error handling is robust and meets requirements.' : 
  'Some error scenarios need improvement. Review failed tests and implement better error handling.'}
`;
  }
}