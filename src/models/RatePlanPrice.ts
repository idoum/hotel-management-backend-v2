/**
 * @file src/models/RatePlanPrice.ts
 * @description Modèle Sequelize pour rate_plan_prices (prix par date).
 */
import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '@/config/db';

class RatePlanPrice extends Model<InferAttributes<RatePlanPrice>, InferCreationAttributes<RatePlanPrice>> {
  declare id: CreationOptional<number>;
  declare rate_plan_id: number;
  declare date: string; // DATEONLY
  declare price_base: string; // DECIMAL -> string
  declare price_extra_adult: string;
  declare price_extra_child: string;
  declare closed: boolean;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

RatePlanPrice.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    rate_plan_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    price_base: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    price_extra_adult: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
    price_extra_child: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
    closed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: 'rate_plan_prices',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default RatePlanPrice;
