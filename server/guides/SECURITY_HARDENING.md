# Advanced Security Hardening Guide

## Overview
This guide provides comprehensive security hardening strategies for QPay to achieve enterprise-grade security standards.

## OWASP Top 10 Protection Strategies

### A01: Broken Access Control

**Implementation:**
```typescript
// Always validate user permissions before resource access
function validateAccess(user: User, resource: any): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.id === resource.userId && user.permissions.includes(resource.type);
}

// Use role-based access control (RBAC)
enum Roles {
  USER = 'user',
  MERCHANT = 'merchant',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// Check permissions before each operation
middleware.checkPermission('transactions:read', (req, res, next) => {
  if (req.user.permissions.includes('transactions:read')) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
});
```

**Best Practices:**
- Implement principle of least privilege
- Deny by default, allow explicitly
- Validate access on both frontend and backend
- Audit all access attempts

---

### A02: Cryptographic Failures

**Encryption at Rest:**
```typescript
// Use AES-256-GCM for sensitive data
const encryptData = (plaintext: string, key: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key), iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};
```

**Encryption in Transit:**
```typescript
// Enforce HTTPS with strong TLS
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block'
};
```

**Best Practices:**
- Never store passwords in plaintext (use Argon2ID)
- Use strong key management
- Rotate encryption keys regularly
- Use authenticated encryption (GCM mode)

---

### A03: Injection

**SQL Injection Prevention:**
```typescript
// ❌ Vulnerable
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ Safe - Use parameterized queries
const query = 'SELECT * FROM users WHERE email = $1';
const user = await db.query(query, [email]);
```

**NoSQL Injection Prevention:**
```typescript
// ❌ Vulnerable
const user = await db.collection('users').findOne({ email: req.body.email });

// ✅ Safe - Validate input first
const email = validator.isEmail(req.body.email) ? req.body.email : null;
const user = await db.collection('users').findOne({ email });
```

**Best Practices:**
- Always use parameterized queries
- Validate and sanitize all inputs
- Use whitelisting for dynamic values
- Implement input length limits

---

### A04: Insecure Design

**Secure API Design:**
```typescript
// Define security requirements upfront
const apiSecurityRequirements = {
  authentication: 'required',
  authorization: 'role-based',
  encryption: 'aes-256-gcm',
  rateLimit: '1000 requests/15 min',
  logging: 'all operations',
  monitoring: '24/7'
};

// Implement threat modeling
const threatModel = {
  maliciousUser: 'prevent unauthorized access',
  dataLeak: 'encrypt all sensitive data',
  ddos: 'rate limiting and load balancing',
  apiAbuse: 'API key rotation and monitoring'
};
```

**Best Practices:**
- Implement threat modeling
- Design security from the start
- Use established frameworks and patterns
- Regular security reviews

---

### A05: Security Misconfiguration

**Production Configuration Checklist:**
```typescript
const securityConfig = {
  // Environment
  NODE_ENV: 'production',
  DEBUG: false,
  LOG_LEVEL: 'info', // Not 'debug'
  
  // Database
  DB_SSL: true,
  DB_POOL_MIN: 5,
  DB_POOL_MAX: 20,
  
  // API
  API_RATE_LIMIT: 1000,
  API_TIMEOUT: 30000,
  
  // Security
  JWT_EXPIRE: '24h',
  SESSION_TIMEOUT: 1800000,
  CORS_WHITELIST: ['https://qpay.io'],
  
  // Encryption
  ENCRYPTION_ALGORITHM: 'aes-256-gcm',
  HASH_ALGORITHM: 'argon2id',
  
  // Headers
  HSTS_MAX_AGE: 31536000,
  CSP: "default-src 'self'",
};
```

**Best Practices:**
- Use environment variables for secrets
- Never log sensitive data
- Disable default credentials
- Remove unused features

---

### A06: Vulnerable Components

**Dependency Management:**
```bash
# Regular audits
npm audit

# Update dependencies
npm update

# Check for outdated packages
npm outdated

# Lock dependencies in production
npm ci
```

**Best Practices:**
- Regular dependency audits
- Keep dependencies up-to-date
- Use specific versions in production
- Monitor security advisories

---

### A07: Authentication

**Secure Authentication Implementation:**
```typescript
// Password hashing with Argon2ID
const hashPassword = async (password: string): Promise<string> => {
  const salt = crypto.randomBytes(16);
  return argon2.hash(password, {
    type: argon2.argon2id,
    timeCost: 2,
    memoryCost: 65536,
    parallelism: 1,
    salt: salt,
  });
};

// JWT with proper expiration
const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId, iat: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: '24h', algorithm: 'HS256' }
  );
};

// 2FA with TOTP
const generateTOTP = (secret: string): string => {
  const token = speakeasy.totp({
    secret: secret,
    encoding: 'base32',
    time: Math.floor(Date.now() / 1000),
  });
  return token;
};
```

**Best Practices:**
- Enforce strong passwords
- Implement 2FA/MFA
- Use proper token expiration
- Log authentication attempts

