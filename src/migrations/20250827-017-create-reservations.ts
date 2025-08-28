/**
 * @file src/migrations/20250827-017-create-reservations.ts
 * @description Table reservations.
 */
import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';

export async function up(q: QueryInterface) {
  await q.createTable('reservations', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    guest_name: { type: DataTypes.STRING(150), allowNull: true },
    guest_email: { type: DataTypes.STRING(190), allowNull: true },
    guest_phone: { type: DataTypes.STRING(50), allowNull: true },
    check_in: { type: DataTypes.DATEONLY, allowNull: false },
    check_out: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.ENUM('pending','confirmed','cancelled','checked_in','checked_out'), allowNull: false, defaultValue: 'pending' },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    amount_total: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: '0.00' },
    source: { type: DataTypes.STRING(30), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await q.addIndex('reservations', ['check_in', 'check_out'], { name: 'ix_res_dates' } as any);
  await q.addIndex('reservations', ['status'], { name: 'ix_res_status' } as any);
}

export async function down(q: QueryInterface) {
  try { await q.removeIndex('reservations', 'ix_res_dates'); } catch {}
  try { await q.removeIndex('reservations', 'ix_res_status'); } catch {}
  await q.dropTable('reservations');
}
