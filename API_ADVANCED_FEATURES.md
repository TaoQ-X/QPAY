# QPay Advanced Features API Documentation

Complete API reference for payment links, invoice automation, customer payment methods, and mobile financial management.

---

## Payment Links API

### 1. Create Payment Link
Creates a new shareable payment link for customers.

**Endpoint:** `POST /api/payment-links`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Service Consultation",
  "description": "Payment for consulting services",
  "amount_cents": 10000,
  "is_variable_amount": false,
  "currency": "USD",
  "theme_color": "#3b82f6",
  "custom_message": "Thank you for your business!",
  "redirect_url": "https://yoursite.com/thank-you",
  "expires_at": "2025-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "link_a1b2c3d4e5f6",
    "slug": "service-consultation-xyz123",
    "title": "Service Consultation",
    "amount_cents": 10000,
    "public_url": "https://pay.qpay.io/p/service-consultation-xyz123",
    "status": "active",
    "created_at": "2025-06-09T10:30:00Z"
  }
}
```

---

### 2. List Payment Links
Retrieve all payment links for a merchant.

**Endpoint:** `GET /api/payment-links?limit=50&offset=0`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "link_a1b2c3d4e5f6",
      "title": "Service Consultation",
      "amount_cents": 10000,
      "public_url": "https://pay.qpay.io/p/service-consultation-xyz123",
      "status": "active",
      "created_at": "2025-06-09T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 12
  }
}
```

---

### 3. Get Link Analytics
Retrieve performance metrics for a payment link.

**Endpoint:** `GET /api/payment-links/:id/analytics`

**Response:**
```json
{
  "success": true,
  "data": {
    "link_clicks": 156,
    "total_transactions": 42,
    "completed_transactions": 38,
    "total_revenue_cents": 450000,
    "conversion_rate": 90.5,
    "average_amount_cents": 11842
  }
}
```

---

### 4. Public Checkout (No Auth Required)
Get public payment link details for checkout page.

**Endpoint:** `GET /api/payment-links/:slug/checkout`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "link_a1b2c3d4e5f6",
    "title": "Service Consultation",
    "description": "Payment for consulting services",
    "amount_cents": 10000,
    "is_variable_amount": false,
    "currency": "USD",
    "theme_color": "#3b82f6",
    "custom_message": "Thank you for your business!"
  }
}
```

---

## Invoice Automation API

### 1. Initialize Invoice Sequence
Set up invoice numbering for a merchant.

**Endpoint:** `POST /api/invoices/sequences/init`

**Request Body:**
```json
{
  "sequence_type": "general",
  "prefix": "INV",
  "padding_digits": 6,
  "format_template": "{prefix}-{sequence}"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "seq_1a2b3c4d5e6f",
    "merchant_id": "merch_xyz",
    "prefix": "INV",
    "next_number": 1,
    "format_template": "{prefix}-{sequence}"
  }
}
```

---

### 2. Generate Next Invoice Number
Get the next sequential invoice number.

**Endpoint:** `POST /api/invoices/next-number`

**Response:**
```json
{
  "success": true,
  "data": {
    "invoice_number": "INV-000001",
    "next_sequence": 1
  }
}
```

---

### 3. Create Invoice Job
Create an invoice generation job for a transaction.

**Endpoint:** `POST /api/invoices/jobs`

**Request Body:**
```json
{
  "transaction_id": "txn_abc123def456",
  "sequence_type": "general"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "job_1a2b3c4d5e6f",
    "transaction_id": "txn_abc123def456",
    "invoice_number": "INV-000001",
    "status": "pending",
    "created_at": "2025-06-09T10:30:00Z"
  }
}
```

---

### 4. Get Invoice Job by Transaction
Retrieve invoice job for a specific transaction.

**Endpoint:** `GET /api/invoices/job/:transactionId`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "job_1a2b3c4d5e6f",
    "transaction_id": "txn_abc123def456",
    "invoice_number": "INV-000001",
    "status": "generated",
    "invoice_url": "https://invoices.qpay.io/inv/job_1a2b3c4d5e6f.pdf",
    "pdf_hash": "sha256hash...",
    "signed_hash": "signaturedhash...",
    "created_at": "2025-06-09T10:30:00Z"
  }
}
```

---

### 5. Update Invoice Job Status
Update the status of an invoice job.

**Endpoint:** `PUT /api/invoices/jobs/:jobId`

**Request Body:**
```json
{
  "status": "generating",
  "invoice_url": "https://invoices.qpay.io/inv/job_1a2b3c4d5e6f.pdf",
  "pdf_hash": "sha256hash...",
  "signed_hash": "signaturedhash..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "job_1a2b3c4d5e6f",
    "status": "generated",
    "invoice_url": "https://invoices.qpay.io/inv/job_1a2b3c4d5e6f.pdf"
  }
}
```

---

### 6. Send Invoice
Send generated invoice to customer.

**Endpoint:** `POST /api/invoices/jobs/:jobId/delivered`

**Request Body:**
```json
{
  "method": "email",
  "recipient": "customer@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "job_1a2b3c4d5e6f",
    "status": "sent",
    "send_method": "email",
    "recipient_email": "customer@example.com",
    "sent_at": "2025-06-09T10:35:00Z"
  }
}
```

---

### 7. Get Invoice Statistics
Retrieve invoice automation metrics.

