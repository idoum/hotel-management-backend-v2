/**
 * @file src/scripts/seed-rbac.ts
 * @description Seed RBAC: rôles & permissions + attribution admin.
 */
import 'dotenv/config';
import sequelize from '@/config/db';
import Role from '@/models/Role';
import Permission from '@/models/Permission';
import RolePermission from '@/models/RolePermission';
import User from '@/models/User';
import UserRole from '@/models/UserRole';
import { permissionCode, roleCode } from '@/utils/rbac';

async function main() {
  await sequelize.authenticate();
  await sequelize.sync(); // dev only

  const roleNames = ['Admin', 'Front Desk', 'Housekeeping', 'Maintenance', 'F&B', 'Spa', 'Events', 'Inventory', 'HR'];
  const roles = await Promise.all(
    roleNames.map(async (name) => Role.findOrCreate({ where: { code: roleCode(name) }, defaults: { code: roleCode(name), name } }).then(([r]) => r))
  );

  const resources = [
    'rooms','room_types','rates','reservations','folios','housekeeping','maintenance','pos','spa','events','inventory','contacts','users','rbac'
  ];
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
  // Permission spéciale de gestion RBAC
  const [rbacManage] = await Permission.findOrCreate({ where: { code: 'perm.rbac.manage' }, defaults: { code: 'perm.rbac.manage', name: 'rbac manage' } });
  permRecords.push(rbacManage);

  const adminRole = roles.find(r => r.code === roleCode('Admin'))!;
  for (const p of permRecords) {
    await RolePermission.findOrCreate({ where: { role_id: adminRole.id, permission_id: p.id }, defaults: { role_id: adminRole.id, permission_id: p.id } });
  }

  const admin = await User.findOne({ where: { email: 'admin@hotel.local' } });
  if (admin) await UserRole.findOrCreate({ where: { user_id: admin.id, role_id: adminRole.id }, defaults: { user_id: admin.id, role_id: adminRole.id } });

  console.log('✅ RBAC seed terminé');
  await sequelize.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
