/**
 * @file src/models/Room.ts
 * @description Modèle Sequelize pour rooms (chambres).
 */
import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '@/config/db';

export type RoomStatus = 'vacant' | 'occupied' | 'ooo' | 'oos';

class Room extends Model<InferAttributes<Room>, InferCreationAttributes<Room>> {
  declare id: CreationOptional<number>;
  declare number: string;
  declare floor: number | null;
  declare room_type_id: number;
  declare status: RoomStatus;
  declare out_of_service_reason: string | null;
  declare oos_since: Date | null;
  declare features: any | null;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

Room.init(
  {
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
  },
  {
    sequelize,
    tableName: 'rooms',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Room;
