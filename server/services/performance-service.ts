import { Database } from "../types/database";

export interface IndexDefinition {
  name: string;
  table: string;
  columns: string[];
  type: "btree" | "hash" | "brin" | "gin"; // PostgreSQL index types
  unique?: boolean;
  partial?: string; // WHERE clause
}

export interface QueryOptimizationTip {
  issue: string;
  severity: "low" | "medium" | "high" | "critical";
  recommendation: string;
  impact: string;
  example: string;
}

export interface CacheStrategy {
  key: string;
  table: string;
  ttl: number; // seconds
  refreshRate: number; // seconds
  dependencies: string[]; // tables that invalidate this cache
}

export interface PerformanceMetrics {
  queryTimeMs: number;
  rowsScanned: number;
  indexUsed: boolean;
  estimatedCost: number;
  executionPlan: string;
}

class PerformanceService {
  private cacheMap: Map<string, { value: any; expiry: number }> = new Map();

  /**
   * Get all recommended database indexes for optimal performance
   */
  getRecommendedIndexes(): IndexDefinition[] {
    return [
      // Users table indexes
      {
        name: "idx_users_email",
        table: "users",
        columns: ["email"],
        type: "btree",
        unique: true,
      },
      {
        name: "idx_users_status",
        table: "users",
        columns: ["status"],
        type: "btree",
      },
      {
        name: "idx_users_created_at",
        table: "users",
        columns: ["created_at"],
        type: "brin", // BRIN for timestamp ranges
      },
      
      // Transactions table indexes (most frequently queried)
      {
        name: "idx_transactions_user_id",
        table: "transactions",
        columns: ["user_id"],
        type: "btree",
      },
      {
        name: "idx_transactions_status",
        table: "transactions",
        columns: ["status"],
        type: "btree",
      },
      {
        name: "idx_transactions_created_at",
        table: "transactions",
        columns: ["created_at"],
        type: "brin",
      },
      {
        name: "idx_transactions_user_created",
        table: "transactions",
        columns: ["user_id", "created_at"],
        type: "btree", // Composite index for common queries
      },
      {
        name: "idx_transactions_status_created",
        table: "transactions",
        columns: ["status", "created_at"],
        type: "btree",
      },
      
      // Settlement table indexes
      {
        name: "idx_settlements_user_id",
        table: "settlements",
        columns: ["user_id"],
        type: "btree",
      },
      {
        name: "idx_settlements_status",
        table: "settlements",
        columns: ["status"],
        type: "btree",
      },
      {
        name: "idx_settlements_created_at",
        table: "settlements",
        columns: ["created_at"],
        type: "brin",
      },
      
      // Webhooks table indexes
      {
        name: "idx_webhooks_user_id",
        table: "webhooks",
        columns: ["user_id"],
        type: "btree",
      },
      {
        name: "idx_webhooks_status",
        table: "webhooks",
        columns: ["status"],
        type: "btree",
      },
      
      // Disputes table indexes
      {
        name: "idx_disputes_transaction_id",
        table: "disputes",
        columns: ["transaction_id"],
        type: "btree",
      },
      {
        name: "idx_disputes_status",
        table: "disputes",
        columns: ["status"],
        type: "btree",
      },
      {
        name: "idx_disputes_created_at",
        table: "disputes",
        columns: ["created_at"],
        type: "brin",
      },
      
      // Full-text search index
      {
        name: "idx_transactions_search",
        table: "transactions",
        columns: ["description"],
        type: "gin", // GIN for text search
      },
      {
        name: "idx_disputes_description_search",
        table: "disputes",
        columns: ["description"],
        type: "gin",
      },
    ];
  }

