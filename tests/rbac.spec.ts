/**
 * @file tests/rbac.spec.ts
 */
import request from 'supertest';
import app from '../src/app';
import Role from '../src/models/Role';
import Permission from '../src/models/Permission';
import RolePermission from '../src/models/RolePermission';
import UserRole from '../src/models/UserRole';
import { roleCode, PERM_RBAC_MANAGE } from '../src/utils/rbac';

describe('RBAC', () => {
  it('GET /api/rbac/roles sans token -> 401 (requireAuth)', async () => {
    const res = await request(app).get('/api/rbac/roles');
    expect([401,403]).toContain(res.status); // selon ta stack, 401 attendu
  });

  it('User sans permission -> 403', async () => {
    // créer un user simple
    const email = 'rbac.noadmin@hotel.local';
    const pass = 'Test@12345';
    const reg = await request(app).post('/api/auth/register').send({ email, password: pass });
    expect(reg.status).toBe(201);
    const login = await request(app).post('/api/auth/login').send({ email, password: pass });
    const token = login.body.accessToken as string;

    const res = await request(app).get('/api/rbac/roles').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('User admin avec perm.rbac.manage -> 200', async () => {
    // crée un user
    const email = 'rbac.admin@hotel.local';
    const pass = 'Test@12345';
    const reg = await request(app).post('/api/auth/register').send({ email, password: pass });
    expect(reg.status).toBe(201);

    // crée rôle Admin et permission perm.rbac.manage si absents
    const [adminRole] = await Role.findOrCreate({
      where: { code: roleCode('Admin') },
      defaults: { code: roleCode('Admin'), name: 'Admin' }
    });
    const [perm] = await Permission.findOrCreate({
      where: { code: PERM_RBAC_MANAGE },
      defaults: { code: PERM_RBAC_MANAGE, name: 'rbac manage' }
    });
    await RolePermission.findOrCreate({ where: { role_id: adminRole.id, permission_id: perm.id },
      defaults: { role_id: adminRole.id, permission_id: perm.id } });

    // attache rôle Admin à l'user
    const userId = reg.body.user.id as number;
    await UserRole.findOrCreate({ where: { user_id: userId, role_id: adminRole.id },
      defaults: { user_id: userId, role_id: adminRole.id } });

    // reconnecte pour rafraîchir le JWT (inclure roles/permissions)
    const login = await request(app).post('/api/auth/login').send({ email, password: pass });
    const token = login.body.accessToken as string;

    const res = await request(app).get('/api/rbac/roles').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
