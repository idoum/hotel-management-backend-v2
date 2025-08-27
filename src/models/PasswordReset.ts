/**
 * @file src/models/PasswordReset.ts
 * @description Modèle pour la table "password_resets".
 */
import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '@/config/db';

export class PasswordReset extends Model<InferAttributes<PasswordReset>, InferCreationAttributes<PasswordReset>> {
  declare id: CreationOptional<number>;
  declare user_id: number;
  declare token_hash: string;
  declare exp_at: Date;
  declare used_at: Date | null;
  declare created_at: CreationOptional<Date>;
}

PasswordReset.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    token_hash: { type: DataTypes.STRING(255), allowNull: false },
    exp_at: { type: DataTypes.DATE, allowNull: false },
    used_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: 'password_resets',
    timestamps: false,
    underscored: true
  }
);

export default PasswordReset;
