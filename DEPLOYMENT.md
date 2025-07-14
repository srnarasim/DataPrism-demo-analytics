# Deployment Guide for DataPrism Demo Analytics

This guide covers deploying the standalone DataPrism Demo Analytics application according to the PRP specifications.

## 🎯 Deployment Overview

The standalone demo application is designed for independent deployment without any DataPrism monorepo dependencies. It loads DataPrism dynamically from CDN at runtime.

## 📋 Prerequisites

- Node.js 18+
- npm 9+
- Git
- GitHub account (for GitHub Pages deployment)

## 🚀 Quick Deployment to GitHub Pages

### 1. Repository Setup

```bash
# Create new repository
git init
git add .
git commit -m "Initial commit: Standalone DataPrism demo"

# Add GitHub remote
git remote add origin https://github.com/yourusername/dataprism-demo-analytics.git
git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to repository Settings → Pages
2. Select "GitHub Actions" as source
3. The workflow will automatically deploy on push to main

### 3. Configure Environment

Create environment variables if needed:

```bash
# Repository Settings → Secrets and Variables → Actions
VITE_DATAPRISM_CDN_URL=https://srnarasim.github.io/DataPrism
VITE_DATAPRISM_VERSION=latest
```

### 4. Deploy

```bash
# Push to main branch triggers automatic deployment
git push origin main

# Or manually trigger deployment
gh workflow run deploy.yml
```

## 🏗️ Manual Deployment

### Build Application

```bash
# Install dependencies
npm install

# Run validation
npm run validate

# Build for production
npm run build

# Preview locally
npm run preview
```

### Deploy to Any Static Host

```bash
# The dist/ directory contains the complete application
# Upload to any static hosting service:

# Netlify
npx netlify deploy --prod --dir=dist

# Vercel
npx vercel --prod

# AWS S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Azure Static Web Apps
az staticwebapp create --source dist/
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_DATAPRISM_CDN_URL` | DataPrism CDN base URL | `https://srnarasim.github.io/DataPrism` |
| `VITE_DATAPRISM_VERSION` | DataPrism version to load | `latest` |
| `VITE_ENABLE_ANALYTICS` | Enable usage analytics | `false` |
| `VITE_DEBUG_MODE` | Enable debug logging | `false` |

### Build Configuration

```typescript
// vite.config.ts
export default defineConfig({
  // Production optimizations
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['d3', 'chart.js', 'recharts'],
        },
      },
    },
  },
});
```

## 📊 Performance Validation

### Bundle Size Requirements

Per PRP specifications:

- **Demo app bundle:** <500KB (excluding DataPrism CDN assets)
- **CDN load time:** <5 seconds on modern broadband
- **Initial render:** <2 seconds after CDN loaded

### Validation Commands

```bash
# Check bundle size
npm run build
find dist/assets -name "*.js" -exec du -k {} \; | awk '{sum+=$1} END {print sum "KB"}'

# Validate all requirements
npm run validate

# Performance testing
npm run test:e2e
```

## 🔒 Security Configuration

### Content Security Policy

```html
<!-- In production, configure CSP header -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://srnarasim.github.io;
  connect-src 'self' https://srnarasim.github.io;
  img-src 'self' data: https:;
  style-src 'self' 'unsafe-inline';
">
```

### CORS Headers

For CDN compatibility, ensure proper CORS headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

## 🌐 CDN Integration

### Primary CDN

- **URL:** `https://srnarasim.github.io/DataPrism/`
- **Assets:** Core bundle, WASM files, plugins
- **Integrity:** SHA-384 verification
- **Fallback:** Automatic retry with exponential backoff

### Version Management

```bash
# Use specific version
VITE_DATAPRISM_VERSION=1.2.3

# Use latest stable
VITE_DATAPRISM_VERSION=latest

# Use development build
VITE_DATAPRISM_VERSION=dev
```

## 🚨 Troubleshooting

### Common Issues

**1. CDN Loading Failures**
```bash
# Check CDN status
curl -I https://srnarasim.github.io/DataPrism/manifest.json

# Verify CORS headers
curl -H "Origin: https://your-domain.com" https://srnarasim.github.io/DataPrism/dataprism.umd.js
```

**2. Bundle Size Exceeded**
```bash
# Analyze bundle
npm run build
npx vite-bundle-analyzer dist/

# Check for large dependencies
npm run analyze
```

**3. WebAssembly Issues**
```bash
# Verify WASM support
curl https://srnarasim.github.io/DataPrism/assets/

# Check browser compatibility
# Chrome/Firefox/Safari 14+ required
```

### Debug Mode

Enable debug logging:

```bash
# Development
VITE_DEBUG_MODE=true npm run dev

# Production
VITE_DEBUG_MODE=true npm run build
```

## 📈 Monitoring

### Performance Metrics

The application automatically tracks:

- CDN load time
- DataPrism initialization time
- Query execution performance
- Memory usage

### Health Checks

```bash
# Validate deployment
curl -f https://your-domain.com

# Check CDN connectivity
curl -f https://srnarasim.github.io/DataPrism/manifest.json

# Test application functionality
npm run test:e2e -- --headed
```

## 🔄 Updates

### Updating DataPrism Version

```bash
# Update environment variable
VITE_DATAPRISM_VERSION=1.3.0

# Rebuild and deploy
npm run build
npm run deploy
```

### Application Updates

```bash
# Update dependencies
npm update

# Run validation
npm run validate

# Deploy
git add .
git commit -m "Update: Description"
git push origin main
```

## 📞 Support

For deployment issues:

1. Check the [GitHub Actions logs](../../actions)
2. Review the [troubleshooting guide](#-troubleshooting)
3. Test locally with `npm run preview`
4. Validate CDN connectivity manually

## ✅ Deployment Checklist

- [ ] Repository created and configured
- [ ] GitHub Pages enabled
- [ ] Environment variables set
- [ ] Bundle size <500KB validated
- [ ] CDN connectivity tested
- [ ] Performance requirements met
- [ ] Security headers configured
- [ ] Monitoring setup
- [ ] Documentation updated

---

This deployment guide ensures the standalone demo meets all PRP requirements for independent deployment with CDN integration.