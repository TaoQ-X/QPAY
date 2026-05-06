# QPay API Documentation

Complete API reference for QPay payment platform integration.

## Base URL
```
Production: https://api.qpay.io/v1
Development: http://localhost:8080/api
```

## Authentication

All API requests require authentication via one of:

### Bearer Token (JWT)
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  https://api.qpay.io/v1/transactions
```

### API Key
```bash
curl -H "X-API-Key: qpay_xxxxx" \
  https://api.qpay.io/v1/transactions
```

## Response Format

All responses are JSON:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Transaction declined",
  "code": "TRANSACTION_DECLINED",
  "details": { ... },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Authentication Endpoints

### Register
```
POST /auth/register
```

**Request:**
```json
{
  "email": "merchant@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "businessName": "Acme Corp"
}
```

**Response:**
```json
{
  "userId": "uuid",
  "email": "merchant@example.com",
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "expiresIn": 900
}
```

### Login
```
POST /auth/login
```

**Request:**
```json
{
  "email": "merchant@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "userId": "uuid",
  "merchantId": "uuid",
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "expiresIn": 900
}
```

### Refresh Token
```
POST /auth/refresh
```

**Request:**
```json
{
  "refreshToken": "refresh_token"
}
```

**Response:**
```json
{
  "accessToken": "new_jwt_token",
  "expiresIn": 900
}
```

---

## Payment Processing

### Process EMV Payment
```
POST /payments/emv/process
```

**Request:**
```json
{
  "terminalId": "TERM_001",
  "amount": 99.99,
  "currency": "USD",
  "cardData": {
    "pan": "4242424242424242",
    "expiryDate": "12/25",
    "cardholderName": "JOHN SMITH",
    "cardBrand": "visa",
    "cardType": "credit"
  },
  "description": "Order #12345"
}
```

**Response:**
```json
{
  "transactionId": "uuid",
  "status": "approved",
  "authorizationCode": "AUTH123",
  "amount": 99.99,
  "currency": "USD",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Process 3D Secure Payment
```
POST /payments/3ds/initiate
```

**Request:**
```json
{
  "transactionId": "uuid",
  "amount": 500.00,
  "currency": "USD"
}
```

**Response:**
```json
{
  "challengeId": "uuid",
  "challengeUrl": "https://acs.bankcard.com/challenge/xyz",
  "threeDsVersion": "2.2.0",
  "directoryServerTransactionId": "uuid"
}
```

### Verify 3D Secure
```
POST /payments/3ds/verify
```

**Request:**
```json
{
  "challengeId": "uuid",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "uuid",
  "status": "approved"
}
```

### Process Contactless Payment
```
POST /payments/contactless/process
```

**Request:**
```json
{
  "terminalId": "TERM_001",
  "nfcData": "NFC_SIGNATURE_DATA",
  "amount": 49.99,
  "currency": "USD"
}
```

**Response:**
```json
{
  "transactionId": "uuid",
  "status": "approved",
  "authorizationCode": "AUTH456",
  "contactless": {
    "deviceSerialNumber": "TERM_001",
    "transactionCounter": 1234
  }
}
```

### Create PIN Session
```
POST /payments/pinpad/session
```

**Request:**
```json
{
  "transactionId": "uuid",
  "terminalId": "TERM_001",
  "merchantId": "uuid"
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "expiresAt": "2024-01-15T10:35:00Z",
  "maxAttempts": 3
}
```

### Verify PIN
```
POST /payments/verify-pin
```

**Request:**
```json
{
  "sessionId": "uuid",
  "pin": "1234",
  "transactionId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "uuid",
  "status": "verified",
  "remainingAttempts": 3
}
```

---

## Transaction Management

### Get Transaction
```
GET /transactions/{transactionId}
```

**Response:**
```json
{
  "transactionId": "uuid",
  "merchantId": "uuid",
  "terminalId": "uuid",
  "amount": 99.99,
  "currency": "USD",
  "status": "approved",
  "paymentMethod": "emv_chip",
  "authorizationCode": "AUTH123",
  "createdAt": "2024-01-15T10:30:00Z",
  "completedAt": "2024-01-15T10:30:15Z"
}
```

### List Transactions
```
GET /transactions?limit=50&offset=0&status=approved&startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
{
  "transactions": [ ... ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

### Refund Transaction
```
POST /transactions/{transactionId}/refund
```

**Request:**
```json
{
  "amount": 99.99,
  "reason": "Customer requested"
}
```

**Response:**
```json
{
  "refundId": "uuid",
  "originalTransactionId": "uuid",
  "amount": 99.99,
  "status": "processing",
  "createdAt": "2024-01-15T10:45:00Z"
}
```

---

## Settlements & Payouts

### Calculate Settlement
```
GET /settlements/calculate?startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
{
  "settlementId": "uuid",
  "periodStart": "2024-01-01",
  "periodEnd": "2024-01-31",
  "grossVolume": 50000.00,
  "totalFees": 1450.00,
  "netVolume": 48550.00,
  "transactionCount": 450,
  "payoutDate": "2024-02-05"
}
```

### Process Payout
```
POST /settlements/{settlementId}/payout
```

**Request:**
```json
{
  "bankAccountId": "uuid"
}
```

**Response:**
```json
{
  "payoutId": "uuid",
  "settlementId": "uuid",
  "amount": 48550.00,
  "status": "processing",
  "arrivalDate": "2024-02-07",
  "stripePayoutId": "po_xxxxx"
}
```

### Get Payout Status
```
GET /payouts/{payoutId}
```

**Response:**
```json
{
  "payoutId": "uuid",
  "status": "paid",
  "amount": 48550.00,
  "arrivalDate": "2024-02-07",
  "bankAccountLast4": "1234"
}
```

---

## Terminals

### Register Terminal
```
POST /terminals
```

**Request:**
```json
{
  "terminalId": "TERM_001",
  "name": "Main Counter",
  "model": "Ingenico iSC250",
  "serialNumber": "SN123456",
  "location": "123 Main St, New York, NY 10001"
}
```

**Response:**
```json
{
  "terminalId": "uuid",
  "status": "active",
  "emvCertified": true,
  "emvLevel": "L2"
}
```

### Get Terminal Status
```
GET /terminals/{terminalId}
```

**Response:**
```json
{
  "terminalId": "uuid",
  "status": "active",
  "batteryLevel": 85,
  "lastHeartbeat": "2024-01-15T10:35:00Z",
  "transactionCount": 1234,
  "totalVolume": 50000.00
}
```

### Get Terminal Health
```
GET /terminals/{terminalId}/health
```

**Response:**
```json
{
  "terminalId": "uuid",
  "status": "healthy",
  "connectivity": "online",
  "batteryLevel": 85,
  "storageUsage": 45,
  "memoryUsage": 62,
  "firmwareUpdateAvailable": false
}
```

---

## Alerts & Notifications

### Create Alert Configuration
```
POST /alerts/config
```

**Request:**
```json
{
  "name": "High Transaction Alert",
  "enabled": true,
  "triggers": [
    {
      "type": "high_transaction",
      "value": 5000,
      "frequency": "immediate"
    }
  ],
  "notificationChannels": {
    "email": true,
    "sms": true,
    "inApp": true
  },
  "recipients": [
    {
      "type": "owner",
      "email": "owner@example.com"
    }
  ]
}
```

**Response:**
```json
{
  "configId": "uuid",
  "name": "High Transaction Alert",
  "enabled": true
}
```

### Get Notifications
```
GET /notifications?limit=50&unread=true
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "high_transaction",
      "severity": "warning",
      "title": "High Transaction Alert",
      "message": "Transaction of $5000 detected",
      "read": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 5,
  "unreadCount": 2
}
```

---

## Invoices

### Create Invoice
```
POST /invoices
```

**Request:**
```json
{
  "transactionId": "uuid",
  "customerEmail": "customer@example.com",
  "items": [
    {
      "description": "Product A",
      "quantity": 2,
      "unitPrice": 49.99,
      "taxRate": 8.5
    }
  ]
}
```

**Response:**
```json
{
  "invoiceId": "uuid",
  "invoiceNumber": "INV-2024-001234",
  "amount": 99.98,
  "taxAmount": 8.50,
  "total": 108.48,
  "status": "issued"
}
```

### Send Invoice
```
POST /invoices/{invoiceId}/send
```

**Request:**
```json
{
  "channels": ["email", "sms"]
}
```

**Response:**
```json
{
  "invoiceId": "uuid",
  "status": "sent",
  "sentAt": "2024-01-15T10:30:00Z",
  "channels": {
    "email": { "sent": true, "timestamp": "2024-01-15T10:30:05Z" },
    "sms": { "sent": true, "timestamp": "2024-01-15T10:30:10Z" }
  }
}
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `INVALID_REQUEST` | 400 | Invalid request parameters |
| `TRANSACTION_DECLINED` | 402 | Payment was declined |
| `INSUFFICIENT_FUNDS` | 402 | Insufficient funds |
| `LOST_CARD` | 402 | Card reported lost |
| `STOLEN_CARD` | 402 | Card reported stolen |
| `EXPIRED_CARD` | 402 | Card expired |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Rate Limiting

