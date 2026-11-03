import { Response, NextFunction } from 'express';
import { TenantRequest } from './tenantContext';
import crypto from 'crypto';

// In-memory rate-limiting store (or Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 100; // 100 requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

export const securityAndRateLimitMiddleware = (req: TenantRequest, res: Response, next: NextFunction): void => {
  const tenantId = req.tenantId;
  const apiKey = req.headers['x-api-key'] as string;

  if (!tenantId) {
    res.status(400).json({ error: 'Missing tenant context.' });
    return;
  }

  // 1. Validate Cryptographic API Key Header format
  if (!apiKey || !apiKey.startsWith('ff_live_')) {
    res.status(401).json({ error: 'Unauthorized: Invalid or missing cryptographic API key format.' });
    return;
  }

  // 2. Enforce Rate Limiting per Tenant
  const now = Date.now();
  const tenantLimit = rateLimitStore.get(tenantId);

  if (!tenantLimit || now > tenantLimit.resetTime) {
    rateLimitStore.set(tenantId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  } else {
    tenantLimit.count += 1;
    if (tenantLimit.count > RATE_LIMIT_MAX) {
      res.status(429).json({ error: 'Rate limit exceeded. Too many requests for this tenant.' });
      return;
    }
  }

  next();
};