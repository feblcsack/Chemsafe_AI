# Testing & Verification Checklist

## 🎯 Overview
Comprehensive checklist untuk memastikan semua features berfungsi optimal sebelum production deployment.

---

## ✅ Frontend Testing

### 1. Landing Page
- [ ] Hero section loads dengan smooth animations
- [ ] All floating icons animating correctly
- [ ] Stats section displays dengan counter animations
- [ ] Feature cards responsive di semua breakpoints
- [ ] Testimonials section tampil sempurna
- [ ] CTA buttons working dan navigate correctly
- [ ] All hover effects smooth
- [ ] Scroll behavior smooth
- [ ] Mobile responsive (320px - 1920px)
- [ ] Dark theme consistent across all sections

### 2. GHS Scanner
- [ ] Camera permission dialog appears
- [ ] Video feed loads correctly
- [ ] Bounding boxes appear on detection
- [ ] Smooth box transitions working
- [ ] Safety score calculation accurate
- [ ] Expandable hazard cards functional
- [ ] AI similar products suggestions display
- [ ] PubChem data fetches correctly
- [ ] External links (OSHA, Poison Control) working
- [ ] Educational content displays before scan
- [ ] Emergency numbers clickable
- [ ] "Scan Another Product" resets properly
- [ ] Loading states appropriate
- [ ] Error handling graceful

**Test Cases:**
```
1. Scan product with single hazard
2. Scan product with multiple hazards
3. Test on mobile device
4. Test with poor lighting
5. Test offline functionality
```

### 3. IP Camera Support
- [ ] CameraSourceSelector displays all 5 types
- [ ] Device camera enumeration works
- [ ] IP camera URL testing functional
- [ ] RTSP stream configuration saves
- [ ] MJPEG stream works
- [ ] Phone camera (HTTP) connects
- [ ] Example URLs insertable
- [ ] Authentication field accepts input
- [ ] Camera type badges display
- [ ] Station cards show camera preview
- [ ] Active/inactive status updates
- [ ] Edit station preserves settings
- [ ] Delete station confirmation works

**Test Cases:**
```
1. Add USB camera station
2. Configure IP camera (http://192.168.1.x)
3. Test RTSP stream
4. Use phone as camera
5. Toggle station active/inactive
```

### 4. PPE Detection
- [ ] Camera stream loads
- [ ] FPS counter displays
- [ ] Bounding boxes render smoothly
- [ ] Corner accents visible
- [ ] Fade-out animation on lost detection
- [ ] Compliance badge updates correctly
- [ ] Person count accurate
- [ ] Violation alerts show
- [ ] Detection details panel updates
- [ ] Required PPE list displays
- [ ] Performance optimized (check FPS)
- [ ] Pauses when tab hidden
- [ ] Adaptive quality based on network
- [ ] Mobile performance acceptable

**Test Cases:**
```
1. Monitor with helmet only
2. Monitor without any PPE
3. Monitor with complete PPE
4. Test on slow network
5. Switch tabs and return
```

### 5. UI Components
- [ ] Loading spinners show correctly
- [ ] Toast notifications appear/disappear
- [ ] Tooltips position correctly
- [ ] Progress bars animate smoothly
- [ ] Empty states display properly
- [ ] Skeleton loaders visible during load
- [ ] Buttons have hover effects
- [ ] Cards have appropriate shadows
- [ ] Badges styled correctly
- [ ] Modals/dialogs functional

### 6. Accessibility
- [ ] Tab navigation works throughout
- [ ] Focus indicators visible
- [ ] Skip-to-content link functional
- [ ] Screen reader compatible
- [ ] High contrast mode supported
- [ ] Reduced motion respected
- [ ] Keyboard shortcuts work
- [ ] ARIA labels present
- [ ] Color contrast ratios pass WCAG AA
- [ ] Forms have proper labels

**Test Tools:**
```bash
# Lighthouse accessibility audit
lighthouse http://localhost:3000 --only-categories=accessibility

# axe DevTools
npm install -g @axe-core/cli
axe http://localhost:3000
```

### 7. Performance
- [ ] Page load time < 3s
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.8s
- [ ] Lighthouse score > 90
- [ ] Bundle size reasonable
- [ ] Images optimized (WebP/AVIF)
- [ ] Code splitting working
- [ ] Service worker registered
- [ ] Offline mode functional
- [ ] No console errors

**Test Commands:**
```bash
# Build and analyze
cd frontend
npm run build

# Check bundle size
npm run analyze

# Lighthouse audit
lighthouse http://localhost:3000 --view

# Performance profiling
# Open Chrome DevTools > Performance tab
```

---

## 🔧 Backend Testing

