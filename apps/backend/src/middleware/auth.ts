import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { JwtPayload, UserRole } from '@mahallu/shared-types';
import { ROLE_PERMISSIONS, Permission } from '@mahallu/shared-config';
import { isTokenBlacklisted } from '../config/redis';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    role: UserRole;
    permissions: string[];
    name: string;
  };
}

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Access token required', 401);
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      throw new AppError('Token has been revoked', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;

    // Fetch user to verify still active
    const user = await User.findById(decoded.userId).select('isActive tenantId role name permissions').lean();
    if (!user || !user.isActive) {
      throw new AppError('User not found or deactivated', 401);
    }

    req.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role,
      permissions: decoded.permissions,
      name: user.name,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

// Permission-based authorization middleware factory
export const authorize = (...permissions: Permission[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    const hasPermission = permissions.every(p => userPermissions.includes(p));

    if (!hasPermission) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

// Role-based authorization
export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Access denied for your role', 403));
    }
    next();
  };
};

// Tenant isolation middleware — ensures tenantId from JWT matches request
export const tenantMiddleware = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new AppError('Not authenticated', 401));
  }

  // Attach tenantId to query params for automatic filtering
  if (req.query) {
    (req as Request & { tenantFilter: Record<string, unknown> }).tenantFilter = { tenantId: req.user.tenantId };
  }

  next();
};
