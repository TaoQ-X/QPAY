# BlockPay System Architecture

## Overview

BlockPay is now a complete end-to-end blockchain payment processing platform with database integration, AI agents, and business registration systems for both SMEs and enterprises.

## Architecture Components

### 1. Frontend Application (React + Vite)

#### Pages
- **Index.tsx** - Landing page with features, CTA buttons
  - Links to SME and Enterprise registration
  - Showcases platform capabilities
  - Call-to-action for both business types

- **RegisterSME.tsx** - SME Business Registration
  - 3-step registration wizard
  - Business info, settlement preferences, contact info
  - Simplified onboarding for small businesses
  - Starter plan details ($5,000 monthly volume)

- **RegisterEnterprise.tsx** - Enterprise Registration
  - 4-step registration process
  - Company info, business details, contacts, review
  - Dedicated account manager assignment
  - Custom pricing and integration support
  - Unlimited monthly volume

- **Dashboard.tsx** - Business Analytics Dashboard
  - Real-time transaction analytics
  - Revenue tracking and customer metrics
  - Settlement schedule management
  - Quick actions and API key management
  - Transaction history and reporting

#### Components
- **Header.tsx** - Navigation bar
  - Company branding (BlockPay logo)
  - Navigation links (Features, Pricing, Docs)
  - Dashboard link and Get Started button

### 2. Backend API (Express.js)

#### API Endpoints

**Registration & Setup**
```
POST /api/register-business
- Accepts business registration data
- Validates input with Zod
- Creates business account
- Returns business ID and API key
```

**Business Analytics**
```
GET /api/business/:businessId/analytics
- Returns total revenue, transaction count
- Active customers, KYC status
- Next settlement date
- Monthly volume remaining
```

**Transaction Management**
```
GET /api/business/:businessId/transactions
- Lists all transactions for a business
- Supports pagination (limit, offset)
- Returns transaction details with blockchain hashes
```

**Email Verification**
```
POST /api/business/:businessId/verify-email
- Verifies business email with code
- Marks email as verified
- Enables full feature access
```

**AI Agent Status**
```
GET /api/ai-agents/status
- Returns status of all AI agents
- Shows which agents are active
- Lists agent descriptions
```

### 3. Database Schema (Supabase PostgreSQL)

#### Tables Structure

**businesses**
- id (UUID, primary key)
- user_id (UUID, foreign key)
- name, email, phone, website
- type (enum: 'sme', 'enterprise')
- industry, country, region
- kyc_status, aml_check_status
- api_key, api_secret
- settlement_frequency, settlement_currency
- pricing_tier, transaction_fee_percent
- verified_email, verified_phone
- created_at, updated_at, onboarded_at

**business_users**
- id (UUID, primary key)
- business_id (foreign key)
- email, full_name
- role (enum: 'admin', 'accountant', 'viewer')
- permissions (JSON array)
- verified_email
- created_at, last_login

**payment_requests**
- id (UUID, primary key)
- business_id (foreign key)
- amount (integer, in cents)
- currency, description
- status (enum: pending, completed, failed, cancelled)
- blockchain_network, wallet_address
- payment_hash, expires_at
- created_at, completed_at

**transactions**
- id (UUID, primary key)
- business_id (foreign key)
- payment_request_id (foreign key)
- type (enum: payment, settlement, refund)
- amount, fee (in cents)
- blockchain_hash, status
- metadata (JSON)
- created_at, updated_at

**business_analytics**
- id (UUID, primary key)
- business_id (foreign key)
- date
- total_transactions, total_amount
- total_fees, successful_transactions
- failed_transactions, average_transaction_size
- unique_customers
- created_at

**ai_agent_logs**
- id (UUID, primary key)
- business_id (foreign key)
- agent_name, action_type, status
- description, result, error_message
- created_at, updated_at

### 4. AI Agents System

#### Architecture
Autonomous agents that monitor, optimize, and manage the blockchain payment system. Agents run on configurable intervals and log all actions.

#### Active Agents

**1. KYC Verification Agent**
- **Purpose**: Manages Know-Your-Customer compliance
- **Interval**: 1 hour
- **Actions**:
  - Monitors KYC document uploads
  - Runs AML (Anti-Money Laundering) checks
  - Updates verification status
  - Marks accounts as verified for full feature access
- **Success Criteria**: Documents validated, AML check passed
- **Output**: KYC status update, verification timestamp

**2. Settlement Agent**
- **Purpose**: Automates payment settlement to bank accounts
- **Interval**: 1 hour
- **Actions**:
  - Checks settlement schedule (daily/weekly/monthly)
  - Processes fund transfers to registered bank accounts
  - Converts crypto to fiat currency
  - Handles settlement records
- **Triggers**: Based on user-configured frequency
- **Output**: Settlement transaction, next settlement date

