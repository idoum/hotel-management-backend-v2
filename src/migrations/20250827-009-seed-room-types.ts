/**
 * @file src/migrations/20250827-009-seed-room-types.ts
 * @description Seed minimal pour room_types (STD/DLX/SUITE).
 */
import { QueryInterface } from 'sequelize';

export async function up(q: QueryInterface) {
  const now = new Date();
  await q.bulkInsert('room_types', [
    { code: 'STD', name: 'Standard', description: 'Chambre standard', features: JSON.stringify({ bed:'queen', capacity:2 }), created_at: now, updated_at: now },
    { code: 'DLX', name: 'Deluxe', description: 'Chambre deluxe', features: JSON.stringify({ bed:'king', capacity:3 }), created_at: now, updated_at: now },
    { code: 'STE', name: 'Suite', description: 'Suite', features: JSON.stringify({ bed:'king', capacity:4, living:true }), created_at: now, updated_at: now }
  ]);
}

export async function down(q: QueryInterface) {
  await q.bulkDelete('room_types', { code: ['STD','DLX','STE'] } as any);
}
