# QPay - Enterprise Payment Platform

Complete, production-ready payment processing system with EMV, 3D Secure, contactless payments, and settlement management.

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Start all services with Docker Compose
docker-compose up -d

# Initialize database
npm run db:init

# Visit the application
open http://localhost:8080
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Create .env.development
cp .env.example .env.development

# Start PostgreSQL locally
createdb qpay_development
psql -U qpay_admin -d qpay_development -f server/database/schema.sql

# Start development server
npm run start:dev

# In another terminal, start frontend
npm run dev
```

## 📋 Features

### Payment Processing
- ✅ EMV Chip Card Processing (PCI-DSS Compliant)
- ✅ 3D Secure V2 Authentication
- ✅ Contactless/NFC Payments
- ✅ PIN Verification
- ✅ Tokenization

### Settlement & Payouts
- ✅ Automatic Settlement Calculation
- ✅ Merchant Payouts via Stripe
- ✅ Transaction Reconciliation
- ✅ Fraud Detection & Prevention
- ✅ Dispute Management

### Merchant Dashboard
- ✅ Real-time Transaction Monitoring
- ✅ Settlement History
- ✅ API Key Management
- ✅ Alert Configuration
- ✅ Digital Invoicing

### Infrastructure
- ✅ PostgreSQL Database
- ✅ JWT Authentication
- ✅ Rate Limiting
- ✅ Error Tracking
- ✅ Audit Logging

## 🔧 Configuration

### Environment Variables

Create `.env.production`:

```bash
# Application
NODE_ENV=production
APP_PORT=8080
APP_URL=https://qpay.io

# Database
DATABASE_URL=postgresql://user:password@host:5432/qpay_production

# Security
JWT_SECRET=<generate-strong-random-key>
REFRESH_TOKEN_SECRET=<generate-strong-random-key>

# Stripe Integration
STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-password
SMTP_FROM_EMAIL=noreply@qpay.io

# SMS (Twilio)
TWILIO_ACCOUNT_SID=AC_xxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

## 📚 API Documentation

### Authentication

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "merchant@example.com",
    "password": "SecurePassword123!",
    "businessName": "Acme Corp"
  }'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "merchant@example.com",
    "password": "SecurePassword123!"
  }'
```

### Process Payment

```bash
curl -X POST http://localhost:8080/api/transactions/process \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 99.99,
    "currency": "USD",
    "cardToken": "tok_xxxxx",
    "paymentMethod": "emv_chip",
    "description": "Order #12345"
  }'
```

### Get Transactions

```bash
curl -X GET "http://localhost:8080/api/transactions?limit=50&status=approved" \
  -H "Authorization: Bearer <token>"
```

Full API documentation: See `server/API_DOCUMENTATION.md`

## 🛠️ Development

### Running Tests

```bash
# Unit tests
npm test

# Database tests
npm run test:db

# Email service tests
npm run test:email

# Stripe integration tests
npm run test:stripe

# E2E tests
npm run test:e2e
```

### Database Management

```bash
# Initialize schema
npm run db:init

# Run migrations
npm run db:migrate

# Seed test data
npm run db:seed

# Access database directly
psql -U qpay_admin -d qpay_production
```

### Building for Production

```bash
# Build all
npm run build

# Run production build
npm run production

# Or with Docker
npm run docker:build
npm run docker:run
```

## 📊 Deployment

### Kubernetes

```bash
# Create ConfigMap for environment variables
kubectl create configmap qpay-config --from-file=.env.production

# Create Secret for sensitive data
kubectl create secret generic qpay-secrets \
  --from-literal=jwt-secret=<value> \
  --from-literal=db-password=<value>

# Deploy
kubectl apply -f k8s/
```

### AWS ECS

1. Create ECR repository
2. Push Docker image
3. Create ECS task definition
4. Create ECS service
5. Configure RDS PostgreSQL
6. Set environment variables via Secrets Manager

### Heroku

```bash
# Create app
heroku create qpay

# Set environment variables
heroku config:set JWT_SECRET=<value>
heroku config:set DATABASE_URL=<postgresql://...>
heroku config:set STRIPE_SECRET_KEY=<value>

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:standard-0

# Deploy
git push heroku main

# Run migrations
heroku run npm run db:init
```

## 🔐 Security

### SSL/TLS

```bash
# Generate Let's Encrypt certificate
certbot certonly --standalone -d yourdomain.com

# Configure nginx to use certificate
# See PRODUCTION_SETUP.md for nginx config
```

### Database Security

- All passwords hashed with bcrypt
- Card data encrypted with AES-256
- In-transit encryption with TLS 1.2+
- Audit logging for all actions
- Regular security backups

### PCI-DSS Compliance

- Level 1 certification ready
- All card data tokenized
- No raw card storage
- Encrypted at rest and in transit
- Annual penetration testing

## 📞 Support

- **Documentation**: https://docs.qpay.io
- **API Reference**: `server/API_DOCUMENTATION.md`
- **Setup Guide**: `PRODUCTION_SETUP.md`
- **Production Checklist**: `PRODUCTION_READINESS.md`
- **Email**: support@qpay.io

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
psql -U qpay_admin -d qpay_production

# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
npm run test:db
```

### Stripe Integration Error

```bash
# Check API keys are set
echo $STRIPE_SECRET_KEY
echo $STRIPE_PUBLIC_KEY

# Test Stripe connection
npm run test:stripe
```

### Email Not Sending

```bash
# Check SMTP configuration
npm run test:email

# View MailHog UI (dev)
open http://localhost:8025
```

## 📈 Monitoring

### Health Checks

```bash
# Application health
curl http://localhost:8080/health

# Readiness
curl http://localhost:8080/ready

# Database status
curl http://localhost:8080/api/health/database
```

### Logs

```bash
# Application logs
tail -f logs/app.log

# Error logs
tail -f logs/error.log

# Access logs
tail -f logs/access.log
```

### Metrics

Monitor with your choice of:
- **Sentry**: Error tracking
- **DataDog**: Infrastructure monitoring
- **New Relic**: Application performance monitoring
- **Prometheus**: Metrics collection

## 📦 Dependencies

### Production
- `express` - Web framework
- `pg` - PostgreSQL client
- `stripe` - Payment processor
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing
- `nodemailer` - Email sending
- `twilio` - SMS sending

### Development
- `typescript` - Type safety
- `vitest` - Testing
- `playwright` - E2E testing
- `prettier` - Code formatting

## 🚀 Performance

### Optimization Tips

1. **Database**
   - Use connection pooling (PgBouncer)
   - Enable query caching
   - Regular VACUUM and ANALYZE

2. **Application**
   - Enable compression (gzip)
   - Cache static assets
   - Use CDN for images

3. **Monitoring**
   - Track response times
   - Monitor database queries
   - Watch for memory leaks

## 📄 License

Proprietary - QPay Payment Platform

## 🙋 Contributing

This is a proprietary system. For issues or questions, contact: support@qpay.io

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Status**: ✅ Production Ready
