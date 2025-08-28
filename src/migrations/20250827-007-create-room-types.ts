/**
 * @file src/migrations/20250827-007-create-room-types.ts
 * @description Crée la table room_types (types de chambres).
 */
import { QueryInterface, DataTypes } from 'sequelize';

export async function up(q: QueryInterface) {
  await q.createTable('room_types', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    features: { type: DataTypes.JSON, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await q.addIndex('room_types', ['name'], { name: 'ix_room_types_name' } as any);
}

export async function down(q: QueryInterface) {
  await q.dropTable('room_types');
}
