# Database Performance Optimization Guide

## Overview
This guide provides comprehensive strategies for optimizing QPay's database performance to handle enterprise-scale transaction volumes.

## 1. Index Strategy

### Quick Index Setup
```sql
-- Run all recommended indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users USING btree (email);
CREATE INDEX CONCURRENTLY idx_users_status ON users USING btree (status);
CREATE INDEX CONCURRENTLY idx_users_created_at ON users USING brin (created_at);

CREATE INDEX CONCURRENTLY idx_transactions_user_id ON transactions USING btree (user_id);
CREATE INDEX CONCURRENTLY idx_transactions_status ON transactions USING btree (status);
CREATE INDEX CONCURRENTLY idx_transactions_created_at ON transactions USING brin (created_at);
CREATE INDEX CONCURRENTLY idx_transactions_user_created ON transactions USING btree (user_id, created_at);
CREATE INDEX CONCURRENTLY idx_transactions_status_created ON transactions USING btree (status, created_at);

CREATE INDEX CONCURRENTLY idx_settlements_user_id ON settlements USING btree (user_id);
CREATE INDEX CONCURRENTLY idx_settlements_status ON settlements USING btree (status);
CREATE INDEX CONCURRENTLY idx_settlements_created_at ON settlements USING brin (created_at);

CREATE INDEX CONCURRENTLY idx_webhooks_user_id ON webhooks USING btree (user_id);
CREATE INDEX CONCURRENTLY idx_webhooks_status ON webhooks USING btree (status);

CREATE INDEX CONCURRENTLY idx_disputes_transaction_id ON disputes USING btree (transaction_id);
CREATE INDEX CONCURRENTLY idx_disputes_status ON disputes USING btree (status);
CREATE INDEX CONCURRENTLY idx_disputes_created_at ON disputes USING brin (created_at);

-- Full-text search indexes
CREATE INDEX CONCURRENTLY idx_transactions_search ON transactions USING gin (to_tsvector('english', description));
CREATE INDEX CONCURRENTLY idx_disputes_description_search ON disputes USING gin (to_tsvector('english', description));
```

### Index Types Explained

**BTREE (Balanced Tree)**
- Default index type
- Best for: Equality and range queries (=, <, >, BETWEEN)
- Use for: Foreign keys, status fields, timestamps with specific ranges

**BRIN (Block Range Index)**
- Compact, fast for sorted data
- Best for: Large tables with natural order (timestamps)
- Space efficient: 1000x smaller than BTREE for timestamp columns
- Use for: Created_at, updated_at columns on large tables

**GIN (Generalized Inverted Index)**
- Specialized for full-text search and arrays
- Best for: Text search, JSON arrays
- Use for: Description fields, search queries

**HASH**
- Only for equality comparisons
- Rarely needed, BTREE usually better

## 2. Query Optimization Patterns

### Pattern 1: Avoid N+1 Queries
```typescript
// ❌ BAD - N+1 Query Problem (1000+ queries for 1000 users)
const users = await db.query('SELECT * FROM users LIMIT 1000');
for (const user of users) {
  const transactions = await db.query(
    'SELECT * FROM transactions WHERE user_id = $1',
    [user.id]
  );
  user.transactions = transactions;
}

// ✅ GOOD - Single JOIN query
const results = await db.query(`
  SELECT 
    u.id, u.email, u.name,
    json_agg(
      json_build_object(
        'id', t.id,
        'amount', t.amount,
        'status', t.status
      )
    ) as transactions
  FROM users u
  LEFT JOIN transactions t ON u.id = t.user_id
  GROUP BY u.id
`);
```

### Pattern 2: Selective Column Selection
```typescript
// ❌ BAD - Load 50 columns when you only need 3
const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// ✅ GOOD - Select only needed columns
const user = await db.query(
  'SELECT id, email, name FROM users WHERE id = $1',
  [userId]
);
```

### Pattern 3: Efficient Pagination
```typescript
// ❌ BAD - OFFSET becomes slow with large numbers
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 50 OFFSET 100000;

// ✅ GOOD - Keyset pagination (seek method)
SELECT * FROM transactions 
WHERE created_at < $1 
ORDER BY created_at DESC 
LIMIT 50;
```

### Pattern 4: Full-Text Search
```typescript
// ❌ BAD - LIKE query does table scan
SELECT * FROM transactions 
WHERE description LIKE '%payment%';

// ✅ GOOD - Full-text search with index
SELECT * FROM transactions 
WHERE to_tsvector('english', description) @@ to_tsquery('payment');
```

## 3. Caching Strategy

### Cache Layers
1. **Application Cache** (5 min - 2 hours)
   - Fraud scores per user
   - User rate limits
   - API key permissions
   - Country fee configurations

2. **Query Result Cache** (10 - 30 min)
   - Monthly statistics
   - Settlement summaries
   - Dashboard metrics

3. **Redis Cache** (1 - 24 hours) - for distributed systems
   - Session data
   - Rate limiting counters
   - Webhook retry state