---

### A08: Software/Data Integrity Failures

**Verify Data Integrity:**
```typescript
// Implement HMAC signatures
const createSignature = (data: string, secret: string): string => {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
};

const verifySignature = (data: string, signature: string, secret: string): boolean => {
  const expected = createSignature(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
};

// Verify webhook authenticity
app.post('/webhooks', (req, res) => {
  const signature = req.headers['x-signature'];
  const data = JSON.stringify(req.body);
  
  if (!verifySignature(data, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  processWebhook(req.body);
});
```

**Best Practices:**
- Use cryptographic signatures
- Verify source integrity
- Implement version control
- Use secure update mechanisms

---

### A09: Logging & Monitoring

**Comprehensive Logging:**
```typescript
// Log all security events
function logSecurityEvent(event: {
  type: 'access' | 'modification' | 'authentication' | 'error';
  userId?: string;
  resource: string;
  action: string;
  status: 'success' | 'failure';
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}) {
  const logEntry = {
    ...event,
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
  };
  
  // Log to file and monitoring service
  logger.info(JSON.stringify(logEntry));
  
  // Alert on critical events
  if (event.type === 'authentication' && event.status === 'failure') {
    alerting.sendAlert('Failed authentication attempt', logEntry);
  }
}

// Monitor for suspicious patterns
function detectAnomalies(logs: SecurityLog[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  
  // Multiple failed logins from same IP
  const failedLogins = logs.filter(l => l.type === 'authentication' && l.status === 'failure');
  const ipCounts = new Map();
  
  failedLogins.forEach(log => {
    ipCounts.set(log.ipAddress, (ipCounts.get(log.ipAddress) || 0) + 1);
  });
  
  // Alert if > 5 failures from same IP
  ipCounts.forEach((count, ip) => {
    if (count > 5) {
      anomalies.push({
        type: 'brute_force_attempt',
        severity: 'high',
        details: `${count} failed logins from ${ip}`,
      });
    }
  });
  
  return anomalies;
}
```

**Best Practices:**
- Log all security events
- Include context (user, IP, timestamp)
- Monitor for anomalies
- Set up real-time alerts

---

### A10: SSRF (Server-Side Request Forgery)

**Prevent SSRF Attacks:**
```typescript
const validateExternalURL = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    
    // Blocked hosts
    const blockedHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '169.254.169.254', // AWS metadata
      '[::1]', // IPv6 localhost
    ];
    
    // Blocked protocols
    const blockedProtocols = ['file://', 'gopher://', 'ftp://'];
    
    if (blockedHosts.includes(parsed.hostname)) return false;
    if (blockedProtocols.some(p => url.startsWith(p))) return false;
    
    // Verify it's not an internal IP range
    if (/^(10\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[01]\.|192\.168\.)/.test(parsed.hostname)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};
```

**Best Practices:**
- Whitelist allowed hosts
- Block internal IP ranges
- Validate URL schemes
- Use DNS rebinding protection

---

## Security Headers Implementation

Add these headers to all responses:

```typescript
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // CSP
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
  ].join('; '));
  
  // HSTS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  next();
});
```

---

## Rate Limiting Strategy

```typescript
// Different limits for different endpoints
const rateLimiters = {
  // General API: 1000 req/15 min
  api: { windowMs: 15*60*1000, max: 1000 },
  
  // Auth: 5 attempts/15 min
  auth: { windowMs: 15*60*1000, max: 5 },
  
  // Payment: 100 req/min
  payment: { windowMs: 60*1000, max: 100 },
  
  // Search: 30 req/min
  search: { windowMs: 60*1000, max: 30 },
};
```

---

## Compliance Checklist

### PCI DSS Level 1
- [ ] Install and maintain firewall
- [ ] Do not use vendor-supplied defaults
- [ ] Protect stored cardholder data
- [ ] Encrypt transmission of cardholder data
- [ ] Protect systems against malware
- [ ] Develop and maintain secure systems
- [ ] Restrict access to cardholder data
- [ ] Assign unique ID to each person
- [ ] Restrict physical access
- [ ] Track and monitor access to network
- [ ] Test security systems regularly
- [ ] Maintain security policy

### GDPR
- [ ] Data encryption enabled
- [ ] User consent documented
- [ ] Privacy policy published
- [ ] Data export capability
- [ ] Data deletion capability
- [ ] Right to be forgotten implemented
- [ ] DPA in place

---

## Security Testing

```bash
# OWASP ZAP scan
zaproxy.sh -cmd -quickurl http://localhost:3000

# Dependency audit
npm audit

# Code security scan
snyk test

# Container security
trivy image qpay:latest
```

---

## Incident Response Plan

1. **Detection**: Monitor logs and alerts
2. **Containment**: Isolate affected systems
3. **Investigation**: Determine scope and impact
4. **Communication**: Notify affected users
5. **Recovery**: Restore systems from backups
6. **Analysis**: Root cause analysis
7. **Prevention**: Implement preventive measures

