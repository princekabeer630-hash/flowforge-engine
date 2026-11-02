import { Request, Response, NextFunction } from 'express';

export interface TenantRequest extends Request {
  tenantId?: string;
}

export const tenantContextMiddleware = (req: TenantRequest, res: Response, next: NextFunction): void => {
  const tenantId = req.headers['x-tenant-id'] as string;

  if (!tenantId) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Missing required x-tenant-id header for multi-tenant routing isolation.'
    });
    return;
  }

  // Bind validated tenant identifier to request context
  req.tenantId = tenantId;
  next();
};