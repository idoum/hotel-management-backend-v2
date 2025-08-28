/**
 * @file src/migrations/20250827-013-create-rate-restrictions.ts
 * @description Crée la table rate_restrictions (restrictions par date).
 */
import { QueryInterface, DataTypes } from 'sequelize';

export async function up(q: QueryInterface) {
  await q.createTable('rate_restrictions', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    rate_plan_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    min_stay: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    max_stay: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    cta: { type: DataTypes.BOOLEAN, allowNull: true }, // closed to arrival
    ctd: { type: DataTypes.BOOLEAN, allowNull: true }, // closed to departure
    advance_min: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }, // jours min avant arrivée
    advance_max: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }, // jours max avant arrivée
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });

  await q.addConstraint('rate_restrictions', {
    fields: ['rate_plan_id'],
    type: 'foreign key',
    name: 'fk_restrictions_rate_plan',
    references: { table: 'rate_plans', field: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  } as any);

  await q.addIndex('rate_restrictions', ['rate_plan_id', 'date'], { name: 'ux_restrictions_plan_date', unique: true } as any);
}

export async function down(q: QueryInterface) {
  try { await q.removeIndex('rate_restrictions', 'ux_restrictions_plan_date'); } catch {}
  try { await q.removeConstraint('rate_restrictions', 'fk_restrictions_rate_plan'); } catch {}
  await q.dropTable('rate_restrictions');
}
