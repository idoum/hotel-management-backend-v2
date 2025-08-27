/**
 * @file src/scripts/migrate-auth-extras.ts
 * @description Migration idempotente : ajoute users.account_code, users.last_login_at et la table password_resets.
 */
import 'dotenv/config';
import sequelize from '@/config/db';

async function colExists(table: string, column: string): Promise<boolean> {
  const [rows] = await sequelize.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    { replacements: [table, column] }
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function tableExists(name: string): Promise<boolean> {
  const [rows] = await sequelize.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    { replacements: [name] }
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function addAccountCodeColumn() {
  if (!(await colExists('users', 'account_code'))) {
    await sequelize.query(
      `ALTER TABLE users
       ADD COLUMN account_code VARCHAR(32) NULL UNIQUE AFTER email`
    );
    console.log('✓ users.account_code ajouté');
  } else {
    console.log('= users.account_code déjà présent');
  }
}

async function addLastLoginAtColumn() {
  if (!(await colExists('users', 'last_login_at'))) {
    await sequelize.query(
      `ALTER TABLE users
       ADD COLUMN last_login_at DATETIME NULL AFTER is_active`
    );
    console.log('✓ users.last_login_at ajouté');
  } else {
    console.log('= users.last_login_at déjà présent');
  }
}

async function createPasswordResets() {
  if (!(await tableExists('password_resets'))) {
    await sequelize.query(
      `CREATE TABLE password_resets (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        exp_at DATETIME NOT NULL,
        used_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX (user_id, exp_at),
        CONSTRAINT fk_password_resets_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON UPDATE CASCADE ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );
    console.log('✓ password_resets créé');
  } else {
    console.log('= password_resets déjà présent');
  }
}

async function main() {
  await sequelize.authenticate();
  await addAccountCodeColumn();
  await addLastLoginAtColumn();
  await createPasswordResets();
  await sequelize.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
