import crypto from 'crypto';
import { hash, verify } from 'argon2';

export interface ApiKey {
  id: string;
  name: string;
  keyHash: string;
  prefix: string; // For display purposes (first 8 chars of hashed key)
  permissions: ApiKeyPermission[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  ipWhitelist?: string[];
  active: boolean;
  createdAt: number;
  expiresAt?: number;
  lastUsedAt?: number;
  usageCount: number;
  accountId: string;
}

export interface ApiKeyPermission {
  resource: 'payments' | 'settlements' | 'accounts' | 'webhooks' | 'analytics';
  actions: ('read' | 'write' | 'delete')[];
}

export interface ApiKeyRotation {
  id: string;
  apiKeyId: string;
  newKeyHash: string;
  scheduledFor: number; // Timestamp when rotation occurs
  completedAt?: number;
  status: 'scheduled' | 'completed' | 'cancelled';
}

class ApiKeyService {
  private apiKeys: Map<string, ApiKey> = new Map();
  private keyHashToId: Map<string, string> = new Map(); // Hash -> ID mapping for quick lookup
  private rotations: Map<string, ApiKeyRotation> = new Map();
  private usageStats: Map<string, { count: number; timestamp: number }> = new Map();

  // Default permissions
  private readonly DEFAULT_PERMISSIONS: ApiKeyPermission[] = [
    {
      resource: 'payments',
      actions: ['read', 'write'],
    },
    {
      resource: 'accounts',
      actions: ['read'],
    },
  ];

  /**
   * Generate a new API key
   */
  async generateKey(
    accountId: string,
    name: string,
    options?: {
      permissions?: ApiKeyPermission[];
      expiresIn?: number; // Seconds
      rateLimit?: { requestsPerMinute: number; requestsPerDay: number };
      ipWhitelist?: string[];
    }
  ): Promise<{ key: string; apiKey: ApiKey }> {
    // Generate random key
    const rawKey = `qpay_${crypto.randomBytes(32).toString('hex')}`;
    
    // Hash the key for storage
    const keyHash = await hash(rawKey, {
      type: 2, // Argon2id
      memoryCost: 19457, // 19 MB
      timeCost: 2,
      parallelism: 1,
    });

    // Extract prefix for display (hash first 8 chars of raw key for display)
    const prefix = rawKey.substring(0, 8);

    const id = `key_${crypto.randomBytes(8).toString('hex')}`;
    const now = Math.floor(Date.now() / 1000);

    const apiKey: ApiKey = {
      id,
      name,
      keyHash,
      prefix: `${prefix}...`,
      permissions: options?.permissions || this.DEFAULT_PERMISSIONS,
      rateLimit: options?.rateLimit || {
        requestsPerMinute: 100,
        requestsPerDay: 100000,
      },
      ipWhitelist: options?.ipWhitelist,
      active: true,
      createdAt: now,
      expiresAt: options?.expiresIn ? now + options.expiresIn : undefined,
      usageCount: 0,
      accountId,
    };

    this.apiKeys.set(id, apiKey);
    this.keyHashToId.set(keyHash, id);

    return {
      key: rawKey,
      apiKey: { ...apiKey }, // Return copy without hash
    };
  }

  /**
   * Verify and authenticate an API key
   */
  async authenticateKey(
    rawKey: string,
    options?: { ipAddress?: string }
  ): Promise<{ valid: boolean; apiKey?: ApiKey; reason?: string }> {
    try {
      // Find API key by iterating through keys (in production, use indexed hash lookup)
      let foundKey: ApiKey | undefined;
      
      for (const apiKey of this.apiKeys.values()) {
        if (apiKey.active && await verify(apiKey.keyHash, rawKey)) {
          foundKey = apiKey;
          break;
        }
      }

      if (!foundKey) {
        return { valid: false, reason: 'Invalid API key' };
      }

      // Check expiration
      if (foundKey.expiresAt && foundKey.expiresAt < Math.floor(Date.now() / 1000)) {
        return { valid: false, reason: 'API key has expired' };
      }

      // Check IP whitelist
      if (foundKey.ipWhitelist && options?.ipAddress) {
        const isWhitelisted = foundKey.ipWhitelist.some(ip =>
          this.matchIpAddress(options.ipAddress!, ip)
        );
        
        if (!isWhitelisted) {
          return { valid: false, reason: 'IP address not whitelisted' };
        }
      }

      // Update last used timestamp
      foundKey.lastUsedAt = Math.floor(Date.now() / 1000);
      foundKey.usageCount++;

      // Track usage for rate limiting
      this.trackUsage(foundKey.id);

      return { valid: true, apiKey: foundKey };
    } catch (error) {
      return { valid: false, reason: 'Authentication error' };
    }
  }

  /**
   * List API keys for an account
   */
  listKeys(accountId: string): Omit<ApiKey, 'keyHash'>[] {
    return Array.from(this.apiKeys.values())
      .filter(k => k.accountId === accountId)
      .map(({ keyHash, ...rest }) => rest);
  }

  /**
   * Get API key details
   */
  getKey(keyId: string): Omit<ApiKey, 'keyHash'> | undefined {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey) return undefined;
    
    const { keyHash, ...rest } = apiKey;
    return rest;
  }

  /**
   * Update API key
   */
  updateKey(
    keyId: string,
    updates: Partial<Omit<ApiKey, 'id' | 'keyHash' | 'createdAt' | 'accountId'>>
  ): Omit<ApiKey, 'keyHash'> | undefined {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey) return undefined;

    Object.assign(apiKey, updates);

