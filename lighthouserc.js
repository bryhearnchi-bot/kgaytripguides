module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3001/',
        'http://localhost:3001/trips',
        'http://localhost:3001/auth/login',
      ],
      startServerCommand: 'npm run dev',
      startServerReadyPattern: 'Local:.*http://localhost:3001',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.7 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        'categories:pwa': ['warn', { minScore: 0.6 }],

        // Performance budgets
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'first-meaningful-paint': ['warn', { maxNumericValue: 2500 }],
        'speed-index': ['warn', { maxNumericValue: 3500 }],
        'total-blocking-time': ['error', { maxNumericValue: 500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],

        // Accessibility
        'color-contrast': 'error',
        'heading-order': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',

        // Best practices
        'uses-https': 'error',
        'uses-text-compression': 'warn',
        'unused-css-rules': 'warn',
        'unused-javascript': 'warn',
        'modern-image-formats': 'warn',
        'efficient-animated-content': 'warn',

        // SEO
        'meta-description': 'error',
        'document-title': 'error',
        'crawlable-anchors': 'error',
        'robots-txt': 'warn',
        'structured-data': 'warn',
      },
    },
  },
};