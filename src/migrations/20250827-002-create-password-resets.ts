/**
 * @file src/migrations/20250827-002-create-password-resets.ts
 * @description Crée la table password_resets.
 */
import { QueryInterface } from 'sequelize';

export async function up(q: QueryInterface) {
  // create table if not exists
  await q.sequelize.query(
    `CREATE TABLE IF NOT EXISTS password_resets (
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
}

export async function down(q: QueryInterface) {
  await q.dropTable('password_resets');
}