**3. Fraud Detection Agent**
- **Purpose**: Identifies suspicious transaction patterns
- **Interval**: 15 minutes (frequent monitoring)
- **Actions**:
  - Analyzes transaction data for anomalies
  - Calculates risk scores
  - Flags high-risk transactions
  - Notifies business owners of suspicious activity
- **Detection Methods**: Pattern matching, amount thresholds, time-based analysis
- **Output**: Risk level, detected anomalies, action recommendations

**4. Analytics Agent**
- **Purpose**: Generates business insights and reports
- **Interval**: 2 hours
- **Actions**:
  - Analyzes transaction patterns
  - Identifies peak hours and days
  - Tracks customer retention rates
  - Calculates revenue trends
  - Monitors blockchain usage patterns
- **Insights Generated**: Avg transaction size, peak times, blockchain preferences
- **Output**: Dashboard data, trend reports, optimization suggestions

**5. Customer Engagement Agent**
- **Purpose**: Manages customer communications
- **Interval**: 3 hours
- **Actions**:
  - Sends new customer welcome emails
  - Sends payment reminders to inactive customers
  - Generates customer monthly reports
  - Tracks engagement metrics
  - Suggests content based on user behavior
- **Communication Types**: Welcome, reminders, newsletters, reports
- **Output**: Email logs, engagement metrics

**6. Performance Optimization Agent**
- **Purpose**: Recommends system and operational improvements
- **Interval**: 4 hours
- **Actions**:
  - Analyzes usage patterns
  - Identifies optimization opportunities
  - Recommends plan upgrades
  - Suggests feature enablement
  - Calculates potential savings
- **Recommendations**: Plan upgrades, settlement frequency changes, feature adoption
- **Output**: Recommendations, impact estimates

#### Agent Manager

```typescript
AIAgentManager
├── Start agents on server startup
├── Schedule agent execution based on intervals
├── Log all agent actions
├── Handle errors and failures
└── Graceful shutdown on SIGTERM
```

#### Agent Logs

Every agent action is logged with:
- Agent name and action type
- Execution status (success/failed/pending)
- Result data and error messages
- Timestamp
- Business ID for filtering

Example log structure:
```json
{
  "id": "log_123",
  "business_id": "biz_456",
  "agent_name": "KYC Verification Agent",
  "action_type": "kyc_verified",
  "status": "success",
  "description": "KYC verification completed for Demo Business",
  "result": {
    "kyc_status": "verified",
    "aml_check": "passed",
    "verified_at": "2024-01-17T14:30:00Z"
  },
  "created_at": "2024-01-17T14:30:00Z"
}
```

### 5. Business Registration System

#### SME Registration (Small & Medium Enterprises)
- **Form Steps**: 3
- **Time to Complete**: ~5 minutes
- **Plan Tier**: Starter
- **Features**:
  - Daily or weekly settlements
  - Basic analytics dashboard
  - Email support
  - Up to $5,000 monthly volume
  - 2.5% transaction fee
- **Onboarding**:
  1. Business Info (name, industry, country)
  2. Settlement Setup (currency, frequency)
  3. Contact Info (name, email, phone)

#### Enterprise Registration
- **Form Steps**: 4
- **Time to Complete**: ~10 minutes
- **Plan Tier**: Enterprise
- **Features**:
  - Unlimited monthly volume
  - Custom transaction fees (volume-based)
  - Dedicated account manager
  - 24/7 priority support
  - Advanced analytics
  - Custom API integrations
  - White-label solutions
- **Onboarding**:
  1. Company Info (name, industry, size, country)
  2. Business Details (volume, currency, description)
  3. Contact Information (primary, compliance, technical)
  4. Review & Confirmation

#### Post-Registration Workflow
1. Account created with temporary status
2. Email verification code sent
3. User verifies email
4. KYC agent starts verification process (24-48 hours)
5. Account marked "verified"
6. Full feature access enabled
7. For enterprise: Dedicated account manager assigned

### 6. Data Types & Models

#### Business Type
```typescript
type BusinessType = "sme" | "enterprise";
```

#### Payment Status
```typescript
type PaymentStatus = "pending" | "completed" | "failed" | "cancelled";
```

#### Transaction Type
```typescript
type TransactionType = "payment" | "settlement" | "refund";
```

#### Business Interface
```typescript
interface Business {
  id: string;
  user_id: string;
  name: string;
  type: BusinessType;
  email: string;
  // ... (see shared/database.ts for full definition)
}
```

### 7. Integration Points

#### Frontend to Backend
- Registration forms POST to `/api/register-business`
- Dashboard GETs analytics from `/api/business/:businessId/analytics`
- Transaction lists GET from `/api/business/:businessId/transactions`

