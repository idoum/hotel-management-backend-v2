/**
 * @file src/models/RolePermission.ts
 * @description Jointure role_permissions (PK composite).
 */
import { Model, DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '@/config/db';

export class RolePermission extends Model<InferAttributes<RolePermission>, InferCreationAttributes<RolePermission>> {
  declare role_id: number;
  declare permission_id: number;
}

RolePermission.init(
  {
    role_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, allowNull: false },
    permission_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, allowNull: false }
  },
  { sequelize, tableName: 'role_permissions', timestamps: false, underscored: true }
);

export default RolePermission;
