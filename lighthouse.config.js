/**
 * Lighthouse Configuration for DataPrism Demo Analytics
 * Configured for performance and accessibility auditing
 */

module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      numberOfRuns: 3,
      settings: {
        chromeFlags: ['--no-sandbox', '--disable-dev-shm-usage'],
        onlyCategories: ['performance', 'accessibility', 'best-practices'],
        output: 'html',
        outputPath: './test-results/lighthouse',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
  
  // Custom audit configurations
  extends: 'lighthouse:default',
  
  settings: {
    // Performance budgets
    budgets: [
      {
        path: '/*',
        timings: [
          {
            metric: 'first-contentful-paint',
            budget: 2000,
          },
          {
            metric: 'largest-contentful-paint',
            budget: 4000,
          },
          {
            metric: 'speed-index',
            budget: 3000,
          },
        ],
        resourceSizes: [
          {
            resourceType: 'script',
            budget: 500,
          },
          {
            resourceType: 'total',
            budget: 8000,
          },
        ],
      },
    ],
    
    // Throttling settings for 3G simulation
    throttling: {
      rttMs: 40,
      throughputKbps: 1.6 * 1024,
      cpuSlowdownMultiplier: 4,
    },
    
    // Device emulation
    emulatedFormFactor: 'desktop',
    
    // Skip certain audits that may not be relevant
    skipAudits: [
      'uses-http2',
      'uses-passive-event-listeners',
      'service-worker',
      'offline-start-url',
      'installable-manifest',
    ],
  },
  
  // Custom gatherers (if needed)
  gatherers: [],
  
  // Custom audits (if needed)
  audits: [],
  
  // Categories configuration
  categories: {
    performance: {
      title: 'Performance',
      description: 'DataPrism Demo Analytics Performance Metrics',
      auditRefs: [
        { id: 'first-contentful-paint', weight: 10 },
        { id: 'largest-contentful-paint', weight: 25 },
        { id: 'speed-index', weight: 10 },
        { id: 'cumulative-layout-shift', weight: 25 },
        { id: 'total-blocking-time', weight: 30 },
      ],
    },
    accessibility: {
      title: 'Accessibility',
      description: 'DataPrism Demo Analytics Accessibility Compliance',
    },
    'best-practices': {
      title: 'Best Practices',
      description: 'DataPrism Demo Analytics Best Practices Compliance',
    },
  },
};