### 1. API Endpoints
- [ ] `/health` returns 200
- [ ] `/pubchem/lookup` returns hazard data
- [ ] `/zones` CRUD operations work
- [ ] `/scans/household` logs correctly
- [ ] `/camera/station/:id/latest` returns detection
- [ ] `/camera/start-monitoring` starts detection
- [ ] `/camera/stop-monitoring` stops detection
- [ ] `/ppe` WebSocket connects
- [ ] CORS headers configured
- [ ] Rate limiting working (if implemented)

**Test Commands:**
```bash
# Health check
curl http://localhost:8000/health

# Test PubChem lookup
curl -X POST http://localhost:8000/pubchem/lookup \
  -H "Content-Type: application/json" \
  -d '{"ghs_classes":["GHS_Symbol_FLAME"]}'

# API documentation
open http://localhost:8000/docs
```

### 2. Database Operations
- [ ] User registration works
- [ ] Login authentication successful
- [ ] RLS policies enforced
- [ ] Zones creation/update/delete work
- [ ] Worker check-in/out functional
- [ ] PPE events logged
- [ ] Real-time subscriptions work
- [ ] Query performance acceptable
- [ ] Indexes functioning
- [ ] No N+1 queries

**Test in Supabase Dashboard:**
```sql
-- Test RLS
SELECT * FROM zones;
SELECT * FROM worker_zone_map;
SELECT * FROM ppe_events;

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public';

-- Query performance
EXPLAIN ANALYZE 
SELECT * FROM zones WHERE org_id = 'xxx';
```

### 3. PPE Detection Backend
- [ ] ONNX model loads successfully
- [ ] Detection inference < 500ms
- [ ] WebSocket connection stable
- [ ] Frame processing efficient
- [ ] Camera stream proxy works
- [ ] Quality adjustment functional
- [ ] Multiple stations supported
- [ ] Memory usage acceptable
- [ ] No memory leaks
- [ ] Error handling robust

**Performance Test:**
```python
import time
import requests

# Test detection endpoint
start = time.time()
response = requests.get('http://localhost:8000/camera/station/123/latest')
print(f"Detection time: {time.time() - start:.3f}s")
```

---

## 🌐 Integration Testing

### 1. Frontend ↔ Backend
- [ ] API calls succeed
- [ ] Error responses handled
- [ ] Loading states show
- [ ] Success messages display
- [ ] Network errors caught
- [ ] Retry logic works
- [ ] Timeout handling appropriate
- [ ] Data synchronization correct

### 2. Frontend ↔ Supabase
- [ ] Auth flow complete
- [ ] Real-time updates work
- [ ] RLS policies respected
- [ ] Session persistence works
- [ ] Logout clears session
- [ ] Token refresh automatic

### 3. Backend ↔ Supabase
- [ ] Database queries successful
- [ ] Transactions atomic
- [ ] Connection pooling working
- [ ] Error logging functional

### 4. External Services
- [ ] PubChem API accessible
- [ ] ONNX CDN loads
- [ ] Supabase API responsive
- [ ] WebSocket connections stable

---

## 📱 Device Testing

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] iOS Safari
- [ ] Chrome Mobile
- [ ] Samsung Internet
- [ ] Firefox Mobile

### Screen Sizes
- [ ] 320px (iPhone SE)
- [ ] 375px (iPhone 12)
- [ ] 768px (iPad)
- [ ] 1024px (iPad Pro)
- [ ] 1440px (Desktop)
- [ ] 1920px (Full HD)

---

## 🚀 Deployment Verification

### Railway Backend
- [ ] Environment variables set
- [ ] Build succeeds
- [ ] Health check passes
- [ ] Logs accessible
- [ ] Metrics monitored
- [ ] Auto-restart configured
- [ ] Domain connected (if applicable)
- [ ] SSL certificate valid

**Verify:**
```bash
# Check deployment
curl https://your-backend.railway.app/health

# Check logs
railway logs

# Monitor metrics
railway metrics
```

### Vercel Frontend
- [ ] Build succeeds
- [ ] Environment variables set
- [ ] Preview deployments work
- [ ] Production domain configured
- [ ] Analytics enabled
- [ ] Edge functions working (if used)
- [ ] Image optimization enabled

**Verify:**
```bash
# Check deployment
curl https://your-frontend.vercel.app

# Vercel CLI
vercel logs
```

---

## 🔒 Security Testing

### Authentication
- [ ] Password requirements enforced
- [ ] Session timeout works
- [ ] JWT tokens secure
- [ ] Refresh tokens rotate
- [ ] Logout invalidates session
- [ ] No tokens in localStorage (use httpOnly cookies)

