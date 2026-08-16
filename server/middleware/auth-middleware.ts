import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth-service";
import Database from "../database/client";

/**
 * Authentication Middleware
 * Protects routes and validates JWT tokens
 */

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      merchantId?: string;
      sessionId?: string;
    }
  }
}

/**
 * Verify JWT token middleware
 */
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization token" });
    return;
  }

  const token = authHeader.substring(7);
  const decoded = authService.verifyAccessToken(token);

  if (!decoded) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.userId = decoded.userId;
  req.merchantId = decoded.merchantId;
  next();
};

/**
 * Verify API key middleware
 */
export const verifyAPIKey = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || typeof apiKey !== "string") {
    res.status(401).json({ error: "Missing API key" });
    return;
  }

  const validation = authService.validateAPIKey(apiKey);
  if (!validation.valid || !validation.keyHash) {
    res.status(401).json({ error: "Invalid API key" });
    return;
  }

  try {
    const key = await Database.getOne<{ business_id: string }>(
      `SELECT business_id FROM api_keys
       WHERE key_hash = $1 AND is_active = TRUE AND deleted_at IS NULL`,
      [validation.keyHash]
    );

    if (!key) {
      res.status(401).json({ error: "Invalid or revoked API key" });
      return;
    }

    req.merchantId = key.business_id;
    next();
  } catch (error) {
    console.error("API key lookup failed:", error);
    res.status(503).json({ error: "Authentication service unavailable" });
  }
};

/**
 * Verify both JWT and API key
 */
export const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers["x-api-key"];

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const decoded = authService.verifyAccessToken(token);

    if (decoded) {
      req.userId = decoded.userId;
      req.merchantId = decoded.merchantId;
      next();
      return;
    }
  }

  if (apiKey && typeof apiKey === "string") {
    const validation = authService.validateAPIKey(apiKey);
    if (validation.valid && validation.keyHash) {
      try {
        const key = await Database.getOne<{ business_id: string }>(
          `SELECT business_id FROM api_keys
           WHERE key_hash = $1 AND is_active = TRUE AND deleted_at IS NULL`,
          [validation.keyHash]
        );
        if (key) {
          req.merchantId = key.business_id;
          next();
          return;
        }
      } catch (error) {
        console.error("API key lookup failed:", error);
        res.status(503).json({ error: "Authentication service unavailable" });
        return;
      }
    }
  }

  res.status(401).json({ error: "Missing or invalid authentication" });
};

/**
 * Require merchant context
 */
export const requireMerchant = (req: Request, res: Response, next: NextFunction) => {
  if (!req.merchantId) {
    res.status(403).json({ error: "Merchant context required" });
    return;
  }

  next();
};

/**
 * Require user authentication
 */
export const requireUser = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) {
    res.status(401).json({ error: "User authentication required" });
    return;
  }

  next();
};

/**
 * Rate limiting middleware
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimitMiddleware = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || "unknown";
    const key = authService.generateRateLimitKey(ip, req.path);
    const now = Date.now();

    let record = requestCounts.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      requestCounts.set(key, record);
    }

    record.count++;

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - record.count));
    res.setHeader("X-RateLimit-Reset", new Date(record.resetTime).toISOString());

    if (record.count > maxRequests) {
      res.status(429).json({
        error: "Too many requests",
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }

    next();
  };
};

/**
 * CORS configuration middleware
 */
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000").split(",");
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }

  next();
};

/**
 * Security headers middleware
 */
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
  );

  // HSTS (HTTP Strict Transport Security)
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  // Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  next();
};

/**
 * Request logging middleware
 */
export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms) - IP: ${req.ip}`
    );
  });

  next();
};

/**
 * Error handling middleware
 */
export const errorHandlerMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err);

  // Operational errors
  if (err.isOperational) {
    res.status(err.statusCode || 400).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  if (err.name === "TokenExpiredError") {
    res.status(401).json({ error: "Token expired" });
    return;
  }

  // Database errors
  if (err.code === "23505") {
    // Unique violation
    res.status(400).json({ error: "Duplicate entry" });
    return;
  }

  // Default error
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};
