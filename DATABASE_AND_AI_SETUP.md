# BlockPay Database & AI Agents Setup Guide

## Quick Overview

You now have a complete system with:
- ✅ Database schema for business management
- ✅ AI agents for automated operations
- ✅ SME & Enterprise registration flows
- ✅ Business analytics dashboard
- ✅ API endpoints for integration

## What Was Added

### Database Types (shared/database.ts)
- Business profiles (SME and Enterprise)
- Business users and roles
- Payment requests
- Transactions (payments, settlements, refunds)
- Analytics data
- AI agent logs

### AI Agents System (server/ai-agents/index.ts)
6 autonomous agents that run automatically:

1. **KYC Verification Agent** (1-hour intervals)
   - Validates business documents
   - Runs AML checks
   - Updates verification status

2. **Settlement Agent** (1-hour intervals)
   - Processes daily/weekly/monthly settlements
   - Converts crypto to fiat
   - Handles bank transfers

3. **Fraud Detection Agent** (15-minute intervals)
   - Detects suspicious transactions
   - Calculates risk scores
   - Alerts on anomalies

4. **Analytics Agent** (2-hour intervals)
   - Generates business insights
   - Tracks trends
   - Creates reports

5. **Customer Engagement Agent** (3-hour intervals)
   - Sends welcome emails
   - Payment reminders
   - Monthly reports

6. **Performance Optimization Agent** (4-hour intervals)
   - Recommends upgrades
   - Suggests improvements
   - Calculates savings

### API Endpoints (server/routes/register-business.ts)
- `POST /api/register-business` - Register a business
- `GET /api/business/:businessId/analytics` - Get analytics
- `GET /api/business/:businessId/transactions` - List transactions
- `POST /api/business/:businessId/verify-email` - Verify email
- `GET /api/ai-agents/status` - Check agent status

### Registration Pages
- **SME Registration** (`/register/sme`)
  - 3-step process
  - Simplified for small businesses
  - $5,000 monthly limit, 2.5% fees

- **Enterprise Registration** (`/register/enterprise`)
  - 4-step process
  - Unlimited volume
  - Custom pricing & support

### Dashboard (`/dashboard`)
- Real-time analytics
- Transaction history
- Settlement tracking
- API key management
- Quick actions

## Setting Up Supabase

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Choose a name (e.g., "blockpay")
4. Select region closest to you
5. Create a strong password
6. Click "Create new project"
7. Wait for setup to complete (2-3 minutes)

### Step 2: Get Connection Details

In Supabase dashboard:
1. Go to Project Settings → API
2. Copy your "Project URL"
3. Copy your "anon public" key
4. Copy your "service_role" key (keep private!)

### Step 3: Create Tables

In Supabase SQL Editor:

```sql
-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  website VARCHAR(255),
  description TEXT,
  industry VARCHAR(50) NOT NULL,
  country VARCHAR(2) NOT NULL,
  region VARCHAR(50),
  kyc_status VARCHAR(20) DEFAULT 'pending',
  aml_check_status VARCHAR(20) DEFAULT 'pending',
  api_key VARCHAR(255),
  api_secret VARCHAR(255),
  settlement_frequency VARCHAR(20) NOT NULL,
  settlement_currency VARCHAR(3) NOT NULL,
  verified_email BOOLEAN DEFAULT FALSE,
  verified_phone BOOLEAN DEFAULT FALSE,
  pricing_tier VARCHAR(20) DEFAULT 'starter',
  transaction_fee_percent NUMERIC(5,2) DEFAULT 2.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  onboarded_at TIMESTAMP WITH TIME ZONE
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  payment_request_id UUID,
  type VARCHAR(20) NOT NULL,
  amount BIGINT NOT NULL,
  currency VARCHAR(3) NOT NULL,
  fee BIGINT NOT NULL,
  blockchain_hash VARCHAR(255),
  status VARCHAR(20) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create ai_agent_logs table
CREATE TABLE IF NOT EXISTS ai_agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  agent_name VARCHAR(100) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL,
  description TEXT,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indices for performance
CREATE INDEX idx_businesses_user ON businesses(user_id);
CREATE INDEX idx_transactions_business ON transactions(business_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_ai_logs_business ON ai_agent_logs(business_id);
CREATE INDEX idx_ai_logs_agent ON ai_agent_logs(agent_name);
```

### Step 4: Set Environment Variables

Create or update `.env` file:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...

# Optional
VITE_API_URL=http://localhost:5173
NODE_ENV=development
```

### Step 5: Enable Row Level Security (RLS)

In Supabase dashboard:

1. Go to Authentication → Policies
2. Enable RLS for each table:
   - businesses
   - transactions
   - ai_agent_logs
3. Create policies to allow users to see only their own data

```sql
-- Example RLS policy for businesses
CREATE POLICY "Users can read their own businesses"
ON businesses FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own businesses"
ON businesses FOR INSERT
WITH CHECK (user_id = auth.uid());
```

## Running the System

### Start Development Server

```bash
# Install dependencies (if not already done)
npm install

