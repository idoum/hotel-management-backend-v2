/**
 * @file src/lib/migrator.ts
 * @description Config Umzug (migrations TypeScript) avec Sequelize.
 */
import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from '@/config/db';

export const migrator = new Umzug({
  migrations: {
    glob: 'src/migrations/*.ts',
    resolve: ({ name, path, context }) => {
      // charge migration TS via dynamic import
      const migration = require(path!);
      return {
        name,
        up: async () => migration.up(context),
        down: async () => migration.down?.(context),
      };
    }
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: 'migrations' }),
  logger: console,
});

export type MigrationContext = ReturnType<typeof sequelize.getQueryInterface>;
