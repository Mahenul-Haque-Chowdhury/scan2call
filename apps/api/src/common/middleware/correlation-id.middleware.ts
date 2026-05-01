import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Extend Express Request to include the id property
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Use existing correlation ID from upstream proxy, or generate a new one
    const correlationId =
      (req.headers['x-request-id'] as string) || randomUUID();

    req.id = correlationId;
    res.setHeader('X-Request-Id', correlationId);

    next();
  }
}
