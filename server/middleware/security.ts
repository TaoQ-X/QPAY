import { Request, Response, NextFunction } from "express";
import { securityHardeningService, InputValidationRule } from "../services/security-hardening-service";

/**
 * Apply all security headers to response
 */
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const headers = securityHardeningService.getSecurityHeaders();
  
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  next();
};

/**
 * Generic rate limiting middleware
 */
export const createRateLimitMiddleware = (
  windowMs: number,
  maxRequests: number,
  keyGenerator: (req: Request) => string
) => {
  return securityHardeningService.createRateLimiter({
    windowMs,
    maxRequests,
    keyGenerator,
  });
};

/**
 * Pre-configured rate limiters for common endpoints
 */
export const rateLimiters = securityHardeningService.getRateLimiters();

/**
 * IP blocking middleware
 */
export const ipBlockingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || "unknown";
  
  if (securityHardeningService.isIPBlocked(clientIP)) {
    return res.status(403).json({ error: "Access denied" });
  }
  
  next();
};

/**
 * Input validation middleware factory
 */
export const validateInputMiddleware = (rules: InputValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { isValid, errors } = securityHardeningService.validateInput(req.body, rules);
    
    if (!isValid) {
      return res.status(400).json({ errors });
    }
    
    next();
  };
};

/**
 * CSRF token validation middleware
 */
export const csrfProtectionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF check for GET, HEAD, OPTIONS
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }
  
  const token = req.headers["x-csrf-token"] as string;
  const sessionToken = req.session?.csrfToken as string;
  
  if (!token || !sessionToken) {
    return res.status(403).json({ error: "CSRF token missing" });
  }
  
  try {
    if (!securityHardeningService.verifyCSRFToken(token, sessionToken)) {
      return res.status(403).json({ error: "Invalid CSRF token" });
    }
  } catch (error) {
    return res.status(403).json({ error: "CSRF validation failed" });
  }
  
  next();
};

/**
 * Input sanitization middleware
 */
export const sanitizeInputMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === "object") {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === "string") {
        req.body[key] = securityHardeningService.sanitizeInput(req.body[key]);
      }
    });
  }
  
  next();
};

/**
 * XSS protection middleware
 */
export const xssProtectionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check for common XSS patterns
  const xssPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];
  
  const checkValue = (value: any): boolean => {
    if (typeof value === "string") {
      return xssPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === "object" && value !== null) {
      return Object.values(value).some(v => checkValue(v));
    }
    return false;
  };
  
  if (checkValue(req.body)) {
    return res.status(400).json({ error: "Suspicious input detected" });
  }
  
  next();
};

/**
 * SQL injection detection middleware
 */
export const sqlInjectionProtectionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const checkValue = (value: any): boolean => {
    if (typeof value === "string") {
      return !securityHardeningService.getOWASPProtections().preventSQLInjection(value);
    }
    if (typeof value === "object" && value !== null) {
      return Object.values(value).some(v => checkValue(v));
    }
    return false;
  };
  
  if (checkValue(req.body)) {
    return res.status(400).json({ error: "Invalid input format" });
  }
  
  next();
};

/**
 * Request logging middleware for security audit
 */
export const securityAuditLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log successful authentication
    if (req.path === "/auth/login" && res.statusCode === 200) {
      console.log(`[SECURITY] Successful login for user: ${req.body?.email}`);
    }
    
    // Log failed authentication
    if (req.path === "/auth/login" && res.statusCode >= 400) {
      const clientIP = req.ip || req.connection.remoteAddress;
      console.log(`[SECURITY] Failed login attempt from ${clientIP}`);
    }
    
    // Log unauthorized access attempts
    if (res.statusCode === 403) {
      console.log(`[SECURITY] Unauthorized access attempt: ${req.method} ${req.path}`);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * API key validation middleware
 */
export const apiKeyValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers["x-api-key"] as string;
  
  if (!apiKey) {
    return res.status(401).json({ error: "API key missing" });
  }
  
  // Validate API key format
  if (!/^sk_(live|test)_[a-z0-9]{32}$/.test(apiKey)) {
    return res.status(401).json({ error: "Invalid API key format" });
  }
  
  // In production, verify against database
  // const isValid = await apiKeyService.validateKey(apiKey);
  // if (!isValid) {
  //   return res.status(401).json({ error: "Invalid API key" });
  // }
  
  next();
};

/**
 * Webhook signature validation middleware
 */
export const webhookSignatureValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const signature = req.headers["x-signature"] as string;
  const webhookSecret = process.env.WEBHOOK_SECRET;
  
  if (!signature || !webhookSecret) {
    return res.status(401).json({ error: "Signature validation failed" });
  }
  
  const data = JSON.stringify(req.body);
  const owasp = securityHardeningService.getOWASPProtections();
  
  // Create expected signature
  const expectedSignature = require("crypto")
    .createHmac("sha256", webhookSecret)
    .update(data)
    .digest("hex");
  
  // Use timing-safe comparison
  if (!require("crypto").timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )) {
    return res.status(401).json({ error: "Invalid webhook signature" });
  }
  
  next();
};

/**
 * Request timeout middleware
 */
export const requestTimeoutMiddleware = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({ error: "Request timeout" });
      }
    }, timeoutMs);
    
    res.on("finish", () => clearTimeout(timeout));
    res.on("close", () => clearTimeout(timeout));
    
    next();
  };
};

/**
 * CORS configuration middleware
 */
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = (process.env.CORS_WHITELIST || "https://qpay.io").split(",");
  const origin = req.headers.origin as string;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key, X-CSRF-Token");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
};

/**
 * Suspicious activity detection middleware
 */
export const suspiciousActivityDetectionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || "unknown";
  
  // Check for common attack patterns
  const suspiciousPatterns = [
    { pattern: "union.*select", name: "sql_injection" },
    { pattern: "<script", name: "xss" },
    { pattern: "\\.\\.\\/", name: "path_traversal" },
    { pattern: "%00", name: "null_byte" },
  ];
  
  for (const { pattern, name } of suspiciousPatterns) {
    const regex = new RegExp(pattern, "i");
    const fullUrl = `${req.method} ${req.path} ${JSON.stringify(req.body)}`;
    
    if (regex.test(fullUrl)) {
      if (securityHardeningService.detectSuspiciousPattern(name, clientIP)) {
        return res.status(403).json({ error: "Access denied" });
      }
    }
  }
  
  next();
};

/**
 * Compose all security middleware
 */
export const securityMiddlewareStack = [
  ipBlockingMiddleware,
  securityHeadersMiddleware,
  corsMiddleware,
  suspiciousActivityDetectionMiddleware,
  xssProtectionMiddleware,
  sqlInjectionProtectionMiddleware,
  sanitizeInputMiddleware,
  securityAuditLoggingMiddleware,
  requestTimeoutMiddleware(30000),
];

/**
 * Export factory for easy application
 */
export function applySecurityMiddleware(app: any) {
  securityMiddlewareStack.forEach(middleware => app.use(middleware));
}