### Authorization
- [ ] RLS policies prevent unauthorized access
- [ ] Admin routes protected
- [ ] Worker routes protected
- [ ] API endpoints require auth
- [ ] CORS configured correctly

### Data Protection
- [ ] Sensitive data encrypted
- [ ] SQL injection prevented
- [ ] XSS attacks mitigated
- [ ] CSRF protection enabled
- [ ] Input validation working
- [ ] Output encoding correct

**Security Scan:**
```bash
# OWASP ZAP scan
zap-cli quick-scan http://localhost:3000

# npm audit
cd frontend && npm audit
cd backend && pip-audit
```

---

## 📊 Performance Benchmarks

### Frontend Targets
- Lighthouse Score: **> 90**
- First Contentful Paint: **< 1.8s**
- Time to Interactive: **< 3.8s**
- Largest Contentful Paint: **< 2.5s**
- Cumulative Layout Shift: **< 0.1**
- First Input Delay: **< 100ms**

### Backend Targets
- Health check response: **< 100ms**
- API response time: **< 500ms**
- PPE detection: **< 500ms**
- Database query: **< 100ms**
- WebSocket latency: **< 50ms**

### Resource Targets
- Bundle size (gzipped): **< 200KB**
- Initial JS: **< 150KB**
- Image sizes: **< 500KB each**
- API payload: **< 1MB**
- Memory usage: **< 512MB**
- CPU usage: **< 50%**

---

## 🐛 Bug Testing Scenarios

### Edge Cases
- [ ] Empty states handled
- [ ] No camera access handled
- [ ] No internet connection
- [ ] Slow network (3G simulation)
- [ ] Very large images
- [ ] Rapid button clicking
- [ ] Concurrent operations
- [ ] Session expiry during action
- [ ] Browser back button
- [ ] Page refresh mid-operation

### Error Scenarios
- [ ] 404 pages functional
- [ ] 500 errors caught
- [ ] Network timeout
- [ ] Invalid form input
- [ ] File upload errors
- [ ] Camera stream errors
- [ ] Database connection lost
- [ ] API rate limit hit
- [ ] WebSocket disconnect
- [ ] Out of memory

---

## ✅ Pre-Production Checklist

### Code Quality
- [ ] No console.logs in production
- [ ] No TODO/FIXME comments
- [ ] No commented-out code
- [ ] Error boundaries implemented
- [ ] Loading states everywhere
- [ ] Error messages user-friendly
- [ ] Code formatted consistently
- [ ] TypeScript errors resolved
- [ ] Linter warnings addressed

### Documentation
- [ ] README.md complete
- [ ] API documentation updated
- [ ] Environment variables documented
- [ ] Deployment guide current
- [ ] Security guide reviewed
- [ ] Performance guide available
- [ ] User guides written
- [ ] Changelog maintained

### Monitoring
- [ ] Error tracking setup (Sentry/etc)
- [ ] Analytics configured
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring active
- [ ] Alerts configured
- [ ] Logs aggregated
- [ ] Backup strategy defined

---

## 🎉 Final Verification

Sebelum launch, pastikan:

1. **Functionality**: ✅ All features working as expected
2. **Performance**: ✅ Meets or exceeds benchmarks
3. **Security**: ✅ No critical vulnerabilities
4. **Accessibility**: ✅ WCAG AA compliant
5. **Mobile**: ✅ Works on all devices
6. **Documentation**: ✅ Complete and current
7. **Monitoring**: ✅ All systems configured
8. **Backup**: ✅ Strategy in place

---

## 📝 Testing Log Template

```markdown
## Test Session: [Date]
**Tester:** [Name]
**Environment:** [Dev/Staging/Prod]
**Browser:** [Chrome 120]
**Device:** [MacBook Pro M1]

### Tests Executed
- [ ] Landing page load
- [ ] GHS Scanner functionality
- [ ] PPE Detection
- [ ] ...

### Issues Found
1. [Issue description]
   - Severity: High/Medium/Low
   - Steps to reproduce
   - Expected vs Actual
   - Screenshots

### Performance Metrics
- Page load: 2.3s
- Lighthouse: 94
- API response: 234ms

### Notes
[Additional observations]
```

---

## 🔄 Continuous Testing

### Automated Tests (Future)
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Visual regression
npm run test:visual
```

### CI/CD Pipeline
- [ ] Tests run on every commit
- [ ] Lighthouse in CI
- [ ] Security scans automated
- [ ] Deploy previews generated
- [ ] Auto-rollback on failures

---

**Testing Status**: 🟡 In Progress

**Last Updated**: [Current Date]

**Next Review**: Before Production Deployment
