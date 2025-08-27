/**
 * @file scripts/seed-database.ts
 * @description Seed minimal: synchronise la DB et crée un utilisateur admin.
 */

import 'dotenv/config';
import sequelize from '@/config/db';
import User from '@/models/User';
import { hashPassword } from '@/utils/passwords';

async function main() {
  await sequelize.authenticate();
  await sequelize.sync(); // dev only
  const email = 'admin@hotel.local';
  const exists = await User.findOne({ where: { email } });
  if (!exists) {
    await User.create({
      email,
      password_hash: await hashPassword('Admin@123'),
      first_name: 'Admin',
      last_name: 'Root',
      is_active: true
    });
    console.log('✅ Seed user created:', email, '/ password: Admin@123');
  } else {
    console.log('ℹ️ Seed user already exists');
  }
  await sequelize.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
