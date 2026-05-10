# QPay Testing & Validation Guide

Complete guide for running all tests before production launch.

## Prerequisites

```bash
# Install all dependencies
pnpm install

# Install testing tools
pnpm add -D @playwright/test k6 vitest @vitest/ui

# Install production dependencies
pnpm add bcrypt jsonwebtoken pg stripe nodemailer twilio @sentry/node
```

## 1. Unit Tests

### Run Unit Tests
```bash
pnpm test
```

Tests cover:
- Service methods
- Utility functions
- Data transformations
- Validation logic

### With UI
```bash
pnpm vitest --ui
```

Open http://localhost:51204 to view test results

---

## 2. E2E Tests (Playwright)

### Run All E2E Tests
```bash
pnpm exec playwright test
```

### Run Specific Test
```bash
pnpm exec playwright test tests/e2e/payment-flow.spec.ts
```

### Run in UI Mode
```bash
pnpm exec playwright test --ui
```

### Debug Mode
```bash
pnpm exec playwright test --debug
```

### Headed Mode (See Browser)
```bash
pnpm exec playwright test --headed
```

### Generate Report
```bash
pnpm exec playwright show-report
```

**What's Tested:**
- ✅ Complete merchant registration flow
- ✅ Payment processing (EMV, 3D Secure, contactless)
- ✅ Transaction refunds
- ✅ Settlement calculation
- ✅ Alert configuration
- ✅ Digital invoice generation
- ✅ API key management

**Expected Duration:** 2-3 minutes

---

## 3. Load Testing (k6)

### Prerequisites
Download k6 from https://k6.io/docs/getting-started/installation/

### Run Load Test
```bash
k6 run tests/load/k6-load-test.js
```

### With Custom Settings
```bash
k6 run -e TEST_RUN_ID=001 tests/load/k6-load-test.js
```

### Distributed Load Testing
```bash
k6 run -u 100 -d 5m tests/load/k6-load-test.js
```

**Test Stages:**
1. Ramp up to 10 users (30 seconds)
2. Ramp up to 50 users (1.5 minutes)
3. Ramp up to 100 users (2 minutes)
4. Maintain 100 users (1 minute)
5. Ramp down to 0 (30 seconds)

**Thresholds:**
- 95th percentile latency < 500ms
- 99th percentile latency < 1000ms
- Error rate < 10%

**Expected Duration:** 5-6 minutes

**Success Criteria:**
- ✅ All thresholds passed
- ✅ Error rate < 1%
- ✅ P95 latency < 200ms
- ✅ No timeouts

---

## 4. Security Audit

### Security Checks
```bash
# NPM audit
npm audit

# Check for vulnerabilities
npm audit --audit-level=moderate

# OWASP dependency check (if installed)
npm run security:check
```

### Security Headers Validation
```bash
curl -I https://localhost:8080
```

Expected headers:
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Content-Security-Policy: ...
- ✅ Strict-Transport-Security: ...
- ✅ Referrer-Policy: strict-origin-when-cross-origin

### Manual Security Testing
- [ ] Test SQL injection on login
- [ ] Test XSS in form fields
- [ ] Test CSRF token validation
- [ ] Test rate limiting
- [ ] Test authentication bypass
- [ ] Test authorization bypass
- [ ] Test sensitive data exposure

---

## 5. Integration Tests

Create `tests/integration/` directory:

```bash
mkdir -p tests/integration
```

### Test Database Connection
```bash
npm run test:db
```

Verifies:
- ✅ PostgreSQL connection
- ✅ Schema creation
- ✅ Table structure

### Test Email Service
```bash
npm run test:email
```

Verifies:
- ✅ SMTP configuration
- ✅ Email sending
- ✅ Template rendering

### Test Stripe Integration
```bash
npm run test:stripe
```

Verifies:
- ✅ API key validity
- ✅ Test charges
- ✅ Refund processing

---

## 6. Performance Testing

### Database Performance
```bash
# Analyze slow queries
psql -U qpay_admin -d qpay_production -c "\dt+"

# Check index usage
psql -U qpay_admin -d qpay_production -c "SELECT * FROM pg_stat_user_indexes;"
```

