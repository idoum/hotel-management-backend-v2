/**
 * @file src/middleware/validate.ts
 * @description Middleware pour valider req.body / params / query avec Joi.
 */

import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';

/**
 * Construit un middleware de validation pour un schéma Joi donné.
 * @param schema Schéma Joi
 */
export function validate(schema: ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(422).json({
        message: 'Validation error',
        details: error.details.map(d => ({ path: d.path, message: d.message }))
      });
    }
    req.body = value;
    next();
  };
}
