/**
 * @file src/config/db.ts
 * @description Création de l'instance Sequelize (MySQL).
 */

import { Sequelize } from 'sequelize';
import { requiredEnv } from '@/config/env';

const sequelize = new Sequelize(
  requiredEnv('DB_NAME'),
  requiredEnv('DB_USER'),
  requiredEnv('DB_PASS'),
  {
    host: requiredEnv('DB_HOST'),
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false
  }
);

export default sequelize;
