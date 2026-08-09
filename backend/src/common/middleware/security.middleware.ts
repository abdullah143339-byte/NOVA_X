import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const RATE_LIMIT_STORE = new Map<string, { count: number; resetAt: number }>();

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('X-DNS-Prefetch-Control', 'on');
    res.removeHeader('X-Powered-By');

    // Rate limiting per IP
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 200;

    const key = `rate:${ip}`;
    const record = RATE_LIMIT_STORE.get(key);

    if (!record || now > record.resetAt) {
      RATE_LIMIT_STORE.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      record.count++;
      if (record.count > maxRequests) {
        res.setHeader('Retry-After', Math.ceil((record.resetAt - now) / 1000));
        res.status(429).json({
          success: false,
          error: { message: 'Too many requests. Please try again later.', statusCode: 429 },
        });
        return;
      }
    }

    // Strict auth rate limiting
    if (req.path.includes('/auth/login') || req.path.includes('/auth/register')) {
      const authKey = `auth:${ip}`;
      const authRecord = RATE_LIMIT_STORE.get(authKey);

      if (!authRecord || now > authRecord.resetAt) {
        RATE_LIMIT_STORE.set(authKey, { count: 1, resetAt: now + 15 * 60 * 1000 }); // 15 min window
      } else {
        authRecord.count++;
        if (authRecord.count > 10) {
          res.setHeader('Retry-After', Math.ceil((authRecord.resetAt - now) / 1000));
          res.status(429).json({
            success: false,
            error: { message: 'Too many auth attempts. Try again in 15 minutes.', statusCode: 429 },
          });
          return;
        }
      }
    }

    // Cleanup old entries every 1000 requests
    if (Math.random() < 0.001) {
      for (const [k, v] of RATE_LIMIT_STORE.entries()) {
        if (now > v.resetAt) RATE_LIMIT_STORE.delete(k);
      }
    }

    next();
  }
}