**Endpoint:** `GET /api/invoices/automation/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "total_generated": 156,
    "successfully_sent": 143,
    "failed": 13,
    "unique_transactions": 156
  }
}
```

---

## Customer Payment Methods API

### 1. Add Payment Method
Store a customer's payment method.

**Endpoint:** `POST /api/customers/payment-methods`

**Request Body:**
```json
{
  "customer_identifier": "cust_abc123",
  "card_token": "tok_visa_4242",
  "card_brand": "visa",
  "card_last_four": "4242",
  "card_expiry_month": 12,
  "card_expiry_year": 2027,
  "is_primary": true,
  "metadata": {
    "billing_address": "123 Main St",
    "customer_name": "John Doe"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "method_1a2b3c4d5e6f",
    "customer_identifier": "cust_abc123",
    "card_brand": "visa",
    "card_last_four": "4242",
    "card_expiry_month": 12,
    "card_expiry_year": 2027,
    "is_primary": true,
    "status": "active",
    "created_at": "2025-06-09T10:30:00Z"
  }
}
```

---

### 2. Get Customer Payment Methods
List all payment methods for a customer.

**Endpoint:** `GET /api/customers/:customerId/payment-methods`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "method_1a2b3c4d5e6f",
      "customer_identifier": "cust_abc123",
      "card_brand": "visa",
      "card_last_four": "4242",
      "card_expiry_month": 12,
      "card_expiry_year": 2027,
      "is_primary": true,
      "status": "active"
    }
  ]
}
```

---

### 3. Get Primary Payment Method
Retrieve the customer's primary payment method.

**Endpoint:** `GET /api/customers/:customerId/payment-methods/primary`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "method_1a2b3c4d5e6f",
    "customer_identifier": "cust_abc123",
    "card_brand": "visa",
    "card_last_four": "4242",
    "is_primary": true,
    "status": "active"
  }
}
```

---

### 4. Record Card Updater Event
Handle automatic card updates from card networks.

**Endpoint:** `POST /api/customers/payment-methods/:methodId/updater-event`

**Request Body:**
```json
{
  "event_type": "card_updated",
  "processor_response": {
    "new_expiry_month": 3,
    "new_expiry_year": 2027,
    "status": "active"
  },
  "new_expiry_month": 3,
  "new_expiry_year": 2027
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "event_1a2b3c4d5e6f",
    "payment_method_id": "method_1a2b3c4d5e6f",
    "event_type": "card_updated",
    "status": "processed",
    "created_at": "2025-06-09T10:30:00Z"
  }
}
```

---

### 5. Get Card Updater History
Retrieve all update events for a payment method.

**Endpoint:** `GET /api/customers/payment-methods/:methodId/updater-history`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "event_1a2b3c4d5e6f",
      "event_type": "card_updated",
      "status": "processed",
      "new_expiry_month": 3,
      "new_expiry_year": 2027,
      "created_at": "2025-06-09T10:30:00Z"
    }
  ]
}
```

---

### 6. Get Payment Method Statistics
Retrieve aggregate statistics for payment methods.

**Endpoint:** `GET /api/customers/payment-methods/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "total_methods": 234,
    "active_methods": 198,
    "expired_methods": 36,
    "unique_customers": 127
  }
}
```

---

## Webhook Endpoints

### Card Updater Webhook
Receive card update events from payment networks.

**Endpoint:** `POST /api/webhooks/card-updater`

**Request Body:**
```json
{
  "merchant_id": "merch_xyz",
  "payment_method_id": "method_1a2b3c4d5e6f",
  "event_type": "card_updated",
  "data": {
    "new_expiry_month": 3,
    "new_expiry_year": 2027
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Card updater event processed"
}
```

---

## Error Responses

All endpoints return consistent error formats:

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "path": ["title"],
      "message": "String must contain at least 3 character(s)"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Payment link not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Failed to create payment link"
}
```

---

## Rate Limiting

All endpoints are rate-limited:
- **Standard:** 100 requests per 15 minutes per IP
- **Webhook:** 1000 requests per hour
- **Public Checkout:** No rate limit

Response headers include:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1717945800
```

---

## Authentication

Two authentication methods are supported:

### Bearer Token (OAuth)
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### API Key
```
Authorization: Bearer sk_live_yourApiKeyHere...
```

---

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `limit` (default: 50, max: 100)
- `offset` (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 156
  }
}
```

---

## Filtering & Sorting

Invoice jobs support filtering:

**Query Parameters:**
- `status` - Filter by status (pending, generating, generated, sending, sent, failed)

**Example:**
```
GET /api/invoices/jobs?status=sent&limit=20
```

---

## Date Format

All timestamps use ISO 8601 format:
```
2025-06-09T10:30:00Z
```

---

## SDK Examples

### JavaScript/TypeScript
```typescript
// Create payment link
const response = await fetch('/api/payment-links', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Service Payment',
    amount_cents: 5000,
    currency: 'USD'
  })
});

const data = await response.json();
console.log(data.data.public_url); // https://pay.qpay.io/p/...
```

### cURL
```bash
curl -X POST https://api.qpay.io/api/payment-links \
  -H "Authorization: Bearer token..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Service Payment",
    "amount_cents": 5000,
    "currency": "USD"
  }'
```

---

## Support

For API support, contact: api-support@qpay.io
Documentation: https://docs.qpay.io
Status Page: https://status.qpay.io
