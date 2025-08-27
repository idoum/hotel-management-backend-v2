/**
 * @file src/models/User.ts
 * @description Modèle Sequelize pour "users" conforme au schéma PMS + extensions (account_code, last_login_at).
 */
import {
  Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional
} from 'sequelize';
import sequelize from '@/config/db';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare email: string;
  declare account_code: CreationOptional<string | null>; // NEW (nullable)
  declare password_hash: string;
  declare first_name: CreationOptional<string | null>;
  declare last_name: CreationOptional<string | null>;
  declare is_active: CreationOptional<boolean>;
  declare last_login_at: CreationOptional<Date | null>;  // NEW (nullable)
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

User.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(190), allowNull: false, unique: true },
    account_code: { type: DataTypes.STRING(32), allowNull: true, unique: true }, // NEW
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    first_name: { type: DataTypes.STRING(100), allowNull: true },
    last_name: { type: DataTypes.STRING(100), allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    last_login_at: { type: DataTypes.DATE, allowNull: true },                    // NEW
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: 'users',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default User;
