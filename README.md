# DataPrism Demo Analytics - Standalone Application

A standalone demonstration application showcasing DataPrism's powerful analytics capabilities by consuming DataPrism directly from CDN.

## 🎯 Overview

This application demonstrates the **decoupled architecture** approach for integrating DataPrism into external applications. Instead of bundling DataPrism locally, it loads the engine dynamically from a CDN, showcasing best practices for:

- **Zero local dependencies** on DataPrism packages
- **Version-controlled CDN consumption** with fallback strategies  
- **Independent deployment** pipeline
- **Real-world integration patterns** for external developers

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/dataprism-demo-analytics
cd dataprism-demo-analytics

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

## 📦 CDN Integration

This demo loads DataPrism from the official CDN:

- **Base URL:** `https://srnarasim.github.io/DataPrism/`
- **Core Bundle:** `dataprism.umd.js` (UMD format)
- **Integrity Verification:** SHA-384 hashes for security
- **Fallback Support:** Automatic retry with exponential backoff

### Configuration

Configure CDN settings via environment variables:

```bash
# .env.local
VITE_DATAPRISM_CDN_URL=https://srnarasim.github.io/DataPrism
VITE_DATAPRISM_VERSION=latest
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Demo App      │───▶│   CDN Loader    │───▶│  DataPrism CDN  │
│   (React/Vite)  │    │   (Runtime)     │    │  (GitHub Pages) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Interface│    │   Asset Cache   │    │   WASM Assets   │
│   Components    │    │   & Integrity   │    │   & Plugins     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components

- **CDN Configuration** (`src/config/cdn.ts`) - Centralized CDN settings
- **Asset Loader** (`src/utils/cdnLoader.ts`) - Handles CDN asset loading with fallbacks
- **DataPrism Context** (`src/contexts/DataPrismContext.tsx`) - React context for CDN-loaded DataPrism
- **CDN Status** (`src/components/CDNStatus.tsx`) - Real-time CDN status monitoring

## ⚡ Performance

The application meets the following performance targets:

- **CDN Asset Loading:** <5 seconds on modern broadband
- **Initial Render:** <2 seconds after CDN assets loaded  
- **Bundle Size:** <500KB for demo app code (excluding DataPrism)
- **Memory Usage:** <100MB demo app overhead

## 🧪 Sample Data

The demo includes three pre-loaded datasets:

1. **Sales Data** (1,000 records) - Regional sales transactions
2. **Analytics Data** (5,000 records) - User behavior and traffic analytics  
3. **Product Catalog** (200 records) - E-commerce product information

## 📱 Features

- **Data Explorer** - Import and analyze datasets
- **Query Lab** - Interactive SQL query interface
- **Visualization Studio** - Create charts and visualizations
- **Performance Dashboard** - Real-time metrics monitoring
- **Plugin Showcase** - Demonstrate extensible plugin system

## 🔒 Security

- **HTTPS Only** - All CDN requests over secure connections
- **Subresource Integrity** - Cryptographic validation of assets
- **Content Security Policy** - Strict CSP with CDN allowlist
- **CORS Compliance** - Proper cross-origin handling

## 📋 Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production  
npm run preview         # Preview production build

# Testing
npm run test            # Run test suite
npm run test:e2e        # End-to-end tests
npm run lint            # Code linting
npm run type-check      # TypeScript validation

# Deployment
npm run deploy          # Deploy to GitHub Pages
```

## 🚀 Deployment

The application uses GitHub Actions for automated deployment:

1. **Test** - Validates code quality and CDN connectivity
2. **Build** - Compiles application with bundle size validation
3. **Deploy** - Deploys to GitHub Pages 
4. **Validate** - Post-deployment health checks

Deploy URL: `https://yourusername.github.io/dataprism-demo-analytics`

## 🔧 Development

### Adding New Features

1. Create components in `src/components/`
2. Add pages to `src/pages/`
3. Use the `useDataPrism()` hook for engine access
4. Follow the existing patterns for error handling

### CDN Integration Best Practices

```typescript
import { useDataPrism } from '@/contexts/DataPrismContext';

function MyComponent() {
  const { isInitialized, query, engine } = useDataPrism();
  
  if (!isInitialized) {
    return <div>Loading DataPrism from CDN...</div>;
  }
  
  // Use engine safely here
  const handleQuery = async () => {
    const result = await query('SELECT * FROM sales LIMIT 10');
    // Handle result
  };
}
```

## 📖 Browser Support

- Chrome 90+ (✅ Full support)
- Firefox 88+ (✅ Full support)  
- Safari 14+ (✅ Limited threading)
- Edge 90+ (✅ Full support)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Related

- [DataPrism Core](https://github.com/dataprism/core) - Main DataPrism repository
- [DataPrism CDN](https://srnarasim.github.io/DataPrism/) - Official CDN deployment
- [Documentation](https://docs.dataprism.dev) - Complete documentation

---

This standalone demo showcases how external applications can integrate DataPrism via CDN, providing a blueprint for production deployments.