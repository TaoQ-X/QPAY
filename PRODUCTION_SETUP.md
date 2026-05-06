# QPay Production Deployment Guide

Complete checklist for deploying QPay to production with real payments and full compliance.

## Phase 1: Database Setup (2-3 hours)

### PostgreSQL Installation
```bash
# Install PostgreSQL 14+
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql postgresql-contrib
# Windows: Download from https://www.postgresql.org/download/windows/

# Create production database
createdb qpay_production
createuser qpay_admin --password

# Initialize schema
psql -U qpay_admin -d qpay_production -f server/database/schema.sql

# Verify installation
psql -U qpay_admin -d qpay_production -c "SELECT version();"
```

### Environment Configuration
```bash
# Copy example env file
cp .env.example .env.production

# Edit with production values
nano .env.production

# Required environment variables:
- DATABASE_URL=postgresql://qpay_admin:password@localhost:5432/qpay_production
- JWT_SECRET=<generate-strong-random-key>
- STRIPE_SECRET_KEY=sk_live_xxxxx
- SMTP_USER=your-email@gmail.com
- SMTP_PASSWORD=app-specific-password
```

## Phase 2: Stripe Integration (1-2 hours)

### Stripe Account Setup
1. Create Stripe account at https://stripe.com/
2. Go to Developers → API Keys
3. Copy Live Secret Key (`sk_live_xxxxx`)
4. Copy Publishable Key (`pk_live_xxxxx`)
5. Create webhook endpoint:
   - Go to Developers → Webhooks
   - Click "Add endpoint"
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to listen:
     - `charge.succeeded`
     - `charge.failed`
     - `charge.refunded`
     - `charge.dispute.created`
     - `payout.paid`
6. Copy Webhook Secret (`whsec_xxxxx`)

### Environment Setup
```bash
STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Banking Integration
1. In Stripe Dashboard → Settings → Bank Accounts
2. Add your business bank account
3. Verify with test deposits (2 micro-deposits)
4. Enable transfers to bank account

## Phase 3: Email & SMS (1 hour)

### Email Configuration (Gmail)
1. Enable 2-Step Verification
2. Create App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy generated password

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=<16-char-app-password>
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

### SMS Configuration (Twilio)
1. Create account at https://www.twilio.com/
2. Go to Console → Account
3. Copy Account SID and Auth Token
4. Get a phone number

```bash
TWILIO_ACCOUNT_SID=AC_xxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

## Phase 4: Security Hardening (2 hours)

### SSL/TLS Certificate
```bash
# Using Let's Encrypt (recommended, free)
sudo apt-get install certbot
sudo certbot certonly --standalone -d yourdomain.com
# Add to nginx/reverse proxy config
```

### Database Security
```bash
# Create strong password for qpay_admin user
ALTER USER qpay_admin PASSWORD 'strong-password-here';

# Restrict connections to localhost only (via pg_hba.conf)
# Or use connection pooling with PgBouncer
```

### Application Security
```bash
# Generate strong secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to environment:
JWT_SECRET=<generate-and-store-securely>
REFRESH_TOKEN_SECRET=<generate-and-store-securely>
SESSION_SECRET=<generate-and-store-securely>
```

### Environment Protection
```bash
# .env.production should NEVER be committed to git
# Store secrets in:
# - Environment variables on server
# - Secrets manager (AWS Secrets Manager, HashiCorp Vault)
# - .env.production (local only, in .gitignore)

echo ".env.production" >> .gitignore
```

## Phase 5: Dependencies Installation (30 mins)

### Install npm dependencies
```bash
npm install bcrypt
npm install jsonwebtoken
npm install stripe
npm install nodemailer
npm install twilio
npm install pg
npm install cors
npm install helmet
npm install express-rate-limit
```

### Verify Packages
```bash
npm audit
npm audit fix  # For non-breaking fixes only
```

## Phase 6: Testing (1-2 hours)

### Database Connection Test
```bash
npm run test:db
# Verify all migrations pass
```

### Stripe Test
```bash
# Use Stripe test keys first
STRIPE_SECRET_KEY=sk_test_xxxxx

# Test payment processing
npm run test:stripe
```

### Email Test
```bash
npm run test:email
# Check inbox for verification email
```