API rate limits:
- **Standard**: 100 requests per minute
- **Premium**: 1000 requests per minute
- **Enterprise**: Custom limits

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 2024-01-15T10:35:00Z
```

---

## Webhooks

### Webhook Events

Subscribe to events at `/settings/webhooks`

#### charge.succeeded
```json
{
  "event": "charge.succeeded",
  "transactionId": "uuid",
  "amount": 99.99,
  "status": "approved",
  "authorizationCode": "AUTH123",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### settlement.completed
```json
{
  "event": "settlement.completed",
  "settlementId": "uuid",
  "amount": 48550.00,
  "periodStart": "2024-01-01",
  "periodEnd": "2024-01-31",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### charge.refunded
```json
{
  "event": "charge.refunded",
  "transactionId": "uuid",
  "refundId": "uuid",
  "amount": 99.99,
  "reason": "Customer requested",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## SDKs & Libraries

### JavaScript/Node.js
```bash
npm install @qpay/sdk
```

```javascript
const QPay = require('@qpay/sdk');
const qpay = new QPay('sk_live_xxxxx');

const transaction = await qpay.payments.process({
  amount: 99.99,
  currency: 'USD',
  cardToken: 'tok_xxxxx'
});
```

### Python
```bash
pip install qpay
```

```python
import qpay

client = qpay.Client(api_key='sk_live_xxxxx')
transaction = client.payments.process(
    amount=99.99,
    currency='USD',
    card_token='tok_xxxxx'
)
```

### cURL Examples

See examples above or visit https://docs.qpay.io/api

---

**Last Updated**: 2024  
**Version**: 1.0  
**Support**: api-support@qpay.io
