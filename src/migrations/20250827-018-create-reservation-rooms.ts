/**
 * @file src/migrations/20250827-018-create-reservation-rooms.ts
 * @description Table reservation_rooms + FKs vers rooms/room_types/rate_plans.
 */
import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';

export async function up(q: QueryInterface) {
  await q.createTable('reservation_rooms', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    reservation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    room_type_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    room_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    rate_plan_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    adults: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 2 },
    children: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    qty: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    price_per_night: { type: DataTypes.JSON, allowNull: true },
    amount: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: '0.00' },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });

  await q.addConstraint('reservation_rooms', {
    fields: ['reservation_id'],
    type: 'foreign key',
    name: 'fk_rr_reservation',
    references: { table: 'reservations', field: 'id' },
    onDelete: 'CASCADE', onUpdate: 'CASCADE'
  } as any);

  await q.addConstraint('reservation_rooms', {
    fields: ['room_type_id'],
    type: 'foreign key',
    name: 'fk_rr_room_type',
    references: { table: 'room_types', field: 'id' },
    onDelete: 'RESTRICT', onUpdate: 'CASCADE'
  } as any);

  await q.addConstraint('reservation_rooms', {
    fields: ['room_id'],
    type: 'foreign key',
    name: 'fk_rr_room',
    references: { table: 'rooms', field: 'id' },
    onDelete: 'SET NULL', onUpdate: 'CASCADE'
  } as any);

  await q.addConstraint('reservation_rooms', {
    fields: ['rate_plan_id'],
    type: 'foreign key',
    name: 'fk_rr_rate_plan',
    references: { table: 'rate_plans', field: 'id' },
    onDelete: 'SET NULL', onUpdate: 'CASCADE'
  } as any);

  await q.addIndex('reservation_rooms', ['reservation_id'], { name: 'ix_rr_res' } as any);
  await q.addIndex('reservation_rooms', ['room_type_id'], { name: 'ix_rr_rt' } as any);
}

export async function down(q: QueryInterface) {
  try { await q.removeIndex('reservation_rooms', 'ix_rr_res'); } catch {}
  try { await q.removeIndex('reservation_rooms', 'ix_rr_rt'); } catch {}
  try { await q.removeConstraint('reservation_rooms', 'fk_rr_rate_plan'); } catch {}
  try { await q.removeConstraint('reservation_rooms', 'fk_rr_room'); } catch {}
  try { await q.removeConstraint('reservation_rooms', 'fk_rr_room_type'); } catch {}
  try { await q.removeConstraint('reservation_rooms', 'fk_rr_reservation'); } catch {}
  await q.dropTable('reservation_rooms');
}
