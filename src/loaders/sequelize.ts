/**
 * @file src/loaders/sequelize.ts
 * @description Authentifie la connexion DB et enregistre les modèles/associations.
 */

import sequelize from '@/config/db';
import '@/models/User'; // importer ici tous tes modèles

/**
 * Initialise la connexion Sequelize.
 * En dev, tu peux décommenter sync() pour générer les tables.
 */
export async function initSequelize(): Promise<void> {
  try {
    await sequelize.authenticate();
    // await sequelize.sync({ alter: false }); // ⚠️ utiliser migrations en prod
    console.log('✅ DB connection OK');
  } catch (err) {
    console.error('❌ DB init failed:', err);
    process.exit(1);
  }
}
