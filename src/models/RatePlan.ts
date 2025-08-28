/**
 * @file src/models/RatePlan.ts
 * @description Modèle Sequelize pour rate_plans.
 */
import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '@/config/db';

class RatePlan extends Model<InferAttributes<RatePlan>, InferCreationAttributes<RatePlan>> {
  declare id: CreationOptional<number>;
  declare code: string;
  declare name: string;
  declare currency: string;
  declare occupancy_pricing: boolean;
  declare refundable: boolean;
  declare policy: string | null;
  declare room_type_id: number | null;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

RatePlan.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    occupancy_pricing: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    refundable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    policy: { type: DataTypes.TEXT, allowNull: true },
    room_type_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: 'rate_plans',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default RatePlan;
