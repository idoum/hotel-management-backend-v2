/**
 * @file src/models/ActionLog.ts
 * @description Modèle pour les journaux d'audit (action_logs).
 */
import {
  Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional
} from 'sequelize';
import sequelize from '@/config/db';

export class ActionLog extends Model<InferAttributes<ActionLog>, InferCreationAttributes<ActionLog>> {
  declare id: CreationOptional<number>;
  declare actor_user_id: number | null;
  declare action: string;
  declare target_type: string | null;
  declare target_id: number | null;
  declare ip: string | null;
  declare user_agent: string | null;
  declare meta: any | null;
  declare created_at: CreationOptional<Date>;
}

ActionLog.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    actor_user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    action: { type: DataTypes.STRING(100), allowNull: false },
    target_type: { type: DataTypes.STRING(100), allowNull: true },
    target_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    ip: { type: DataTypes.STRING(64), allowNull: true },
    user_agent: { type: DataTypes.STRING(255), allowNull: true },
    meta: { type: DataTypes.JSON, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: 'action_logs',
    timestamps: false,
    underscored: true
  }
);

export default ActionLog;
