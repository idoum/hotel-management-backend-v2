/**
 * @file src/scripts/seed-security.ts
 * @description Seed Sécurité & Gouvernance : rôles, permissions, attributions, et comptes de base.
 * - Crée/complète: roles, permissions, role_permissions, users, user_roles
 * - Optionnel: ajoute quelques logs dans action_logs pour vérification.
 *
 * À exécuter: npm run db:seed:security
 */

import 'dotenv/config';
import sequelize from '@/config/db';
import Role from '@/models/Role';
import Permission from '@/models/Permission';
import RolePermission from '@/models/RolePermission';
import User from '@/models/User';
import UserRole from '@/models/UserRole';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';

/** Génère un code système “role.xxx” à partir d’un libellé. */
function roleCode(name: string): string {
  return `role.${name.trim().toLowerCase().replace(/\s+/g, '_')}`;
}

/** Génère un code de permission “ressource.action” (ex: reservations.view). */
function perm(resource: string, action: string): string {
  return `${resource}.${action}`;
}

/** Génère un “account_code” court et unique-ish pour l’utilisateur. */
function genAccountCode(email: string): string {
  const localPart = email.split('@')[0] ?? '';
  const base = localPart.replace(/[^a-z0-9]/gi, '').slice(0, 10).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}-${rnd}`;
}

/** Hachage de mot de passe. */
async function hashPassword(pwd: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pwd, salt);
}

/** Crée un rôle si nécessaire et le retourne. */
async function ensureRole(name: string): Promise<Role> {
  const code = roleCode(name);
  const [r] = await Role.findOrCreate({ where: { code }, defaults: { code, name } });
  return r;
}

/** Crée une permission si nécessaire et la retourne. */
async function ensurePermission(code: string, name?: string): Promise<Permission> {
  const [p] = await Permission.findOrCreate({ where: { code }, defaults: { code, name: name || code } });
  return p;
}

/** Donne au rôle `role` toutes les permissions `codes`. */
async function grant(role: Role, codes: string[]): Promise<void> {
  if (!codes.length) return;
  const perms = await Permission.findAll({ where: { code: { [Op.in]: codes } } });
  await Promise.all(
    perms.map(p => RolePermission.findOrCreate({ where: { role_id: role.id, permission_id: p.id } }))
  );
}

/** Crée (ou récupère) un user + rôle(s) */
async function ensureUserWithRoles(email: string, password: string, roleNames: string[], opts?: { first_name?: string; last_name?: string; is_active?: boolean; }): Promise<User> {
  const pwdHash = await hashPassword(password);
  const account_code = genAccountCode(email);

  const [u] = await User.findOrCreate({
    where: { email },
    defaults: {
      email,
      password_hash: pwdHash,
      account_code,
      first_name: opts?.first_name ?? null,
      last_name: opts?.last_name ?? null,
      is_active: opts?.is_active ?? true
    }
  });

  // Assigne les rôles demandés
  for (const rn of roleNames) {
    const r = await ensureRole(rn);
    await UserRole.findOrCreate({ where: { user_id: u.id, role_id: r.id } });
  }

  return u;
}

async function main() {
  await sequelize.authenticate();
  // En dev, si tu laisses DB_SYNC=alter => le schéma est en place.
  // Ici on ne fait pas de sync() pour éviter les surprises.

  /**
   * 1) Définir les rôles et permissions de référence
   */

  // Rôles “métier”
  const ROLE_NAMES = [
    'Admin', 'Front Desk', 'Housekeeping', 'Maintenance', 'F&B', 'Spa', 'Events', 'Inventory', 'HR', 'Auditor'
  ];

  // Ressources standard + actions CRUD+export
  const resources = [
    'reservations', 'availability',
    'rooms', 'room_types',
    'rates', 'rate_plans', 'rate_plan_prices', 'rate_restrictions',
    'housekeeping', 'maintenance',
    'inventory', 'pos', 'spa', 'events',
    'contacts', 'users',
    'audit',    // audit.view
    'rbac'      // rbac.manage
  ];

  const CRUDX = ['view', 'create', 'update', 'delete', 'export'] as const;

  // 2) Créer toutes les permissions “ressource.action”
  for (const res of resources) {
    if (res === 'audit') { await ensurePermission(perm('audit', 'view'), 'audit view'); continue; }
    if (res === 'rbac') { await ensurePermission(perm('rbac', 'manage'), 'rbac manage'); continue; }
    // sinon, CRUD + export
    for (const a of CRUDX) {
      await ensurePermission(perm(res, a), `${res} ${a}`);
    }
  }

  /**
   * 3) Créer les rôles
   */
  const roles = await Promise.all(ROLE_NAMES.map(ensureRole));
  const roleByName = Object.fromEntries(roles.map(r => [r.name, r]));

  /**
   * 4) Matrice d’attribution des permissions par rôle (exemples “réalistes”)
   */
  const ALL = (await Permission.findAll()).map(p => p.code);

  const FRONT_DESK = [
    perm('reservations', 'view'), perm('reservations', 'create'), perm('reservations', 'update'),
    perm('availability', 'view'),
    perm('rooms', 'view'),
    perm('rates', 'view'), perm('rate_plans', 'view'), perm('rate_restrictions', 'view')
  ];

  const HOUSEKEEPING = [
    perm('housekeeping', 'view'), perm('housekeeping', 'update'),
    perm('rooms', 'view')
  ];

  const MAINTENANCE = [
    perm('maintenance', 'view'), perm('maintenance', 'update'),
    perm('rooms', 'view')
  ];

  const INVENTORY = [
    perm('inventory', 'view'), perm('inventory', 'create'), perm('inventory', 'update')
  ];

  const FNB = [
    perm('pos', 'view'), perm('pos', 'create'), perm('pos', 'update')
  ];

  const SPA = [
    perm('spa', 'view'), perm('spa', 'create'), perm('spa', 'update')
  ];

  const EVENTS = [
    perm('events', 'view'), perm('events', 'create'), perm('events', 'update')
  ];

  const HR = [
    perm('users', 'view'), perm('users', 'create'), perm('users', 'update'), // gestion basique des comptes
  ];

  const AUDITOR = [
    perm('audit', 'view'),
    perm('reservations', 'view'), perm('rooms', 'view'), perm('rates', 'view'),
    perm('inventory', 'view'), perm('users', 'view')
  ];

  // 5) Attribuer
  if (roleByName['Admin']) await grant(roleByName['Admin'], ALL.concat([perm('rbac', 'manage')]));
  if (roleByName['Front Desk']) await grant(roleByName['Front Desk'], FRONT_DESK);
  if (roleByName['Housekeeping']) await grant(roleByName['Housekeeping'], HOUSEKEEPING);
  if (roleByName['Maintenance']) await grant(roleByName['Maintenance'], MAINTENANCE);
  if (roleByName['Inventory']) await grant(roleByName['Inventory'], INVENTORY);
  if (roleByName['F&B']) await grant(roleByName['F&B'], FNB);
  if (roleByName['Spa']) await grant(roleByName['Spa'], SPA);
  if (roleByName['Events']) await grant(roleByName['Events'], EVENTS);
  if (roleByName['HR']) await grant(roleByName['HR'], HR);
  if (roleByName['Auditor']) await grant(roleByName['Auditor'], AUDITOR);

  /**
   * 6) Comptes de base
   *  - Admin global
   *  - Un Front Desk
   *  - Housekeeping
   */
  const admin = await ensureUserWithRoles('admin@hotel.local', 'Admin@123', ['Admin'], { first_name: 'System', last_name: 'Admin' });
  await ensureUserWithRoles('frontdesk@hotel.local', 'Frontdesk@123', ['Front Desk'], { first_name: 'Front', last_name: 'Desk' });
  await ensureUserWithRoles('housekeeping@hotel.local', 'Housekeep@123', ['Housekeeping'], { first_name: 'HK', last_name: 'Team' });

  /**
   * 7) (Optionnel) Écrire quelques logs d’audit
   *  Nota: si tu n’as pas de modèle ActionLog, on peut insérer en brut via QueryInterface.
   */
  const q = sequelize.getQueryInterface();
  const now = new Date();
  try {
    await q.bulkInsert('action_logs', [{
      actor_user_id: admin.id,
      action: 'seed.security',
      target_type: 'system',
      target_id: null,
      ip: '127.0.0.1',
      user_agent: 'seed-script',
      meta: JSON.stringify({ rolesSeeded: ROLE_NAMES.length }),
      created_at: now
    }]);
  } catch (e) {
    // silencieux si table absente
  }

  console.log('✅ Seed Sécurité & Gouvernance terminé.');
  await sequelize.close();
}

main().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
