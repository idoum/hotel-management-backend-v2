/**
 * @file src/types/express.d.ts
 * @description Déclare req.user pour Express (augmentation de type).
 */

import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: number;
      email: string;
      roles: string[];
      permissions?: string[];
    };
  }
}
