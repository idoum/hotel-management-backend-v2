/**
 * @file src/scripts/migrate.ts
 * @description Exécute toutes les migrations en avant.
 */
import 'dotenv/config';
import sequelize from '@/config/db';
import { migrator } from '@/lib/migrator';

async function main() {
  await sequelize.authenticate();
  const results = await migrator.up();
  console.log('✅ Migrations up:', results.map(r => r.name));
  await sequelize.close();
}
main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
