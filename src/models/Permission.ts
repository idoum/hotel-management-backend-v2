/**
 * @file src/models/Permission.ts
 * @description Modèle Sequelize pour la table "permissions".
 */
import {
  Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional
} from 'sequelize';
import sequelize from '@/config/db';

export class Permission extends Model<InferAttributes<Permission>, InferCreationAttributes<Permission>> {
  declare id: CreationOptional<number>;
  declare code: string;
  declare name: string;
}

Permission.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(128), allowNull: false }
  },
  {
    sequelize,
    tableName: 'permissions',
    timestamps: false,
    underscored: true
  }
);

export default Permission;
