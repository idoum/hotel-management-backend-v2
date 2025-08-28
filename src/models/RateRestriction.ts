/**
 * @file src/models/RateRestriction.ts
 * @description Modèle Sequelize pour rate_restrictions (restrictions par date).
 */
import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '@/config/db';

class RateRestriction extends Model<InferAttributes<RateRestriction>, InferCreationAttributes<RateRestriction>> {
  declare id: CreationOptional<number>;
  declare rate_plan_id: number;
  declare date: string; // DATEONLY
  declare min_stay: number | null;
  declare max_stay: number | null;
  declare cta: boolean | null;
  declare ctd: boolean | null;
  declare advance_min: number | null;
  declare advance_max: number | null;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

RateRestriction.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    rate_plan_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    min_stay: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    max_stay: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    cta: { type: DataTypes.BOOLEAN, allowNull: true },
    ctd: { type: DataTypes.BOOLEAN, allowNull: true },
    advance_min: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    advance_max: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: 'rate_restrictions',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default RateRestriction;
