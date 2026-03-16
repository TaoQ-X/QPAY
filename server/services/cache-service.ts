/**
 * Caching Service
 * In-memory cache with TTL support
 * In production: Replace with Redis for distributed caching
 */

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  expiresAt: number;
  createdAt: number;
  hits: number;
  size: number; // bytes
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number; // bytes
  entries: number;
  hitRate: number;
}

export class CacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
  };
  private maxSize: number; // bytes
  private currentSize: number = 0;

  constructor(maxSizeInMB: number = 100) {
    this.maxSize = maxSizeInMB * 1024 * 1024;

    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);

    console.log("✅ Cache service initialized");
  }

  /**
   * Set cache entry
   */
  set<T>(
    key: string,
    value: T,
    ttlMs: number = 5 * 60 * 1000 // 5 minutes default
  ): boolean {
    try {
      // Remove old entry if exists
      if (this.cache.has(key)) {
        const old = this.cache.get(key)!;
        this.currentSize -= old.size;
      }

      // Calculate size
      const size = this.estimateSize(value);

      // Check if we have space
      if (this.currentSize + size > this.maxSize) {
        // Evict least recently used
        this.evictLRU(size);
      }

      const entry: CacheEntry<T> = {
        key,
        value,
        expiresAt: Date.now() + ttlMs,
        createdAt: Date.now(),
        hits: 0,
        size,
      };

      this.cache.set(key, entry);
      this.currentSize += size;

      return true;
    } catch (error) {
      console.error("[Cache] Error setting key:", error);
      return false;
    }
  }

  /**
   * Get cache entry
   */
  get<T>(key: string): T | null {
    try {
      const entry = this.cache.get(key);

      if (!entry) {
        this.stats.misses++;
        return null;
      }

      // Check expiration
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        this.currentSize -= entry.size;
        this.stats.misses++;
        return null;
      }

      // Update stats
      entry.hits++;
      this.stats.hits++;

      return entry.value as T;
    } catch (error) {
      console.error("[Cache] Error getting key:", error);
      return null;
    }
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      return false;
    }

    return true;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.currentSize -= entry.size;
    return true;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  /**
   * Cache decorator for functions
   */
  memoize<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    keyGenerator: (...args: Parameters<T>) => string,
    ttl: number = 5 * 60 * 1000
  ): T {
    return (async (...args: Parameters<T>) => {
      const key = keyGenerator(...args);

      // Check cache
      const cached = this.get(key);
      if (cached !== null) {
        return cached;
      }

      // Execute function
      const result = await fn(...args);

      // Cache result
      this.set(key, result, ttl);

      return result;
    }) as T;
  }

  /**
   * Cache statistics
   */
  getStats(): CacheStats {
    const totalHits = this.stats.hits + this.stats.misses;
    const hitRate = totalHits > 0 ? (this.stats.hits / totalHits) * 100 : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.currentSize,
      entries: this.cache.size,
      hitRate,
    };
  }

  /**
   * Get cache info
   */
  getInfo() {
    return {
      ...this.getStats(),
      maxSize: this.maxSize,
      utilizationPercent: ((this.currentSize / this.maxSize) * 100).toFixed(2),
      entries: Array.from(this.cache.values())
        .map((e) => ({
          key: e.key,
          hits: e.hits,
          size: e.size,
          expiresIn: Math.max(0, e.expiresAt - Date.now()),
        }))
        .sort((a, b) => b.hits - a.hits)
        .slice(0, 10), // Top 10 most hit entries
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let freed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        this.currentSize -= entry.size;
        freed++;
      }
    }

    if (freed > 0) {
      console.log(`[Cache] Cleaned up ${freed} expired entries`);
    }
  }

  /**
   * Evict least recently used entries
   */
  private evictLRU(neededSpace: number): void {
    const entries = Array.from(this.cache.values()).sort(
      (a, b) => a.createdAt - b.createdAt
    );

    let freedSpace = 0;

    for (const entry of entries) {
      if (freedSpace >= neededSpace) break;

      this.cache.delete(entry.key);
      this.currentSize -= entry.size;
      freedSpace += entry.size;
    }

    console.log(
      `[Cache] Evicted LRU entries to free ${freedSpace} bytes`
    );
  }

  /**
   * Estimate object size in bytes (simplified)
   */
  private estimateSize(obj: any): number {
    try {
      const json = JSON.stringify(obj);
      return Buffer.byteLength(json, "utf8");
    } catch {
      return 1000; // Fallback estimate
    }
  }
}

/**
 * Cache middleware for Express routes
 */
export function cacheMiddleware(
  cache: CacheService,
  ttl: number = 5 * 60 * 1000
) {
  return (req: any, res: any, next: any) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const cacheKey = `${req.method}:${req.originalUrl}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      res.set("X-Cache", "HIT");
      return res.json(cached);
    }

    // Wrap response.json to cache the response
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      if (res.statusCode === 200) {
        cache.set(cacheKey, body, ttl);
        res.set("X-Cache", "MISS");
      }
      return originalJson(body);
    };

    next();
  };
}

export default CacheService;
