import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const DANGEROUS_PATTERNS = [
  /<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi,
  /<\s*iframe[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi,
  /<\s*object[^>]*>[\s\S]*?<\s*\/\s*object\s*>/gi,
  /<\s*embed[^>]*>[\s\S]*?<\s*\/\s*embed\s*>/gi,
  /<\s*link[^>]*>/gi,
  /<\s*meta[^>]*>/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /on(load|error|click|mouseover|mouseout|mouseenter|mouseleave|submit|focus|blur|change|keydown|keyup|keypress|dblclick|contextmenu|pointerdown|pointerup|pointermove|drag|drop|input|select|toggle)\s*=\s*['"]?/gi,
];

function sanitizeString(value: string): string {
  let out = value;
  for (const re of DANGEROUS_PATTERNS) {
    out = out.replace(re, '');
  }
  return out;
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') return sanitizeString(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      out[key] = sanitizeValue((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

// Routes whose dynamic bodies carry user-generated video/comment/text content.
const SANITIZED_ROUTES =
  /^\/(?:api\/v1\/)?(auth|posts|comments|messages|communities|marketplace|learning|users|projects|notifications|reports)(?:\/|$)/i;

@Injectable()
export class SanitizerMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (
      (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') &&
      req.body &&
      SANITIZED_ROUTES.test(req.path)
    ) {
      req.body = sanitizeValue(req.body);
    }
    next();
  }
}
