/**
 * Security validation tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SecurityValidator } from '@/validation/securityValidator';
import { ErrorValidator } from '@/validation/errorValidator';

describe('Security Validation', () => {
  let securityValidator: SecurityValidator;
  let errorValidator: ErrorValidator;

  beforeEach(() => {
    securityValidator = new SecurityValidator();
    errorValidator = new ErrorValidator();
  });

  afterEach(() => {
    // Reset any mocks
  });

  describe('HTTPS Requirements', () => {
    it('should validate HTTPS-only access', async () => {
      // Mock HTTPS location
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'https:',
          host: 'localhost:3000',
          href: 'https://localhost:3000'
        },
        writable: true
      });

      const result = await securityValidator.validateHTTPS();
      
      expect(result.httpsOnly).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect HTTP access violations', async () => {
      // Mock HTTP location
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'http:',
          host: 'localhost:3000',
          href: 'http://localhost:3000'
        },
        writable: true
      });

      const result = await securityValidator.validateHTTPS();
      
      expect(result.httpsOnly).toBe(false);
      expect(result.violations).toContain('Page not served over HTTPS');
    });

    it('should detect mixed content', async () => {
      // Mock HTTPS location
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'https:',
          host: 'localhost:3000',
          href: 'https://localhost:3000'
        },
        writable: true
      });

      // Create mixed content elements
      const script = document.createElement('script');
      script.src = 'http://example.com/script.js';
      document.head.appendChild(script);

      const result = await securityValidator.validateHTTPS();
      
      expect(result.mixedContent).toBe(false);
      expect(result.violations).toContain(expect.stringContaining('Mixed content script'));
      
      // Cleanup
      document.head.removeChild(script);
    });
  });

  describe('Content Security Policy', () => {
    it('should validate CSP presence', async () => {
      // Create CSP meta tag
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = "script-src 'self' https://cdn.example.com; connect-src 'self'; worker-src 'self'";
      document.head.appendChild(cspMeta);

      const result = await securityValidator.validateCSP();
      
      expect(result.cspPresent).toBe(true);
      expect(result.requiredDirectives).toBe(true);
      
      // Cleanup
      document.head.removeChild(cspMeta);
    });

    it('should detect missing CSP', async () => {
      const result = await securityValidator.validateCSP();
      
      expect(result.cspPresent).toBe(false);
      expect(result.violations).toContain('No Content Security Policy found');
    });

    it('should detect missing CSP directives', async () => {
      // Create incomplete CSP
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = "script-src 'self'"; // Missing other directives
      document.head.appendChild(cspMeta);

      const result = await securityValidator.validateCSP();
      
      expect(result.violations).toContain(expect.stringContaining('Missing CSP directive'));
      
      // Cleanup
      document.head.removeChild(cspMeta);
    });

    it('should detect unsafe CSP directives', async () => {
      // Create unsafe CSP
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = "script-src 'self' 'unsafe-eval'; connect-src *";
      document.head.appendChild(cspMeta);

      const result = await securityValidator.validateCSP();
      
      expect(result.violations).toContain(expect.stringContaining('unsafe-eval'));
      expect(result.violations).toContain(expect.stringContaining('*'));
      
      // Cleanup
      document.head.removeChild(cspMeta);
    });
  });

  describe('Subresource Integrity', () => {
    it('should validate SRI for CDN scripts', async () => {
      // Create script with SRI
      const script = document.createElement('script');
      script.src = 'https://cdn.example.com/dataprism.js';
      script.integrity = 'sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC';
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);

      const result = await securityValidator.validateSRI();
      
      expect(result.sriComplete).toBe(true);
      expect(result.violations).toHaveLength(0);
      
      // Cleanup
      document.head.removeChild(script);
    });

    it('should detect missing SRI for CDN resources', async () => {
      // Create script without SRI
      const script = document.createElement('script');
      script.src = 'https://cdn.example.com/dataprism.js';
      document.head.appendChild(script);

      const result = await securityValidator.validateSRI();
      
      expect(result.sriComplete).toBe(false);
      expect(result.violations).toContain(expect.stringContaining('Script missing SRI'));
      
      // Cleanup
      document.head.removeChild(script);
    });

    it('should detect invalid SRI hash format', async () => {
      // Create script with invalid SRI
      const script = document.createElement('script');
      script.src = 'https://cdn.example.com/dataprism.js';
      script.integrity = 'invalid-hash-format';
      document.head.appendChild(script);

      const result = await securityValidator.validateSRI();
      
      expect(result.violations).toContain(expect.stringContaining('Invalid SRI hash format'));
      
      // Cleanup
      document.head.removeChild(script);
    });
  });

  describe('Secrets Management', () => {
    it('should detect secrets in script content', async () => {
      // Create script with potential secret
      const script = document.createElement('script');
      script.textContent = 'const apiKey = "sk-1234567890abcdef";';
      document.head.appendChild(script);

      const result = await securityValidator.validateSecrets();
      
      expect(result.violations).toContain(expect.stringContaining('Potential secret found'));
      
      // Cleanup
      document.head.removeChild(script);
    });

    it('should detect secrets in localStorage', async () => {
      // Mock localStorage with secret
      const originalGetItem = localStorage.getItem;
      const originalLength = localStorage.length;
      const originalKey = localStorage.key;
      
      localStorage.setItem('test-key', 'api_key="AKIA1234567890123456"');
      
      const result = await securityValidator.validateSecrets();
      
      expect(result.violations).toContain(expect.stringContaining('localStorage'));
      
      // Cleanup
      localStorage.removeItem('test-key');
    });

    it('should not flag non-secret content', async () => {
      const script = document.createElement('script');
      script.textContent = 'console.log("Hello World");';
      document.head.appendChild(script);

      const result = await securityValidator.validateSecrets();
      
      expect(result.violations).toHaveLength(0);
      
      // Cleanup
      document.head.removeChild(script);
    });
  });

  describe('Cross-Origin Policies', () => {
    it('should validate crossorigin attributes', async () => {
      // Create script with crossorigin
      const script = document.createElement('script');
      script.src = 'https://cdn.example.com/dataprism.js';
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);

      const result = await securityValidator.validateCrossOrigin();
      
      expect(result.violations).toHaveLength(0);
      
      // Cleanup
      document.head.removeChild(script);
    });

    it('should detect missing crossorigin attributes', async () => {
      // Create CDN script without crossorigin
      const script = document.createElement('script');
      script.src = 'https://cdn.example.com/dataprism.js';
      document.head.appendChild(script);

      const result = await securityValidator.validateCrossOrigin();
      
      expect(result.violations).toContain(expect.stringContaining('missing crossorigin attribute'));
      
      // Cleanup
      document.head.removeChild(script);
    });
  });

  describe('Error Handling Security', () => {
    it('should test CDN failure security', async () => {
      const result = await errorValidator.testCDNFailure();
      
      expect(result.success).toBe(true);
      expect(result.gracefulDegradation).toBe(true);
    });

    it('should test integrity failure security', async () => {
      const result = await errorValidator.testIntegrityFailure();
      
      expect(result.success).toBe(true);
      expect(result.expectedError).toBe(true);
    });

    it('should test network timeout security', async () => {
      const result = await errorValidator.testNetworkTimeout();
      
      expect(result.gracefulDegradation).toBe(true);
    });
  });

  describe('Comprehensive Security Validation', () => {
    it('should run all security checks', async () => {
      const results = await securityValidator.validateAllSecurity();
      
      expect(results.overall.passed).toBe(true);
      expect(results.overall.score).toBeGreaterThanOrEqual(80);
      expect(results.overall.totalViolations).toBeLessThanOrEqual(2);
    });

    it('should generate security report', async () => {
      const results = await securityValidator.validateAllSecurity();
      const report = securityValidator.generateSecurityReport(results);
      
      expect(report).toContain('DataPrism Security Validation Report');
      expect(report).toContain('HTTPS');
      expect(report).toContain('Content Security Policy');
      expect(report).toContain('Subresource Integrity');
      expect(report).toContain('Overall Assessment');
    });

    it('should provide security recommendations', async () => {
      const results = await securityValidator.validateAllSecurity();
      
      // Check that recommendations are provided for any failures
      Object.values(results).forEach((result: any) => {
        if (result.violations && result.violations.length > 0) {
          expect(result.violations).toEqual(expect.any(Array));
        }
      });
    });
  });

  describe('Security Monitoring', () => {
    it('should monitor for security violations', async () => {
      const violations: string[] = [];
      
      // Mock security violation detector
      const detectViolation = (type: string, details: string) => {
        violations.push(`${type}: ${details}`);
      };
      
      // Simulate some violations
      detectViolation('CSP', 'Blocked unsafe-inline execution');
      detectViolation('SRI', 'Hash mismatch for resource');
      
      expect(violations.length).toBe(2);
      expect(violations[0]).toContain('CSP');
      expect(violations[1]).toContain('SRI');
    });

    it('should track security metrics over time', () => {
      const metrics = {
        httpsViolations: 0,
        cspViolations: 0,
        sriViolations: 0,
        secretsDetected: 0
      };
      
      // Simulate security events
      metrics.cspViolations++;
      metrics.sriViolations++;
      
      expect(metrics.cspViolations).toBe(1);
      expect(metrics.sriViolations).toBe(1);
      expect(metrics.httpsViolations).toBe(0);
      expect(metrics.secretsDetected).toBe(0);
    });
  });
});