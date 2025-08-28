/**
 * @file src/scripts/migrate-status.ts
 * @description Affiche la liste des migrations exécutées et en attente.
 */
import 'dotenv/config';
import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from '@/config/db';
import { registerAssociations } from '@/models/associations';

async function main() {
  await sequelize.authenticate();
  registerAssociations();

  const migrator = new Umzug({
    migrations: { glob: 'src/migrations/*.{ts,js}' },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize, tableName: 'SequelizeMeta' }),
    logger: console,
  });

  const executed = await migrator.executed();
  const pending = await migrator.pending();

  console.log('Executed:', executed.map(m => m.name));
  console.log('Pending :', pending.map(m => m.name));

  await sequelize.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
