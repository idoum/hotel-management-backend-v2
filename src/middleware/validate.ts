/**
 * @file src/middleware/validate.ts
 * @description Middleware pour valider req.body / params / query avec Joi.
 */

import type { Request, Response, NextFunction } from 'express';
import { withReq } from '@/utils/logger';

export function validate(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { value, error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const log = withReq(req);
      const details = error.details?.map((d: { message: string; path: (string | number)[] }) => ({ msg: d.message, path: d.path })) ?? [];
      log.warn({ err: error, details }, 'validation.failed');

      // En dev, renvoie les détails pour comprendre
      const payload = {
        message: error.message,
        ...(process.env.NODE_ENV !== 'production' ? { details } : {})
      };
      return res.status(422).json(payload);
    }
    req.body = value;
    next();
  };
}