### Memory Usage
```bash
# Monitor while running
watch -n 1 'ps aux | grep node'

# Get detailed memory stats
node --max-old-space-size=4096 npm start
```

### API Response Times
Check logs or Sentry dashboard:
```
POST /api/transactions/process: 245ms
GET /api/transactions: 89ms
POST /api/settlements/calculate: 340ms
```

---

## 7. Compliance Validation

### PCI-DSS Checklist
- [ ] No plaintext card storage
- [ ] Card data encrypted (AES-256)
- [ ] HTTPS enforced
- [ ] Access controls in place
- [ ] Audit logging enabled
- [ ] Vulnerability scanning done

### GDPR Checklist
- [ ] User consent logged
- [ ] Data retention policy set
- [ ] Right to be forgotten available
- [ ] Data portability available
- [ ] Privacy policy updated

### SOC 2 Checklist
- [ ] Security controls documented
- [ ] Access controls implemented
- [ ] Change management process
- [ ] Incident response plan
- [ ] Monitoring in place

---

## 8. Pre-Launch Checklist

### Code Quality
- [ ] No console.log statements left
- [ ] No TODO comments in critical paths
- [ ] No hardcoded secrets
- [ ] No unused variables or imports
- [ ] TypeScript: no `any` types where avoidable

### Testing
- [ ] All E2E tests passing
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Load test thresholds met
- [ ] Security tests passed

### Configuration
- [ ] Production env variables set
- [ ] Database configured
- [ ] Stripe connected (live keys)
- [ ] Email service working
- [ ] SMS service working
- [ ] Monitoring enabled (Sentry)

### Documentation
- [ ] API docs updated
- [ ] Deployment guide completed
- [ ] Runbook created
- [ ] Incident response plan documented
- [ ] Support procedures defined

### Infrastructure
- [ ] SSL certificate valid
- [ ] Database backups configured
- [ ] Monitoring dashboards set up
- [ ] Alerting rules configured
- [ ] Log aggregation working

### Sign-offs
- [ ] Technical lead approval
- [ ] Security team approval
- [ ] Operations team approval
- [ ] Legal team approval
- [ ] Business owner approval

---

## 9. Soft Launch (Pilot Program)

### Phase 1: 5-10 Merchants
1. Manual onboarding
2. 24/7 monitoring
3. Daily check-ins
4. Capture feedback
5. Fix critical issues

**Duration:** 1 week

### Phase 2: 50-100 Merchants
1. Self-service onboarding
2. Automated monitoring
3. Support team training
4. Gather metrics
5. Optimize processes

**Duration:** 2 weeks

### Phase 3: Full Launch
1. Marketing campaign
2. Sales enablement
3. Support documentation
4. Status page
5. Scaling infrastructure

---

## 10. Monitoring After Launch

### Daily Checks
- [ ] Error rate < 0.1%
- [ ] P95 latency < 500ms
- [ ] Zero critical alerts
- [ ] Customer complaints: 0
- [ ] Database health: good

### Weekly Checks
- [ ] No security vulnerabilities
- [ ] No failed settlements
- [ ] Customer satisfaction > 95%
- [ ] System availability > 99.9%
- [ ] Review logs for patterns

### Monthly Checks
- [ ] Security audit
- [ ] Performance analysis
- [ ] Capacity planning
- [ ] Feature requests review
- [ ] Compliance verification

---

## Troubleshooting

### E2E Tests Timing Out
```bash
# Increase timeout
pnpm exec playwright test --timeout=30000
```

### Load Test Errors
```bash
# Check if port is available
lsof -i :8080

# Check database connection
psql -U qpay_admin -d qpay_production -c "SELECT 1"
```

### Email Test Failing
```bash
# Check SMTP configuration
npm run test:email --verbose

# Verify credentials in .env
grep SMTP .env.production
```

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| E2E Test Pass Rate | 100% | - |
| Load Test P95 | <500ms | - |
| Load Test Error Rate | <1% | - |
| Security Audit | 0 Critical | - |
| Code Coverage | >80% | - |
| API Uptime | >99.9% | - |

---

**Ready for Launch:** All items checked ✅

Document created: January 2024
