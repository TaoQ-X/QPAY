import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * Advanced Rate Limiting & DDoS Protection Middleware
 * Multi-level rate limiting with adaptive thresholds
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

export interface ClientRateLimitData {
  count: number;
  resetTime: number;
  suspicious: boolean;
  blockUntil?: number;
}

export class RateLimiter {
  private clients: Map<string, ClientRateLimitData> = new Map();
  private blockedIPs: Set<string> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = {}) {
    this.config = {
      windowMs: config.windowMs || 60 * 1000, // 1 minute default
      maxRequests: config.maxRequests || 100,
      keyGenerator: config.keyGenerator || ((req) => this.getClientKey(req)),
      skip: config.skip,
    };

    // Cleanup old entries every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  /**
   * Express middleware
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        if (this.config.skip?.(req)) {
          return next();
        }

        const clientKey = this.config.keyGenerator!(req);

        // Check if client is blocked
        if (this.isClientBlocked(clientKey)) {
          return res.status(429).json({
            error: "Too many requests",
            retryAfter: this.getBlockTimeRemaining(clientKey),
          });
        }

        // Check rate limit
        const allowed = this.checkRateLimit(clientKey);

        if (!allowed) {
          // Mark as suspicious after multiple violations
          const data = this.clients.get(clientKey);
          if (data) {
            data.suspicious = true;

            // Auto-block after 10 violations in 5 minutes
            if (data.count > 10) {
              this.blockClient(clientKey, 5 * 60 * 1000); // 5 minute block
            }
          }

          return res.status(429).json({
            error: "Rate limit exceeded",
            retryAfter: this.config.windowMs / 1000,
          });
        }

        // Add rate limit headers
        const remaining = this.getRemainingRequests(clientKey);
        res.setHeader("X-RateLimit-Limit", this.config.maxRequests);
        res.setHeader("X-RateLimit-Remaining", remaining);
        res.setHeader("X-RateLimit-Reset", this.getResetTime(clientKey));

        next();
      } catch (error) {
        console.error("[RateLimiter] Error:", error);
        next(); // Allow request to proceed on error
      }
    };
  }

  /**
   * Check if request is allowed
   */
  private checkRateLimit(clientKey: string): boolean {
    const now = Date.now();
    let data = this.clients.get(clientKey);

    if (!data) {
      // New client
      data = {
        count: 1,
        resetTime: now + this.config.windowMs,
        suspicious: false,
      };
      this.clients.set(clientKey, data);
      return true;
    }

    // Check if window has passed
    if (now > data.resetTime) {
      data.count = 1;
      data.resetTime = now + this.config.windowMs;
      data.suspicious = false;
      return true;
    }

    // Within window
    if (data.count < this.config.maxRequests) {
      data.count++;
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests for client
   */
  private getRemainingRequests(clientKey: string): number {
    const data = this.clients.get(clientKey);
    if (!data) return this.config.maxRequests;
    return Math.max(0, this.config.maxRequests - data.count);
  }

  /**
   * Get reset time for client
   */
  private getResetTime(clientKey: string): number {
    const data = this.clients.get(clientKey);
    if (!data) return Date.now() + this.config.windowMs;
    return data.resetTime;
  }

  /**
   * Block client for specified duration
   */
  private blockClient(clientKey: string, duration: number = 60 * 1000) {
    const data = this.clients.get(clientKey);
    if (data) {
      data.blockUntil = Date.now() + duration;
      console.warn(`[RateLimiter] Blocked client: ${clientKey} for ${duration / 1000}s`);
    }
  }

  /**
   * Check if client is blocked
   */
  private isClientBlocked(clientKey: string): boolean {
    const data = this.clients.get(clientKey);
    if (!data || !data.blockUntil) return false;

    if (Date.now() > data.blockUntil) {
      data.blockUntil = undefined;
      return false;
    }

    return true;
  }

  /**
   * Get remaining block time
   */
  private getBlockTimeRemaining(clientKey: string): number {
    const data = this.clients.get(clientKey);
    if (!data || !data.blockUntil) return 0;

    const remaining = data.blockUntil - Date.now();
    return Math.ceil(remaining / 1000); // In seconds
  }

  /**
   * Get client identifier (IP or API key)
   */
  private getClientKey(req: Request): string {
    // Try API key first
    const apiKey = req.headers.authorization?.replace("Bearer ", "");
    if (apiKey) {
      return `api_${crypto.createHash("sha256").update(apiKey).digest("hex")}`;
    }

    // Fallback to IP
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
      req.socket.remoteAddress ||
      "unknown";

    return `ip_${ip}`;
  }

  /**
   * Cleanup old entries
   */
  private cleanup() {
    const now = Date.now();
    const toDelete: string[] = [];

    this.clients.forEach((data, key) => {
      // Remove entries older than 2x window size
      if (now > data.resetTime + this.config.windowMs) {
        toDelete.push(key);
      }
    });

    toDelete.forEach((key) => this.clients.delete(key));

    if (toDelete.length > 0) {
      console.log(`[RateLimiter] Cleaned up ${toDelete.length} entries`);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    const suspicious = Array.from(this.clients.values()).filter(
      (d) => d.suspicious
    ).length;
    const blocked = Array.from(this.clients.values()).filter(
      (d) => d.blockUntil && Date.now() < d.blockUntil
    ).length;

    return {
      totalClients: this.clients.size,
      suspiciousClients: suspicious,
      blockedClients: blocked,
      windowMs: this.config.windowMs,
      maxRequests: this.config.maxRequests,
    };
  }
}

/**
 * DDoS Protection Middleware
 * Detects and mitigates DDoS attacks
 */

export class DDoSProtection {
  private requestCounts: Map<string, number[]> = new Map(); // IP -> timestamps
  private attackThreshold: number;
  private timeWindow: number;

  constructor(attackThreshold: number = 100, timeWindow: number = 10000) {
    this.attackThreshold = attackThreshold; // Requests
    this.timeWindow = timeWindow; // milliseconds
  }

  /**
   * Check if request is part of DDoS attack
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
        req.socket.remoteAddress ||
        "unknown";

      if (this.isUnderAttack(ip)) {
        return res.status(503).json({
          error: "Service temporarily unavailable",
          message: "Too many requests from your IP",
        });
      }

      this.recordRequest(ip);
      next();
    };
  }

  /**
   * Check if IP is under attack
   */
  private isUnderAttack(ip: string): boolean {
    const timestamps = this.requestCounts.get(ip) || [];
    const now = Date.now();

    // Count requests in time window
    const recentRequests = timestamps.filter((t) => now - t < this.timeWindow);

    return recentRequests.length > this.attackThreshold;
  }

  /**
   * Record request timestamp
   */
  private recordRequest(ip: string) {
    const now = Date.now();
    let timestamps = this.requestCounts.get(ip) || [];

    // Keep only recent timestamps
    timestamps = timestamps.filter((t) => now - t < this.timeWindow * 2);
    timestamps.push(now);

    this.requestCounts.set(ip, timestamps);
  }

  /**
   * Get DDoS status
   */
  getStatus() {
    const now = Date.now();
    const underAttack: string[] = [];

    this.requestCounts.forEach((timestamps, ip) => {
      const recentRequests = timestamps.filter((t) => now - t < this.timeWindow);
      if (recentRequests.length > this.attackThreshold) {
        underAttack.push(`${ip}: ${recentRequests.length} requests`);
      }
    });

    return {
      underAttack: underAttack.length > 0,
      affectedIPs: underAttack,
      monitoredIPs: this.requestCounts.size,
    };
  }
}

export default RateLimiter;