#### Backend to Database
- All APIs connect to Supabase PostgreSQL
- Connection string from environment variables
- Automatic query builder (if using Supabase client)

#### AI Agents to Database
- Agents read business data
- Agents log their actions to ai_agent_logs table
- Agents update business status fields

### 8. Security Features

**API Key Management**
- Generated on registration
- Stored securely in database
- Masked in UI for security
- Regenerable via dashboard

**KYC/AML Compliance**
- Document verification
- AML checks before fund settlement
- Audit trails of all verifications
- Compliance reports for regulators

**Data Privacy**
- Passwords hashed (salt + hash)
- PII encrypted at rest
- Transaction data isolated by business
- Audit logs for all operations

**Rate Limiting**
- API endpoints rate limited
- Prevents abuse and DDoS
- Progressive delays for violations

### 9. Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (React)                        │
│  - Landing page, registration, dashboard                │
│  - Runs on Vite dev server (localhost:5173)             │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP/JSON
                     │
┌────────────────────▼────────────────────────────────────┐
│                  API Server (Express)                    │
│  - REST endpoints for registration                      │
│  - Business analytics endpoints                         │
│  - AI agent status endpoint                             │
└────────────────────┬────────────────────────────────────┘
                     │
      ┌──────────────┼──────────────┐
      │              │              │
      │          Supabase      AI Agents
      │         PostgreSQL      Manager
      │         (Database)      (Scheduler)
      │
┌──────▼──────────────────────────────────────────────────┐
│                  AI Agents (Node.js)                     │
│  - KYC Verification Agent                               │
│  - Settlement Agent                                     │
│  - Fraud Detection Agent                                │
│  - Analytics Agent                                      │
│  - Customer Engagement Agent                            │
│  - Optimization Agent                                   │
└─────────────────────────────────────────────────────────┘
```

### 10. File Structure

```
├── client/
│   ├── pages/
│   │   ├── Index.tsx              # Landing page
│   │   ├── RegisterSME.tsx        # SME registration
│   │   ├── RegisterEnterprise.tsx # Enterprise registration
│   │   ├── Dashboard.tsx          # Business dashboard
│   │   └── Placeholder.tsx        # Placeholder pages
│   └── components/
│       └── Header.tsx             # Navigation header
│
├── server/
│   ├── index.ts                   # Express server setup
│   ├── routes/
│   │   ├── register-business.ts   # Registration endpoints
│   │   └── demo.ts                # Demo endpoint
│   └── ai-agents/
│       └── index.ts               # AI agents system
│
├── shared/
│   ├── api.ts                     # Shared API types
│   └── database.ts                # Database schema types
│
├── e2e/                           # E2E tests
│   ├── homepage.spec.ts
│   ├── navigation.spec.ts
│   ├── user-flows.spec.ts
│   ├── accessibility.spec.ts
│   └── helpers.ts
│
└── Configuration files
    ├── playwright.config.ts       # E2E test config
    ├── tailwind.config.ts         # Styling config
    └── vite.config.ts             # Build config
```

## Database Setup (Supabase)

### Environment Variables
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Initial Setup Steps
1. Create Supabase account at supabase.com
2. Create new PostgreSQL database
3. Run migrations to create tables
4. Enable RLS (Row Level Security)
5. Set up Auth provider
6. Get connection strings

### SQL Migrations
See `supabase/migrations/` directory for SQL files to create all tables.

## Running the System

### Development
```bash
# Start dev server (includes Vite + Express + AI agents)
npm run dev

# In another terminal, run e2e tests
npm run test:e2e:ui
```

### Production Build
```bash
# Build client and server
npm run build

# Run production server
npm start
```

### Monitor AI Agents
```bash
# Check agent status
curl http://localhost:5173/api/ai-agents/status

# View agent logs in Supabase dashboard
# Navigate to: ai_agent_logs table
```

## Future Enhancements

1. **Webhook Support** - Notify businesses of transaction events
2. **Multi-chain Support** - Bitcoin, Ethereum, Polygon, Solana
3. **Mobile App** - Native iOS/Android applications
4. **Advanced Analytics** - ML-powered insights and predictions
5. **Staking Features** - Allow businesses to stake for rewards
6. **White-label** - Full custom branding for resellers
7. **Advanced KYC** - Biometric verification, document scanning
8. **Marketplace** - Plugin/integration marketplace
9. **Insurance** - Coverage for transaction disputes
10. **DAO Governance** - Community voting on features

## Support & Documentation

- [E2E Testing Guide](./E2E_TESTING.md)
- [E2E Quick Start](./E2E_QUICK_START.md)
- API Documentation: `/api/docs` (future)
- Status Page: `status.blockpay.io` (future)

---

**Version**: 1.0.0
**Last Updated**: January 17, 2024
**Architecture Review**: Quarterly