# Start dev server (includes Express + AI agents)
npm run dev
```

The server will:
- ✅ Start Vite on http://localhost:5173
- ✅ Start Express API on same port
- ✅ Initialize AI agents
- ✅ Log agent status to console

### Verify Setup

Check console for output like:
```
🤖 AI Agent Manager started
Active agents: 6
✅ Registered: KYC Verification Agent
✅ Registered: Settlement Agent
✅ Registered: Fraud Detection Agent
✅ Registered: Analytics Agent
✅ Registered: Customer Engagement Agent
✅ Registered: Performance Optimization Agent
```

### Test Registration Flow

1. Open http://localhost:5173/
2. Click "Start Free Trial" (SME) or "Enterprise Solutions"
3. Fill out registration form
4. Submit
5. Should see success message
6. Check database in Supabase for new business record

### Test Dashboard

1. Visit http://localhost:5173/dashboard
2. See analytics and transactions
3. Check agent logs in Supabase: `ai_agent_logs` table

### Check AI Agent Status

```bash
# In terminal
curl http://localhost:5173/api/ai-agents/status

# Output should be:
# {
#   "status": "active",
#   "agents": [...],
#   "active_count": 6
# }
```

## Integration with Your App

### Register a Business Programmatically

```javascript
const response = await fetch('/api/register-business', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My Business',
    type: 'sme',
    email: 'business@example.com',
    phone: '+1234567890',
    website: 'https://example.com',
    description: 'My awesome business',
    industry: 'Retail',
    country: 'US',
    settlement_currency: 'USD',
    settlement_frequency: 'daily',
    full_name: 'John Doe'
  })
});

const data = await response.json();
console.log('Business registered!', data.business_id);
console.log('API Key:', data.api_key);
```

### Get Business Analytics

```javascript
const response = await fetch('/api/business/biz_12345/analytics');
const data = await response.json();

console.log('Total Revenue:', data.data.total_revenue / 100, 'USD');
console.log('Transactions:', data.data.total_transactions);
console.log('KYC Status:', data.data.kyc_status);
```

## Monitoring AI Agents

### View Agent Logs in Supabase

1. Go to Supabase Dashboard
2. Select your project
3. Go to "SQL Editor"
4. Run:
```sql
SELECT * FROM ai_agent_logs 
ORDER BY created_at DESC 
LIMIT 50;
```

### Agent Status Checks

**Check KYC Status:**
```sql
SELECT id, name, kyc_status, aml_check_status, created_at 
FROM businesses 
WHERE kyc_status != 'verified'
ORDER BY created_at DESC;
```

**Check Settlement History:**
```sql
SELECT * FROM transactions 
WHERE type = 'settlement' 
ORDER BY created_at DESC 
LIMIT 20;
```

**View Fraud Alerts:**
```sql
SELECT * FROM ai_agent_logs 
WHERE agent_name = 'Fraud Detection Agent' 
AND status = 'success'
ORDER BY created_at DESC;
```

## Production Deployment

### Before Going Live

1. **Database Backups**
   - Enable automatic backups in Supabase
   - Set backup frequency (daily recommended)

2. **RLS Security**
   - Ensure all RLS policies are set up
   - Test that users can only access their data

3. **API Keys**
   - Use environment variables for all secrets
   - Rotate keys monthly

4. **Monitoring**
   - Set up error tracking (Sentry, etc.)
   - Monitor AI agent logs
   - Track API response times

5. **Testing**
   - Run full e2e test suite
   - Load test the API
   - Test registration flows

### Deploy to Production

```bash
# Build
npm run build

# The build outputs:
# - dist/spa/ (frontend assets)
# - dist/server/ (backend server)

# Deploy to your hosting (Netlify, Vercel, Render, etc.)
npm start
```

## Troubleshooting

### AI Agents Not Running
```
Check console for: "Error executing agent"

Solution:
1. Verify Supabase connection
2. Check environment variables
3. Ensure database tables exist
4. Review agent logs in Supabase
```

### Registration Fails
```
Check server logs for validation errors

Common issues:
1. Email format incorrect
2. Country code not 2 letters
3. Missing required fields
4. Supabase connection issue
```

### Dashboard Not Showing Data
```
1. Verify business ID exists in database
2. Check if email is verified
3. Ensure KYC agent has run
4. Check browser console for errors
```

## Next Steps

1. ✅ Set up Supabase database
2. ✅ Create tables using SQL
3. ✅ Set environment variables
4. ✅ Start dev server
5. ✅ Test registration flow
6. ✅ View dashboard
7. ✅ Monitor AI agents
8. ✅ Deploy to production

## Support

- Check console logs for errors
- Review Supabase dashboard
- Check database directly via SQL Editor
- View E2E tests for example usage
- Read system architecture docs

---

**Status**: Ready for Production
**Last Updated**: January 17, 2024