### Cache Invalidation Pattern
```typescript
// Invalidate cache when data changes
async function updateUserStatus(userId: string, status: string) {
  // Update database
  await db.query('UPDATE users SET status = $1 WHERE id = $2', [status, userId]);
  
  // Invalidate all related caches
  performanceService.invalidateCache(`user:${userId}`);
  performanceService.invalidateCache('user:rates'); // Bulk invalidation
  performanceService.invalidateCache('transaction:monthly_stats');
  
  return { success: true };
}
```

## 4. Connection Pooling

### PostgreSQL Connection Pool Configuration
```bash
# .env
DATABASE_POOL_MIN=5          # Minimum connections
DATABASE_POOL_MAX=20         # Maximum connections
DATABASE_IDLE_TIMEOUT=30000  # Close idle connections after 30s
DATABASE_STATEMENT_TIMEOUT=30000  # Kill queries after 30s
DATABASE_CONNECTION_TIMEOUT=5000  # Fail if can't connect in 5s
```

### Usage in Code
```typescript
const pool = new Pool({
  min: 5,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
```

## 5. Monitoring & Analysis

### Enable Query Logging
```sql
-- PostgreSQL configuration
ALTER DATABASE qpay SET log_min_duration_statement = 100; -- Log queries > 100ms
ALTER DATABASE qpay SET log_statement = 'all'; -- Log all statements
ALTER DATABASE qpay SET log_connections = on;
ALTER DATABASE qpay SET log_disconnections = on;
```

### Query Analysis with EXPLAIN
```sql
-- Understand query execution plan
EXPLAIN ANALYZE 
SELECT * FROM transactions 
WHERE user_id = '123' AND status = 'completed'
ORDER BY created_at DESC
LIMIT 50;
```

### Expected Output
```
Index Seek using idx_transactions_user_id (cost=0.42..1.23 rows=5)
Filter: status = 'completed'
Sort: created_at DESC
Limit: 50
```

## 6. Performance Targets

| Operation | Current | Target | Index Type |
|-----------|---------|--------|-----------|
| User lookup by email | ~50ms | <1ms | BTREE |
| Get user transactions | ~500ms | <10ms | Composite BTREE |
| Search transactions | ~1000ms | <50ms | GIN |
| Monthly statistics | ~2000ms | <500ms | Cache |
| Fraud score calculation | ~800ms | <100ms | Cache + Index |

## 7. Batch Processing Guidelines

### Safe Batch Size
```typescript
// Process items in batches to avoid memory/connection overload
const batchSize = 100; // Balance between throughput and resource usage

for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize);
  await processBatch(batch); // Single multi-row INSERT
  
  // Small delay between batches
  await new Promise(r => setTimeout(r, 100));
}
```

### Bulk Insert Pattern
```typescript
// ❌ BAD - 1000 individual INSERT statements
for (const item of items) {
  await db.query('INSERT INTO events VALUES ($1, $2, $3)', [item.a, item.b, item.c]);
}

// ✅ GOOD - Single bulk INSERT
const values = items.map(item => [item.a, item.b, item.c]);
await db.query(
  'INSERT INTO events VALUES ' + 
  values.map((_, i) => `($${i*3+1}, $${i*3+2}, $${i*3+3})`).join(','),
  values.flat()
);
```

## 8. Maintenance Tasks

### Weekly
```sql
-- Analyze table statistics
ANALYZE transactions;
ANALYZE users;
ANALYZE settlements;

-- Check index health
SELECT * FROM pg_stat_user_indexes;
```

### Monthly
```sql
-- Reindex to remove bloat
REINDEX INDEX CONCURRENTLY idx_transactions_user_id;
REINDEX INDEX CONCURRENTLY idx_transactions_status;

-- Vacuum to reclaim space
VACUUM ANALYZE transactions;
```

## 9. Scaling Strategies

### Read Replicas (for read-heavy workloads)
- Set up read replicas for reporting/analytics
- Keep write traffic on primary
- Use connection pooling to distribute reads

### Partitioning (for very large tables)
```sql
-- Partition transactions by date
CREATE TABLE transactions_2024_q1 PARTITION OF transactions
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
```

### Sharding (for distributed systems)
- Shard by user_id for transactions table
- Ensures related data stays together
- Improves cache locality

## 10. Implementation Checklist

- [ ] Create all recommended indexes
- [ ] Enable slow query logging
- [ ] Implement application caching layer
- [ ] Configure connection pooling
- [ ] Optimize N+1 queries
- [ ] Set up cache invalidation
- [ ] Monitor index usage
- [ ] Run EXPLAIN ANALYZE on slow queries
- [ ] Implement batch processing for bulk operations
- [ ] Set up automated maintenance tasks
- [ ] Monitor query performance metrics
- [ ] Document custom query patterns

## Resources
- PostgreSQL EXPLAIN: https://www.postgresql.org/docs/current/sql-explain.html
- Index Types: https://www.postgresql.org/docs/current/indexes-types.html
- Performance Tips: https://www.postgresql.org/docs/current/performance-tips.html
