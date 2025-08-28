/**
 * @file src/migrations/20250827-008-create-rooms.ts
 * @description Crée la table rooms (chambres) + FK vers room_types.
 */
import { QueryInterface, DataTypes } from 'sequelize';

export async function up(q: QueryInterface) {
  await q.createTable('rooms', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    number: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    floor: { type: DataTypes.INTEGER, allowNull: true },
    room_type_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    status: { type: DataTypes.ENUM('vacant','occupied','ooo','oos'), allowNull: false, defaultValue: 'vacant' },
    out_of_service_reason: { type: DataTypes.STRING(255), allowNull: true },
    oos_since: { type: DataTypes.DATE, allowNull: true },
    features: { type: DataTypes.JSON, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });

  await q.addIndex('rooms', ['floor'], { name: 'ix_rooms_floor' } as any);
  await q.addIndex('rooms', ['status'], { name: 'ix_rooms_status' } as any);
  await q.addIndex('rooms', ['room_type_id'], { name: 'ix_rooms_room_type' } as any);

  // FK rooms.room_type_id → room_types.id
  await q.addConstraint('rooms', {
    fields: ['room_type_id'],
    type: 'foreign key',
    name: 'fk_rooms_room_type',
    references: { table: 'room_types', field: 'id' },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  } as any);
}

export async function down(q: QueryInterface) {
  try { await q.removeConstraint('rooms', 'fk_rooms_room_type'); } catch {}
  await q.dropTable('rooms');
}
