/**
 * @file src/migrations/20250827-011-create-rate-plans.ts
 * @description Crée la table rate_plans (plans tarifaires).
 */
import { QueryInterface, DataTypes } from 'sequelize';

export async function up(q: QueryInterface) {
  await q.createTable('rate_plans', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    occupancy_pricing: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    refundable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    policy: { type: DataTypes.TEXT, allowNull: true },
    room_type_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }, // optionnel (plan lié à un type)
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });

  // FK optionnelle vers room_types
  await q.addConstraint('rate_plans', {
    fields: ['room_type_id'],
    type: 'foreign key',
    name: 'fk_rate_plans_room_type',
    references: { table: 'room_types', field: 'id' },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  } as any);

  await q.addIndex('rate_plans', ['name'], { name: 'ix_rate_plans_name' } as any);
}

export async function down(q: QueryInterface) {
  try { await q.removeConstraint('rate_plans', 'fk_rate_plans_room_type'); } catch {}
  await q.dropTable('rate_plans');
}
