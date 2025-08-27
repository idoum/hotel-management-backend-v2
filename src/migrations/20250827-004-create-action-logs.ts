/**
 * @file src/migrations/20250827-004-create-action-logs.ts
 * @description Crée la table action_logs si absente.
 */
import { QueryInterface } from 'sequelize';

export async function up(q: QueryInterface) {
  await q.sequelize.query(
    `CREATE TABLE IF NOT EXISTS action_logs (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      actor_user_id INT UNSIGNED NULL,
      action VARCHAR(100) NOT NULL,
      target_type VARCHAR(100) NULL,
      target_id BIGINT UNSIGNED NULL,
      ip VARCHAR(64) NULL,
      user_agent VARCHAR(255) NULL,
      meta JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX (actor_user_id),
      INDEX (action),
      INDEX (target_type, target_id),
      CONSTRAINT fk_action_logs_actor
        FOREIGN KEY (actor_user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  );
}

export async function down(q: QueryInterface) {
  await q.dropTable('action_logs');
}
