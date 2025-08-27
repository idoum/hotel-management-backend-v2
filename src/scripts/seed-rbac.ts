/**
 * @file src/scripts/seed-rbac.ts
 * @description Seed RBAC: roles, permissions (dont perm.rbac.manage), mapping, attribution admin.
 */
import 'dotenv/config';
import sequelize from '@/config/db';
import Role from '@/models/Role';
import Permission from '@/models/Permission';
import RolePermission from '@/models/RolePermission';
import User from '@/models/User';
import UserRole from '@/models/UserRole';
import { permissionCode, roleCode, PERM_RBAC_MANAGE } from '@/utils/rbac';

async function main() {
  await sequelize.authenticate();
  // ⚠️ Dev uniquement
  await sequelize.sync();

  // 1) Rôles par défaut
  const roleNames = ['Admin','Front Desk','Housekeeping','Maintenance','F&B','Spa','Events','Inventory','HR'];
  const roles = await Promise.all(
    roleNames.map(async (name) => {
      const code = roleCode(name);
      const [r] = await Role.findOrCreate({ where: { code }, defaults: { code, name } });
      return r;
    })
  );

  // 2) Permissions par ressource/action
  const resources = [
    'rooms','rates','reservations','folios','housekeeping','maintenance',
    'pos','spa','events','inventory','contacts','users'
  ] as const;
  const actions = ['view','create','update','delete','export'] as const;

  const permRecords: Permission[] = [];
  for (const res of resources) {
    for (const act of actions) {
      const code = permissionCode(res, act);
      const name = `${res} ${act}`;
      const [perm] = await Permission.findOrCreate({ where: { code }, defaults: { code, name } });
      permRecords.push(perm);
    }
  }

  // 2bis) Permission spéciale RBAC: perm.rbac.manage
  const [rbacManage] = await Permission.findOrCreate({
    where: { code: PERM_RBAC_MANAGE },
    defaults: { code: PERM_RBAC_MANAGE, name: 'rbac manage' }
  });
  permRecords.push(rbacManage);

  // 3) Donner TOUTES les permissions au rôle Admin
  const adminRole = roles.find(r => r.code === roleCode('Admin'))!;
  for (const p of permRecords) {
    await RolePermission.findOrCreate({ where: { role_id: adminRole.id, permission_id: p.id } });
  }

  // 4) Assigner le rôle Admin à l'utilisateur seedé
  const admin = await User.findOne({ where: { email: 'admin@hotel.local' } });
  if (admin) {
    await UserRole.findOrCreate({ where: { user_id: admin.id, role_id: adminRole.id } });
    console.log('✅ Admin user granted role Admin (+ perm.rbac.manage via role)');
  } else {
    console.log('ℹ️ admin@hotel.local non trouvé (exécutez "npm run db:seed" d\'abord)');
  }

  console.log('✅ RBAC seed terminé');
  await sequelize.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
