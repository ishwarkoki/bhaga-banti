import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger.js';

function getLogLevel(statusCode: number): 'error' | 'warn' | 'info' {
  if (statusCode >= 500) {
    return 'error';
  }

  if (statusCode >= 400) {
    return 'warn';
  }

  return 'info';
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.header('x-request-id') || randomUUID();
  const startedAt = process.hrtime.bigint();

  res.locals.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const level = getLogLevel(res.statusCode);

    logger.log(level, `${req.method} ${req.originalUrl}`, {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
}
