/**
 * @file src/migrations/20250827-012-create-rate-plan-prices.ts
 * @description Crée la table rate_plan_prices (prix par date).
 */
import { QueryInterface, DataTypes } from 'sequelize';

export async function up(q: QueryInterface) {
  await q.createTable('rate_plan_prices', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    rate_plan_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    price_base: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    price_extra_adult: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
    price_extra_child: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
    closed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });

  await q.addConstraint('rate_plan_prices', {
    fields: ['rate_plan_id'],
    type: 'foreign key',
    name: 'fk_prices_rate_plan',
    references: { table: 'rate_plans', field: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  } as any);

  // Un prix par plan & par date
  await q.addIndex('rate_plan_prices', ['rate_plan_id', 'date'], { name: 'ux_prices_plan_date', unique: true } as any);
}

export async function down(q: QueryInterface) {
  try { await q.removeIndex('rate_plan_prices', 'ux_prices_plan_date'); } catch {}
  try { await q.removeConstraint('rate_plan_prices', 'fk_prices_rate_plan'); } catch {}
  await q.dropTable('rate_plan_prices');
}
