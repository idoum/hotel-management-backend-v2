/**
 * @file src/scripts/migrate-down.ts
 * @description Reculer une migration (ou toutes avec --all).
 */
import 'dotenv/config';
import sequelize from '@/config/db';
import { migrator } from '@/lib/migrator';

const all = process.argv.includes('--all');

async function main() {
  await sequelize.authenticate();
  const results = await (all ? migrator.down({ to: 0 }) : migrator.down());
  console.log('↩️  Migrations down:', results.map(r => r.name));
  await sequelize.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
