/**
 * @file src/models/ReservationRoom.ts
 * @description Modèle Sequelize pour les lignes de réservation (par chambre/type).
 */
import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '@/config/db';

class ReservationRoom extends Model<InferAttributes<ReservationRoom>, InferCreationAttributes<ReservationRoom>> {
  declare id: CreationOptional<number>;
  declare reservation_id: number;
  declare room_type_id: number;
  declare room_id: number | null;       // Peut être assigné plus tard
  declare rate_plan_id: number | null;  // Optionnel si prix externe
  declare adults: number;
  declare children: number;
  declare qty: number;                   // nombre de chambres sur ce type
  declare price_per_night: object | null; // JSON { '2025-09-01': 120, ... } (facultatif)
  declare amount: string;                // total ligne
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

ReservationRoom.init(
  {
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
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'reservation_rooms',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default ReservationRoom;