  /**
   * Get recommended cache strategies for frequently accessed data
   */
  getCacheStrategies(): CacheStrategy[] {
    return [
      {
        key: "user:rates",
        table: "users",
        ttl: 3600, // 1 hour
        refreshRate: 300, // refresh every 5 minutes
        dependencies: ["users"],
      },
      {
        key: "transaction:monthly_stats",
        table: "transactions",
        ttl: 1800, // 30 minutes
        refreshRate: 600, // refresh every 10 minutes
        dependencies: ["transactions"],
      },
      {
        key: "settlement:pending",
        table: "settlements",
        ttl: 600, // 10 minutes
        refreshRate: 300,
        dependencies: ["settlements"],
      },
      {
        key: "user:fraud_score:{userId}",
        table: "users",
        ttl: 300, // 5 minutes
        refreshRate: 60,
        dependencies: ["transactions", "fraud_events"],
      },
      {
        key: "api_key:permissions:{keyId}",
        table: "api_keys",
        ttl: 7200, // 2 hours
        refreshRate: 1800,
        dependencies: ["api_keys"],
      },
      {
        key: "country:fees",
        table: "system_config",
        ttl: 86400, // 24 hours
        refreshRate: 43200,
        dependencies: ["system_config"],
      },
    ];
  }

  /**
   * Get query optimization tips based on common patterns
   */
  getQueryOptimizationTips(): QueryOptimizationTip[] {
    return [
      {
        issue: "N+1 Query Problem",
        severity: "high",
        recommendation: "Use JOINs instead of fetching related data in loops",
        impact: "Reduces database queries by 90%, improves response time by 2-5x",
        example: `
          // ❌ Bad: N+1 queries
          const users = await db.query('SELECT * FROM users');
          for (const user of users) {
            const transactions = await db.query('SELECT * FROM transactions WHERE user_id = $1', [user.id]);
          }
          
          // ✅ Good: Single JOIN query
          const data = await db.query(\`
            SELECT u.*, t.* FROM users u
            LEFT JOIN transactions t ON u.id = t.user_id
          \`);
        `,
      },
      {
        issue: "Missing Indexes on WHERE clauses",
        severity: "critical",
        recommendation: "Create indexes on columns used in WHERE, JOIN, and ORDER BY",
        impact: "Query time reduced from seconds to milliseconds",
        example: `
          // ❌ Without index: Full table scan (~1000ms for 1M rows)
          SELECT * FROM transactions WHERE status = 'pending';
          
          // ✅ With index: Seek operation (~1ms)
          CREATE INDEX idx_transactions_status ON transactions(status);
        `,
      },
      {
        issue: "Fetching all columns when only few needed",
        severity: "medium",
        recommendation: "Select only required columns",
        impact: "Reduces data transfer and memory usage by 50-80%",
        example: `
          // ❌ Bad: Fetch all columns
          SELECT * FROM users WHERE id = $1;
          
          // ✅ Good: Select only needed columns
          SELECT id, email, name FROM users WHERE id = $1;
        `,
      },
      {
        issue: "No pagination on large result sets",
        severity: "high",
        recommendation: "Use LIMIT and OFFSET for pagination",
        impact: "Reduces memory usage and API response time",
        example: `
          // ❌ Bad: Load all transactions
          SELECT * FROM transactions;
          
          // ✅ Good: Paginate results
          SELECT * FROM transactions LIMIT 50 OFFSET $1;
        `,
      },
      {
        issue: "Inefficient LIKE queries",
        severity: "medium",
        recommendation: "Use full-text search for text matching",
        impact: "Search speed improved from seconds to milliseconds",
        example: `
          // ❌ Slow for large tables
          SELECT * FROM transactions WHERE description LIKE '%payment%';
          
          // ✅ Fast with full-text index
          SELECT * FROM transactions WHERE to_tsvector(description) @@ to_tsquery('payment');
        `,
      },
      {
        issue: "No connection pooling",
        severity: "critical",
        recommendation: "Use connection pooling (PgBouncer, pgpool)",
        impact: "Handles 10x more concurrent connections",
        example: "Configure PgBouncer with pool_mode=transaction",
      },
      {
        issue: "Unindexed FOREIGN KEY relationships",
        severity: "high",
        recommendation: "Create indexes on foreign key columns",
        impact: "JOINs become 100x faster",
        example: `
          CREATE INDEX idx_transactions_user_id ON transactions(user_id);
          CREATE INDEX idx_settlements_user_id ON settlements(user_id);
        `,
      },
      {
        issue: "Caching expensive operations",
        severity: "high",
        recommendation: "Cache results of expensive calculations",
        impact: "Response time reduced by 10-100x for cache hits",
        example: `
          const cached = cache.get('user:fraud_score:123');
          if (!cached) {
            const score = calculateFraudScore(userId);
            cache.set('user:fraud_score:123', score, 300); // 5 min TTL
          }
        `,
      },
    ];
  }