### API Endpoint Tests
```bash
npm run test:api

# Key endpoints to test:
GET  /api/health                    # Health check
POST /api/auth/register             # User registration
POST /api/auth/login                # User login
POST /api/payments/process          # Payment processing
POST /api/settlements/calculate     # Settlement calculation
```

## Phase 7: Monitoring & Logging (1 hour)

### Error Tracking (Sentry)
1. Create account at https://sentry.io/
2. Create project for Node.js
3. Copy DSN

```bash
npm install @sentry/node
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### Logging
```bash
# Create logs directory
mkdir -p logs

# Application logs should go to:
logs/error.log       # Errors only
logs/access.log      # All requests
logs/payment.log     # Payment transactions
```

## Phase 8: Deployment

### Option 1: Docker
```dockerfile
# Create Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production
EXPOSE 8080
CMD ["npm", "start"]
```

```bash
# Build and push
docker build -t qpay:latest .
docker push youregistry.com/qpay:latest
```

### Option 2: Traditional Server
```bash
# Install Node.js LTS
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone <repo> /var/www/qpay
cd /var/www/qpay

# Install dependencies
npm ci --only=production

# Build TypeScript
npm run build

# Setup systemd service
sudo nano /etc/systemd/system/qpay.service
```

### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req zone=api burst=200 nodelay;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Phase 9: PCI-DSS Compliance

### Compliance Checklist
- [ ] All card data encrypted in transit (TLS 1.2+)
- [ ] All card data encrypted at rest
- [ ] Card tokens used instead of raw card numbers
- [ ] Regular security scans enabled
- [ ] Firewalls configured
- [ ] Access controls implemented
- [ ] Database access logged
- [ ] Annual penetration testing scheduled
- [ ] Vulnerability scanning in place

### Audit Trail
```bash
# Enable database logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
SELECT pg_reload_conf();
```

## Phase 10: Backup & Disaster Recovery

### Automated Backups
```bash
# PostgreSQL daily backup script
# Create backup_database.sh

#!/bin/bash
BACKUP_DIR="/var/backups/qpay"
DB_NAME="qpay_production"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

pg_dump -U qpay_admin $DB_NAME | gzip > $BACKUP_DIR/qpay_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Schedule with cron
# 0 2 * * * /usr/local/bin/backup_database.sh
```

### Restore Procedure
```bash
# Restore from backup
gzip -dc /var/backups/qpay/qpay_20240101_020000.sql.gz | psql -U qpay_admin qpay_production
```

## Phase 11: Go-Live Checklist

- [ ] Database configured and tested
- [ ] Stripe account connected and tested
- [ ] Email/SMS configured and tested
- [ ] SSL certificate installed
- [ ] All environment variables set
- [ ] Database backups running
- [ ] Error monitoring configured
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Logging configured
- [ ] DNS pointing to production server
- [ ] Firewall rules configured
- [ ] Initial merchants onboarded
- [ ] Support team trained
- [ ] Runbook documented
- [ ] Incident response plan ready

## Monitoring & Maintenance

### Daily Tasks
```bash
# Check error logs
tail -f logs/error.log

# Check Stripe dashboard for failed transactions
# Check email delivery status
# Monitor server resources
```

### Weekly Tasks
- Review transaction reconciliation
- Check for failed payments
- Review security alerts
- Backup verification test

### Monthly Tasks
- Review merchant analytics
- Update dependencies
- Security assessment
- Performance optimization

## Support & Documentation

- **Runbook**: Document all standard procedures
- **Incident Response**: Define escalation procedures
- **Status Page**: https://status.qpay.io/
- **Support Email**: support@qpay.io
- **Documentation**: https://docs.qpay.io/

## Troubleshooting

### Database Connection Issues
```bash
psql -U qpay_admin -d qpay_production -h localhost
# Check pg_hba.conf for connection rules
```

### Stripe Integration Issues
```bash
# Test Stripe connection
curl https://api.stripe.com/v1/charges -H "Authorization: Bearer sk_live_xxxxx"
```

### Email Delivery Issues
```bash
# Test SMTP
npm run test:email

# Check mail logs
tail -f /var/log/mail.log
```

---

**Last Updated**: 2024  
**Version**: 1.0
