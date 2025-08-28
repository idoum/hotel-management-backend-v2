/**
 * @file src/migrations/20250827-016-unique-code-per-roomtype.ts
 * @description Remplace l'unique sur code par unique (code, ifnull(room_type_id,0)).
 */
import { QueryInterface } from 'sequelize';

export async function up(q: QueryInterface) {
  // 1) Supprimer l'unique existant sur code (nom variable selon moteur; on tente plusieurs)
  try { await q.removeIndex('rate_plans', 'rate_plans_code_unique'); } catch {}
  try { await q.removeIndex('rate_plans', 'code'); } catch {}

  // 2) Ajouter colonne générée (stockée) pour indexer IFNULL(room_type_id,0)
  await q.sequelize.query(`
    ALTER TABLE rate_plans
    ADD COLUMN room_type_id_nvl INT GENERATED ALWAYS AS (IFNULL(room_type_id,0)) STORED
  `);

  // 3) Créer unique composite
  await q.sequelize.query(`
    CREATE UNIQUE INDEX ux_rate_plans_code_rt
    ON rate_plans (code, room_type_id_nvl)
  `);
}

export async function down(q: QueryInterface) {
  try { await q.sequelize.query(`DROP INDEX ux_rate_plans_code_rt ON rate_plans`); } catch {}
  try { await q.sequelize.query(`ALTER TABLE rate_plans DROP COLUMN room_type_id_nvl`); } catch {}
  // restaurer unique global sur code
  await q.sequelize.query(`CREATE UNIQUE INDEX rate_plans_code_unique ON rate_plans (code)`);
}