  /**
   * Generate SQL for creating indexes
   */
  generateIndexSQL(): string[] {
    const indexes = this.getRecommendedIndexes();
    return indexes.map(idx => {
      const columns = idx.columns.join(", ");
      const unique = idx.unique ? "UNIQUE" : "";
      const partial = idx.partial ? ` WHERE ${idx.partial}` : "";
      
      return `CREATE ${unique} INDEX CONCURRENTLY ${idx.name} ON ${idx.table} USING ${idx.type} (${columns})${partial};`;
    });
  }

  /**
   * In-memory caching implementation
   */
  cache<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cacheMap.set(key, { value, expiry });
  }

  /**
   * Retrieve cached value
   */
  getCached<T>(key: string): T | null {
    const item = this.cacheMap.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cacheMap.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  /**
   * Invalidate cache by pattern
   */
  invalidateCache(pattern: string): number {
    let count = 0;
    for (const [key] of this.cacheMap) {
      if (key.includes(pattern)) {
        this.cacheMap.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      totalKeys: this.cacheMap.size,
      cacheSize: this.cacheMap.size,
      hitRate: "N/A", // Would track with separate metrics
      memoryUsage: JSON.stringify(Array.from(this.cacheMap.values())).length,
    };
  }

  /**
   * Database query optimization analysis
   */
  analyzeQuery(sql: string, executionTimeMs: number): PerformanceMetrics {
    // Simulate query analysis (in production, use EXPLAIN ANALYZE)
    const rowsScanned = this.estimateRowsScanned(sql);
    const hasIndex = this.checkIndexUsage(sql);
    const estimatedCost = this.estimateQueryCost(sql);

    return {
      queryTimeMs: executionTimeMs,
      rowsScanned,
      indexUsed: hasIndex,
      estimatedCost,
      executionPlan: `Query execution: ${hasIndex ? "Index Seek" : "Table Scan"}`,
    };
  }

  /**
   * Batch processing helper for large operations
   */
  async batchProcess<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 100
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);
      
      // Small delay between batches to avoid overwhelming the database
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Get database statistics for monitoring
   */
  getDatabaseStats() {
    return {
      indexes: {
        recommended: this.getRecommendedIndexes().length,
        status: "Check system for actual indexes",
      },
      caching: {
        strategies: this.getCacheStrategies().length,
        enabled: true,
        ttlRange: "5 minutes to 24 hours",
      },
      optimization: {
        tips: this.getQueryOptimizationTips().length,
        criticalIssues: 3,
      },
      monitoring: {
        slowQueryThreshold: 100, // ms
        statementTimeout: 30000, // ms
        logConnections: true,
      },
    };
  }

  // Helper methods
  private estimateRowsScanned(sql: string): number {
    if (sql.includes("WHERE")) return 100; // Index usage reduces this
    return 10000; // Full table scan
  }

  private checkIndexUsage(sql: string): boolean {
    const indexFriendlyPatterns = ["WHERE", "JOIN", "ORDER BY"];
    return indexFriendlyPatterns.some(pattern => sql.includes(pattern));
  }

  private estimateQueryCost(sql: string): number {
    if (sql.includes("GROUP BY")) return 500;
    if (sql.includes("JOIN")) return 300;
    if (sql.includes("WHERE")) return 100;
    return 1000; // Full table scan
  }
}

export const performanceService = new PerformanceService();
