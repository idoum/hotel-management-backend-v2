/**
 * @file src/models/Reservation.ts
 * @description Modèle Sequelize pour les réservations (en-tête).
 */
import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '@/config/db';

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'checked_in' | 'checked_out';

class Reservation extends Model<InferAttributes<Reservation>, InferCreationAttributes<Reservation>> {
  declare id: CreationOptional<number>;
  declare code: string;                   // ex: RSV-2025-000123
  declare guest_name: string | null;
  declare guest_email: string | null;
  declare guest_phone: string | null;
  declare check_in: string;               // DATEONLY
  declare check_out: string;              // DATEONLY
  declare status: ReservationStatus;
  declare currency: string;
  declare amount_total: string;           // DECIMAL as string
  declare source: string | null;          // ex: direct, ota, corp
  declare notes: string | null;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

Reservation.init(
  {
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
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'reservations',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Reservation;
