/**
 * @file src/models/UserRole.ts
 * @description Jointure user_roles (PK composite).
 */
import { Model, DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '@/config/db';

export class UserRole extends Model<InferAttributes<UserRole>, InferCreationAttributes<UserRole>> {
  declare user_id: number;
  declare role_id: number;
}

UserRole.init(
  {
    user_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, allowNull: false },
    role_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, allowNull: false }
  },
  { sequelize, tableName: 'user_roles', timestamps: false, underscored: true }
);

export default UserRole;
