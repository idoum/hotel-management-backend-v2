/**
 * @file src/types/env.d.ts
 * @description Typage des variables d'environnement.
 */

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'test' | 'production';
    PORT: string;
    DB_HOST: string;
    DB_PORT: string;
    DB_NAME: string;
    DB_USER: string;
    DB_PASS: string;
    JWT_ACCESS_SECRET: string;
    ACCESS_EXPIRES: string;
  }
}
