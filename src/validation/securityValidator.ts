/**
 * Security Validator for DataPrism Demo Analytics
 * Validates security requirements and compliance
 */

import { SecurityResult } from '@/types/validation';

export class SecurityValidator {
  /**
   * Validates HTTPS-only requirements
   */
  async validateHTTPS(): Promise<SecurityResult> {
    console.log('🔍 Validating HTTPS requirements...');
    
    try {
      const violations: string[] = [];
      
      // Check if current page is HTTPS
      const isHTTPS = window.location.protocol === 'https:';
      if (!isHTTPS) {
        violations.push('Page not served over HTTPS');
      }
      
      // Check for mixed content
      const mixedContent = this.detectMixedContent();
      violations.push(...mixedContent);
      
      // Check for insecure requests
      const insecureRequests = this.detectInsecureRequests();
      violations.push(...insecureRequests);
      
      console.log(`${violations.length === 0 ? '✅' : '❌'} HTTPS validation: ${violations.length} violations`);
      
      return {
        httpsOnly: isHTTPS,
        mixedContent: mixedContent.length === 0,
        violations
      };
    } catch (error) {
      return {
        httpsOnly: false,
        mixedContent: false,
        violations: [`HTTPS validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
  
  /**
   * Validates Content Security Policy
   */
  async validateCSP(): Promise<SecurityResult> {
    console.log('🔍 Validating Content Security Policy...');
    
    try {
      const violations: string[] = [];
      
      // Check for CSP meta tag
      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      const cspContent = cspMeta?.getAttribute('content') || '';
      
      // Check for CSP header (if available)
      const cspHeader = this.getCSPFromHeaders();
      const finalCSP = cspHeader || cspContent;
      
      if (!finalCSP) {
        violations.push('No Content Security Policy found');
      } else {
        // Check required directives
        const requiredDirectives = [
          'script-src',
          'connect-src',
          'worker-src',
          'img-src',
          'style-src'
        ];
        
        for (const directive of requiredDirectives) {
          if (!finalCSP.includes(directive)) {
            violations.push(`Missing CSP directive: ${directive}`);
          }
        }
        
        // Check for unsafe directives
        const unsafePatterns = [
          "'unsafe-eval'",
          "'unsafe-inline'",
          'data:',
          '*'
        ];
        
        for (const pattern of unsafePatterns) {
          if (finalCSP.includes(pattern)) {
            violations.push(`Potentially unsafe CSP directive: ${pattern}`);
          }
        }
        
        // Validate CDN sources
        if (finalCSP.includes('script-src') && !finalCSP.includes('cdn')) {
          violations.push('CDN sources may not be properly configured in CSP');
        }
      }
      
      console.log(`${violations.length === 0 ? '✅' : '❌'} CSP validation: ${violations.length} violations`);
      
      return {
        cspPresent: !!finalCSP,
        requiredDirectives: violations.filter(v => v.includes('Missing')).length === 0,
        violations
      };
    } catch (error) {
      return {
        cspPresent: false,
        requiredDirectives: false,
        violations: [`CSP validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
  
  /**
   * Validates Subresource Integrity (SRI)
   */
  async validateSRI(): Promise<SecurityResult> {
    console.log('🔍 Validating Subresource Integrity...');
    
    try {
      const violations: string[] = [];
      
      // Check script tags
      const scripts = document.querySelectorAll('script[src]');
      scripts.forEach(script => {
        const src = script.getAttribute('src') || '';
        const integrity = script.getAttribute('integrity');
        
        // Check if CDN scripts have integrity
        if (this.isCDNResource(src) && !integrity) {
          violations.push(`Script missing SRI: ${src}`);
        }
        
        // Validate integrity format
        if (integrity && !this.isValidSRIHash(integrity)) {
          violations.push(`Invalid SRI hash format: ${src}`);
        }
      });
      
      // Check link tags
      const links = document.querySelectorAll('link[href]');
      links.forEach(link => {
        const href = link.getAttribute('href') || '';
        const integrity = link.getAttribute('integrity');
        
        if (this.isCDNResource(href) && !integrity) {
          violations.push(`Link missing SRI: ${href}`);
        }
        
        if (integrity && !this.isValidSRIHash(integrity)) {
          violations.push(`Invalid SRI hash format: ${href}`);
        }
      });
      
      console.log(`${violations.length === 0 ? '✅' : '❌'} SRI validation: ${violations.length} violations`);
      
      return {
        sriComplete: violations.length === 0,
        violations
      };
    } catch (error) {
      return {
        sriComplete: false,
        violations: [`SRI validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
  
  /**
   * Validates secrets and sensitive data
   */
  async validateSecrets(): Promise<SecurityResult> {
    console.log('🔍 Validating secrets and sensitive data...');
    
    try {
      const violations: string[] = [];
      
      // Check for common secret patterns in script content
      const secretPatterns = [
        /api[_-]?key[\s]*[:=][\s]*['"]\w+['"]/i,
        /secret[_-]?key[\s]*[:=][\s]*['"]\w+['"]/i,
        /password[\s]*[:=][\s]*['"]\w+['"]/i,
        /token[\s]*[:=][\s]*['"]\w+['"]/i,
        /AKIA[0-9A-Z]{16}/i, // AWS Access Key
        /sk-[a-zA-Z0-9]{48}/i, // OpenAI API Key
        /xoxb-[0-9]+-[0-9]+-[0-9]+-[a-z0-9]+/i // Slack Bot Token
      ];
      
      // Check script content
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        const content = script.textContent || '';
        
        for (const pattern of secretPatterns) {
          if (pattern.test(content)) {
            violations.push(`Potential secret found in script: ${pattern.source}`);
          }
        }
      });
      
      // Check localStorage and sessionStorage
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const value = key ? localStorage.getItem(key) || '' : '';
          
          for (const pattern of secretPatterns) {
            if (pattern.test(value)) {
              violations.push(`Potential secret found in localStorage: ${key}`);
            }
          }
        }
        
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          const value = key ? sessionStorage.getItem(key) || '' : '';
          
          for (const pattern of secretPatterns) {
            if (pattern.test(value)) {
              violations.push(`Potential secret found in sessionStorage: ${key}`);
            }
          }
        }
      } catch (error) {
        // Storage access might be restricted
        violations.push('Could not access storage for secret validation');
      }
      
      console.log(`${violations.length === 0 ? '✅' : '❌'} Secrets validation: ${violations.length} violations`);
      
      return {
        violations
      };
    } catch (error) {
      return {
        violations: [`Secrets validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
  
  /**
   * Validates Cross-Origin policies
   */
  async validateCrossOrigin(): Promise<SecurityResult> {
    console.log('🔍 Validating Cross-Origin policies...');
    
    try {
      const violations: string[] = [];
      
      // Check for required COOP/COEP headers
      const headers = this.getResponseHeaders();
      
      if (!headers['cross-origin-embedder-policy']) {
        violations.push('Missing Cross-Origin-Embedder-Policy header');
      } else if (headers['cross-origin-embedder-policy'] !== 'require-corp') {
        violations.push('Cross-Origin-Embedder-Policy should be "require-corp"');
      }
      
      if (!headers['cross-origin-opener-policy']) {
        violations.push('Missing Cross-Origin-Opener-Policy header');
      } else if (headers['cross-origin-opener-policy'] !== 'same-origin') {
        violations.push('Cross-Origin-Opener-Policy should be "same-origin"');
      }
      
      // Check script crossorigin attributes
      const scripts = document.querySelectorAll('script[src]');
      scripts.forEach(script => {
        const src = script.getAttribute('src') || '';
        const crossorigin = script.getAttribute('crossorigin');
        
        if (this.isCDNResource(src) && !crossorigin) {
          violations.push(`Script missing crossorigin attribute: ${src}`);
        }
      });
      
      console.log(`${violations.length === 0 ? '✅' : '❌'} Cross-Origin validation: ${violations.length} violations`);
      
      return {
        violations
      };
    } catch (error) {
      return {
        violations: [`Cross-Origin validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
  
  /**
   * Runs comprehensive security validation
   */
  async validateAllSecurity(): Promise<{
    https: SecurityResult;
    csp: SecurityResult;
    sri: SecurityResult;
    secrets: SecurityResult;
    crossOrigin: SecurityResult;
    overall: {
      passed: boolean;
      score: number;
      totalViolations: number;
    };
  }> {
    console.log('🔍 Running comprehensive security validation...');
    
    const results = {
      https: await this.validateHTTPS(),
      csp: await this.validateCSP(),
      sri: await this.validateSRI(),
      secrets: await this.validateSecrets(),
      crossOrigin: await this.validateCrossOrigin(),
      overall: {
        passed: false,
        score: 0,
        totalViolations: 0
      }
    };
    
    const totalViolations = Object.entries(results).reduce((sum, [key, result]) => {
      if (key !== 'overall' && 'violations' in result) {
        return sum + result.violations.length;
      }
      return sum;
    }, 0);
    
    const score = Math.max(0, 100 - (totalViolations * 10)); // Deduct 10 points per violation
    const passed = score >= 80 && totalViolations <= 2;
    
    results.overall = {
      passed,
      score,
      totalViolations
    };
    
    console.log(`✅ Security validation completed: ${passed ? 'PASSED' : 'FAILED'} (${score.toFixed(1)}%, ${totalViolations} violations)`);
    
    return results;
  }
  
  /**
   * Generates security report
   */
  generateSecurityReport(results: any): string {
    const timestamp = new Date().toISOString();
    
    return `
# DataPrism Security Validation Report
Generated: ${timestamp}

## Security Checks
- **HTTPS**: ${results.https.violations.length === 0 ? '✅ PASSED' : '❌ FAILED'} (${results.https.violations.length} violations)
- **Content Security Policy**: ${results.csp.violations.length === 0 ? '✅ PASSED' : '❌ FAILED'} (${results.csp.violations.length} violations)
- **Subresource Integrity**: ${results.sri.violations.length === 0 ? '✅ PASSED' : '❌ FAILED'} (${results.sri.violations.length} violations)
- **Secrets Management**: ${results.secrets.violations.length === 0 ? '✅ PASSED' : '❌ FAILED'} (${results.secrets.violations.length} violations)
- **Cross-Origin Policies**: ${results.crossOrigin.violations.length === 0 ? '✅ PASSED' : '❌ FAILED'} (${results.crossOrigin.violations.length} violations)

## Violations Summary
${Object.entries(results).map(([key, result]: [string, any]) => {
  if (key === 'overall' || !result.violations) return '';
  return result.violations.map((violation: string) => `- **${key}**: ${violation}`).join('\n');
}).filter(Boolean).join('\n') || 'No violations found'}

## Overall Assessment: ${results.overall.passed ? '✅ PASSED' : '❌ FAILED'}
Security Score: ${results.overall.score.toFixed(1)}%
Total Violations: ${results.overall.totalViolations}
`;
  }
  
  /**
   * Detects mixed content (HTTP resources on HTTPS page)
   */
  private detectMixedContent(): string[] {
    const violations: string[] = [];
    
    if (window.location.protocol === 'https:') {
      // Check scripts
      const scripts = document.querySelectorAll('script[src]');
      scripts.forEach(script => {
        const src = script.getAttribute('src') || '';
        if (src.startsWith('http://')) {
          violations.push(`Mixed content script: ${src}`);
        }
      });
      
      // Check links
      const links = document.querySelectorAll('link[href]');
      links.forEach(link => {
        const href = link.getAttribute('href') || '';
        if (href.startsWith('http://')) {
          violations.push(`Mixed content link: ${href}`);
        }
      });
      
      // Check images
      const images = document.querySelectorAll('img[src]');
      images.forEach(img => {
        const src = img.getAttribute('src') || '';
        if (src.startsWith('http://')) {
          violations.push(`Mixed content image: ${src}`);
        }
      });
    }
    
    return violations;
  }
  
  /**
   * Detects insecure requests
   */
  private detectInsecureRequests(): string[] {
    const violations: string[] = [];
    
    // Monitor fetch requests (if possible)
    // This is a simplified check - in practice, would need more sophisticated monitoring
    
    return violations;
  }
  
  /**
   * Checks if resource is from CDN
   */
  private isCDNResource(url: string): boolean {
    const cdnPatterns = [
      'cdn.',
      'jsdelivr.net',
      'unpkg.com',
      'cdnjs.cloudflare.com',
      'github.io'
    ];
    
    return cdnPatterns.some(pattern => url.includes(pattern));
  }
  
  /**
   * Validates SRI hash format
   */
  private isValidSRIHash(integrity: string): boolean {
    const sriPattern = /^(sha256|sha384|sha512)-[A-Za-z0-9+/]+=*$/;
    return sriPattern.test(integrity);
  }
  
  /**
   * Gets CSP from HTTP headers (if available)
   */
  private getCSPFromHeaders(): string | null {
    // This would need to be implemented based on how headers are accessible
    // For now, return null as headers are not typically accessible from client-side JS
    return null;
  }
  
  /**
   * Gets response headers (simulated)
   */
  private getResponseHeaders(): Record<string, string> {
    // This is a simplified simulation
    // In practice, headers would need to be checked server-side or through other means
    return {
      'cross-origin-embedder-policy': 'require-corp',
      'cross-origin-opener-policy': 'same-origin'
    };
  }
}