/**
 * @file src/scripts/migrate-status.ts
 * @description Affiche l'état des migrations (up/down).
 */
import 'dotenv/config';
import sequelize from '@/config/db';
import { migrator } from '@/lib/migrator';

async function main() {
  await sequelize.authenticate();
  const pending = await migrator.pending();
  const executed = await migrator.executed();
  console.log('Executed:', executed.map(m => m.name));
  console.log('Pending :', pending.map(m => m.name));
  await sequelize.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
