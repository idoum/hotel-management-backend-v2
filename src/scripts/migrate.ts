/**
 * @file src/scripts/migrate.ts
 * @description Exécute les migrations en passant *directement* le QueryInterface à up/down.
 */
import 'dotenv/config';
import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from '@/config/db';
import { registerAssociations } from '@/models/associations';

async function main() {
  await sequelize.authenticate();
  registerAssociations();

  const qi = sequelize.getQueryInterface();

  const migrator = new Umzug({
    migrations: {
      glob: 'src/migrations/*.{ts,js}',
      resolve: ({ name, path }) => ({
        name,
        up: async () => {
          const mod = await import(path!);
          if (typeof mod.up !== 'function') throw new Error(`Migration ${name} missing 'up'`);
          return mod.up(qi);
        },
        down: async () => {
          const mod = await import(path!);
          if (typeof mod.down !== 'function') throw new Error(`Migration ${name} missing 'down'`);
          return mod.down(qi);
        },
      }),
    },
    context: qi,
    storage: new SequelizeStorage({ sequelize, tableName: 'SequelizeMeta' }),
    logger: console,
  });

  const pending = await migrator.pending();
  console.log({ pending: pending.map((m) => m.name) });

  await migrator.up();
  console.log('✅ All migrations executed');

  await sequelize.close();
}

main().catch((e) => {
  console.error('❌ MigrationError:', e);
  process.exit(1);
});
