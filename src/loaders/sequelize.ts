/**
 * @file src/loaders/sequelize.ts
 * @description Initialisation Sequelize : import des modèles, enregistrement des associations,
 *              authentification à la base, et utilitaires de sync/fermeture.
 */

import sequelize from '@/config/db';

// ⚠️ Importez *tous* les modèles pour que Sequelize les connaisse avant les associations
import '@/models/User';
import '@/models/Role';
import '@/models/Permission';
import '@/models/UserRole';
import '@/models/RolePermission';

import { registerAssociations } from '@/models/associations';

/**
 * Options de démarrage Sequelize.
 */
export type SequelizeInitOptions = {
  /**
   * Si true, exécute sequelize.sync() après l'authentification et l'enregistrement
   * des associations. ⚠️ À réserver au développement.
   */
  sync?: boolean;

  /**
   * Si sync=true, applique ALTER TABLE pour faire coller le schéma (non destructif).
   * Évite force, mais peut modifier le schéma en dev.
   */
  alter?: boolean;

  /**
   * Si sync=true, force DROP & CREATE des tables (⚠️ destructif).
   * À éviter sauf cas spécifiques (tests jetables).
   */
  force?: boolean;
};

/**
 * Initialise la connexion Sequelize, enregistre les associations et (optionnellement) synchronise le schéma.
 *
 * @param options Contrôle du sync (défaut : { sync:false })
 * @returns Promise<void>
 *
 * @example
 * // En prod (recommandé) : pas de sync
 * await initSequelize();
 *
 * // En dev : sync léger
 * await initSequelize({ sync: true, alter: true });
 */
export async function initSequelize(options: SequelizeInitOptions = {}): Promise<void> {
  const { sync = false, alter = false, force = false } = options;

  try {
    // 1) Connexion
    await sequelize.authenticate();

    // 2) Enregistrement des associations (AVANT tout sync)
    registerAssociations();

    // 3) Optionnel : sync (dev uniquement)
    if (sync) {
      await sequelize.sync({ alter, force });
      console.log(`🛠️  sequelize.sync() exécuté (alter=${alter}, force=${force})`);
    }

    console.log('✅ DB connection OK');
  } catch (err) {
    console.error('❌ DB init failed:', err);
    // on sort en échec : utile pour PM2/Docker qui redémarrent
    process.exit(1);
  }
}

/**
 * Ferme proprement la connexion Sequelize (utile dans les tests / shutdown).
 * @returns Promise<void>
 */
export async function closeSequelize(): Promise<void> {
  try {
    await sequelize.close();
    console.log('👋 DB connection closed');
  } catch (err) {
    console.error('⚠️ Error while closing DB connection:', err);
  }
}
