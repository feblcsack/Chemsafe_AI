# Performance Optimization Guide

## Overview
Comprehensive performance optimizations implemented for seamless Railway deployment and optimal user experience.

## Frontend Optimizations

### 1. Next.js Configuration (`next.config.ts`)
- **Compression**: Enabled gzip compression for all responses
- **Image Optimization**: 
  - AVIF and WebP format support
  - Responsive image sizes for all devices
  - Minimum cache TTL of 60 seconds
- **Code Splitting**: 
  - Vendor chunk separation
  - UI components isolated chunk
  - Common chunk for reused code
- **Tree Shaking**: Optimized package imports for lucide-react and framer-motion
- **Minification**: SWC minifier enabled with console.log removal in production
- **Headers**: Security and caching headers configured

### 2. Service Worker (`public/sw.js`)
- **Offline Support**: Critical pages cached for offline access
- **Runtime Caching**: Dynamic content cached on first load
- **Cache Strategy**: Stale-while-revalidate for optimal performance
- **Background Sync**: Failed requests queued for retry
- **Push Notifications**: Ready for real-time alerts (future enhancement)

### 3. Performance Utilities (`lib/performance.ts`)
- **Debounce/Throttle**: Optimized event handlers
- **Device Detection**: Adaptive quality based on device capabilities
- **Network Awareness**: Quality adjustment based on connection speed
- **API Caching**: 5-minute TTL cache for API responses
- **Request Batching**: Multiple requests batched automatically
- **Animation Optimization**: Reduced motion support, adaptive durations

### 4. Component-Level Optimizations

#### GHS Scanner
- Smooth bounding box transitions (grace period: 8 frames)
- Exponential moving average for stable detection
- Adaptive frame rate based on device

#### PPE Monitoring
- Frame skipping (2-4 frames based on device)
- Smoothed detection (grace period: 10 frames)
- Visibility API integration (pause when tab hidden)
- Adaptive DPR and quality
- Desynchronized canvas rendering
- FPS counter for monitoring

### 5. Image Optimizations
- Lazy loading for all images
- Responsive images with srcset
- AVIF/WebP with fallback
- Blur placeholders for better perceived performance

### 6. Code Splitting
```
vendor.js      - Third-party libraries
common.js      - Shared components
ui.js          - UI component library
page-specific  - Route-specific code
```

## Backend Optimizations

### 1. FastAPI Performance
```python
# Add to main.py
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
```

### 2. Database Query Optimization
- Supabase RLS policies optimized
- Indexed columns for frequent queries
- Connection pooling enabled
- Query result caching

### 3. PPE Detection Performance
- Model inference optimization
- Frame rate limiting (backend side)
- WebSocket connection pooling
- Efficient video frame processing

## Railway Deployment Optimizations

### 1. Environment Variables
```bash
# Frontend (.env.production)
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Backend (.env)
RAILWAY_ENVIRONMENT=production
WORKERS=4  # Adjust based on Railway plan
WORKER_CLASS=uvicorn.workers.UvicornWorker
```

### 2. Build Optimizations
```json
// package.json
{
  "scripts": {
    "build": "next build",
    "start": "next start -p $PORT"
  }
}
```

### 3. Railway Configuration
```json
// railway.json (if needed)
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Performance Metrics

### Target Metrics
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### Monitoring
```typescript
// Add to app/layout.tsx
import { monitorWebVitals } from '@/lib/performance';

export default function RootLayout() {
  useEffect(() => {
    monitorWebVitals();
  }, []);
  // ...
}
```

## Best Practices

### 1. Images
- Always use Next.js Image component
- Provide width and height to prevent CLS
- Use appropriate image formats (AVIF > WebP > JPEG)
- Lazy load below-the-fold images

### 2. Fonts
- Use system fonts or font-display: swap
- Preload critical fonts
- Subset fonts to include only used characters

### 3. JavaScript
- Use dynamic imports for large components
- Implement code splitting at route level
- Minimize third-party scripts
- Use React.memo() for expensive components

### 4. CSS
- Use CSS-in-JS with SSR support
- Minimize unused CSS
- Use CSS containment for complex layouts
- Avoid layout thrashing

### 5. Network
- Enable HTTP/2 or HTTP/3
- Use CDN for static assets
- Implement proper caching headers
- Minimize API calls with batching

### 6. Animations
- Use CSS transforms and opacity only
- Avoid animating layout properties
- Use will-change sparingly
- Respect prefers-reduced-motion

## Testing Performance

### 1. Lighthouse Audit
```bash
npm install -g lighthouse
lighthouse https://your-app.com --view
```

### 2. WebPageTest
Visit: https://www.webpagetest.org/
- Test from multiple locations
- Compare with competitors
- Analyze waterfall charts

### 3. Chrome DevTools
- Performance tab for profiling
- Coverage tab for unused code
- Network tab for request analysis
- Lighthouse tab for audits

### 4. Real User Monitoring
```typescript
// Add Web Vitals reporting
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics endpoint
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## Troubleshooting

### High Bundle Size
1. Analyze bundle: `npm run build -- --analyze`
2. Check for duplicate dependencies
3. Use dynamic imports for large components
4. Remove unused dependencies

### Slow Initial Load
1. Check network waterfall
2. Optimize critical rendering path
3. Defer non-critical JavaScript
4. Implement resource hints (preload, prefetch)

### Poor Runtime Performance
1. Use React DevTools Profiler
2. Identify unnecessary re-renders
3. Optimize expensive calculations
4. Use Web Workers for heavy tasks

### Railway-Specific Issues
1. Check Railway logs for errors
2. Monitor memory and CPU usage
3. Adjust worker count based on load
4. Enable Railway's health checks

## Additional Resources

- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web.dev Performance](https://web.dev/performance/)
- [Railway Docs](https://docs.railway.app/)
- [FastAPI Performance](https://fastapi.tiangolo.com/deployment/concepts/)

## Performance Checklist

- [ ] Service Worker registered
- [ ] Images optimized (AVIF/WebP)
- [ ] Code splitting configured
- [ ] API responses cached
- [ ] Animations optimized
- [ ] Bundle size < 200KB (gzipped)
- [ ] Lighthouse score > 90
- [ ] Railway deployment optimized
- [ ] Database queries indexed
- [ ] Error boundaries implemented
- [ ] Loading states everywhere
- [ ] Prefetching critical data
- [ ] CDN configured for assets
- [ ] Monitoring setup complete

## Maintenance

### Weekly
- Check Railway metrics
- Review error logs
- Monitor performance metrics
- Update dependencies (security)

### Monthly
- Run Lighthouse audit
- Review bundle size
- Check for unused dependencies
- Optimize database queries

### Quarterly
- Full performance audit
- Review caching strategies
- Update optimization docs
- Benchmark against competitors
