import { NextFunction, Request, Response } from "express";
import Database from "../database/client";

export type UserRole = "admin" | "accountant" | "viewer" | "staff";

declare global {
  namespace Express {
    interface Request {
      role?: UserRole;
      permissions?: string[];
    }
  }
}

export const loadAuthorizationContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) {
    next();
    return;
  }

  try {
    const user = await Database.getOne<{
      business_id: string;
      role: UserRole;
      permissions: string[] | null;
      deleted_at: string | null;
    }>(
      `SELECT business_id, role, permissions, deleted_at
       FROM business_users WHERE id = $1`,
      [req.userId]
    );

    if (!user || user.deleted_at) {
      res.status(403).json({ error: "User account is inactive" });
      return;
    }

    if (req.merchantId && req.merchantId !== user.business_id) {
      res.status(403).json({ error: "Business context mismatch" });
      return;
    }

    req.merchantId = user.business_id;
    req.role = user.role;
    req.permissions = user.permissions || [];
    next();
  } catch (error) {
    console.error("Authorization context lookup failed:", error);
    res.status(503).json({ error: "Authorization service unavailable" });
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.role || !roles.includes(req.role)) {
      res.status(403).json({ error: "Insufficient role" });
      return;
    }
    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const permissions = req.permissions || [];
    if (req.role === "admin" || permissions.includes("all") || permissions.includes(permission)) {
      next();
      return;
    }
    res.status(403).json({ error: `Missing permission: ${permission}` });
  };
};
