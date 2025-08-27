/**
 * @file scripts/create-database.ts
 * @description Crée la base MySQL si elle n'existe pas (latin→utf8mb4).
 */

import 'dotenv/config';
import { createConnection } from 'mysql2/promise';

async function main() {
  const {
    DB_HOST, DB_PORT = '3306', DB_USER, DB_PASS, DB_NAME
  } = process.env;

  if (!DB_HOST || !DB_USER || !DB_NAME) {
    throw new Error('DB_HOST, DB_USER, DB_NAME are required in env');
  }

  const conn = await createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASS
  });

  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );

  console.log(`✅ Database ensured: ${DB_NAME}`);
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
