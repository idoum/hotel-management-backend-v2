/**
 * @file src/server.ts
 * @description Bootstrap HTTP :
 *  - chargement env
 *  - init Sequelize (sync optionnel via DB_SYNC)
 *  - démarrage du serveur + shutdown propre
 */

import 'dotenv/config';
import app from '@/app';
import { initSequelize, closeSequelize, type SequelizeInitOptions } from '@/loaders/sequelize';

const port = Number(process.env.PORT || 3005);

/**
 * Interprète la variable d'env DB_SYNC en options de sync Sequelize.
 * DB_SYNC = "off"  -> pas de sync (défaut recommandé)
 * DB_SYNC = "alter"-> sync({ alter: true })
 * DB_SYNC = "force"-> sync({ force: true }) ⚠️ destructif
 */
function getSyncOptionsFromEnv(): SequelizeInitOptions {
  const mode = String(process.env.DB_SYNC || 'off').toLowerCase().trim();
  if (mode === 'alter') return { sync: true, alter: true };
  if (mode === 'force') return { sync: true, force: true };
  return { sync: false };
}

/**
 * Démarre l'API après initialisation DB.
 * - En dev, vous pouvez mettre DB_SYNC=alter pour ajuster le schéma.
 * - En prod, laissez DB_SYNC=off (ou unset) et utilisez des migrations.
 */
async function bootstrap(): Promise<void> {
  const syncOpts = getSyncOptionsFromEnv();
  await initSequelize(syncOpts);

  const server = app.listen(port, () => {
    console.log(`✅ API démarrée sur http://localhost:${port}`);
  });

  // Arrêt propre
  const shutdown = async (signal: string) => {
    try {
      console.log(`\n⏻ Signal ${signal} reçu — arrêt en cours...`);
      server.close(() => {
        console.log('��� HTTP server fermé');
      });
      await closeSequelize();
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur pendant l’arrêt:', err);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  // Optionnel : log des exceptions non catchées
  process.on('uncaughtException', (e) => {
    console.error('��� uncaughtException:', e);
  });
  process.on('unhandledRejection', (e) => {
    console.error('��� unhandledRejection:', e);
  });
}

bootstrap().catch((e) => {
  console.error('❌ Bootstrap failed:', e);
  process.exit(1);
});
