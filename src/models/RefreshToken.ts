/**
 * @file src/models/RefreshToken.ts
 * @description Modèle Sequelize pour la table "refresh_tokens".
 */
import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '@/config/db';

export class RefreshToken extends Model<InferAttributes<RefreshToken>, InferCreationAttributes<RefreshToken>> {
  declare id: CreationOptional<number>;
  declare user_id: number;
  declare token_hash: string;
  declare exp_at: Date;
  declare revoked_at: Date | null;
  declare created_at: CreationOptional<Date>;
}

RefreshToken.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    token_hash: { type: DataTypes.STRING(255), allowNull: false },
    exp_at: { type: DataTypes.DATE, allowNull: false },
    revoked_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: 'refresh_tokens',
    timestamps: false,
    underscored: true
  }
);

export default RefreshToken;