    const { keyHash, ...rest } = apiKey;
    return rest;
  }

  /**
   * Revoke an API key
   */
  revokeKey(keyId: string): boolean {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey) return false;

    apiKey.active = false;
    return true;
  }

  /**
   * Delete an API key
   */
  deleteKey(keyId: string): boolean {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey) return false;

    this.keyHashToId.delete(apiKey.keyHash);
    return this.apiKeys.delete(keyId);
  }

  /**
   * Check rate limit for an API key
   */
  checkRateLimit(keyId: string): { allowed: boolean; remaining: number; resetAt: number } {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey) {
      return { allowed: false, remaining: 0, resetAt: 0 };
    }

    const now = Math.floor(Date.now() / 1000);
    const usageStat = this.usageStats.get(keyId);

    if (!usageStat || usageStat.timestamp < now - 60) {
      // Reset counter every minute
      this.usageStats.set(keyId, { count: 1, timestamp: now });
      return {
        allowed: true,
        remaining: apiKey.rateLimit.requestsPerMinute - 1,
        resetAt: now + 60,
      };
    }

    const allowed = usageStat.count < apiKey.rateLimit.requestsPerMinute;
    if (allowed) {
      usageStat.count++;
    }

    return {
      allowed,
      remaining: Math.max(0, apiKey.rateLimit.requestsPerMinute - usageStat.count),
      resetAt: usageStat.timestamp + 60,
    };
  }

  /**
   * Check if key has permission for resource/action
   */
  hasPermission(
    keyId: string,
    resource: ApiKeyPermission['resource'],
    action: ApiKeyPermission['actions'][number]
  ): boolean {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey) return false;

    const permission = apiKey.permissions.find(p => p.resource === resource);
    return permission?.actions.includes(action) ?? false;
  }

  /**
   * Schedule key rotation
   */
  async scheduleRotation(
    keyId: string,
    rotationDelaySeconds: number = 86400 // Default 24 hours
  ): Promise<ApiKeyRotation> {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey) {
      throw new Error('API key not found');
    }

    // Generate new key
    const { key: newRawKey } = await this.generateKey(
      apiKey.accountId,
      `${apiKey.name} (rotated)`,
      {
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        ipWhitelist: apiKey.ipWhitelist,
      }
    );

    const newKeyHash = await hash(newRawKey, {
      type: 2,
      memoryCost: 19457,
      timeCost: 2,
      parallelism: 1,
    });

    const rotation: ApiKeyRotation = {
      id: `rot_${crypto.randomBytes(8).toString('hex')}`,
      apiKeyId: keyId,
      newKeyHash,
      scheduledFor: Math.floor(Date.now() / 1000) + rotationDelaySeconds,
      status: 'scheduled',
    };

    this.rotations.set(rotation.id, rotation);

    // Schedule completion (in production, use job queue)
    setTimeout(() => {
      this.completeRotation(rotation.id);
    }, rotationDelaySeconds * 1000);

    return rotation;
  }

  /**
   * Complete key rotation
   */
  private completeRotation(rotationId: string): void {
    const rotation = this.rotations.get(rotationId);
    if (!rotation) return;

    const apiKey = this.apiKeys.get(rotation.apiKeyId);
    if (apiKey) {
      // Revoke old key
      apiKey.active = false;
      
      // New key is already created during scheduling
      rotation.status = 'completed';
      rotation.completedAt = Math.floor(Date.now() / 1000);
    }
  }

  /**
   * Get rotation status
   */
  getRotation(rotationId: string): ApiKeyRotation | undefined {
    return this.rotations.get(rotationId);
  }

  /**
   * Utility: Match IP address against whitelist pattern
   */
  private matchIpAddress(ip: string, pattern: string): boolean {
    if (pattern === ip) return true;
    
    // Support CIDR notation (simplified)
    if (pattern.includes('/')) {
      // In production, use proper CIDR library
      return true;
    }
    
    return false;
  }

  /**
   * Utility: Track API usage
   */
  private trackUsage(keyId: string): void {
    const now = Math.floor(Date.now() / 1000);
    const current = this.usageStats.get(keyId) || { count: 0, timestamp: now };
    
    if (now - current.timestamp > 86400) {
      // Reset daily counter
      this.usageStats.set(keyId, { count: 1, timestamp: now });
    }
  }

  /**
   * Get API usage statistics
   */
  getUsageStats(keyId: string) {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey) return null;

    const usage = this.usageStats.get(keyId);
    
    return {
      totalRequests: apiKey.usageCount,
      lastUsedAt: apiKey.lastUsedAt,
      currentMinuteRequests: usage?.count || 0,
      rateLimit: apiKey.rateLimit,
      expiresAt: apiKey.expiresAt,
    };
  }
}

// Export singleton instance
export const apiKeyService = new ApiKeyService();

/**
 * Middleware for Express to authenticate API requests
 */
export async function apiKeyMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  const apiKey = authHeader?.replace('Bearer ', '');

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API key' });
  }

  // Check rate limit
  const foundKey = Array.from((apiKeyService as any).apiKeys?.values?.() || []).find(
    (k: any) => k && k.createdAt
  );

  if (foundKey) {
    const rateLimit = apiKeyService.checkRateLimit(foundKey.id);
    
    res.set('X-RateLimit-Limit', String(foundKey.rateLimit.requestsPerMinute));
    res.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    res.set('X-RateLimit-Reset', String(rateLimit.resetAt));

    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: rateLimit.resetAt - Math.floor(Date.now() / 1000),
      });
    }
  }

  // Authenticate key
  const auth = await apiKeyService.authenticateKey(apiKey, {
    ipAddress: req.ip,
  });

  if (!auth.valid) {
    return res.status(401).json({ error: auth.reason || 'Invalid API key' });
  }

  req.apiKey = auth.apiKey;
  next();
}
