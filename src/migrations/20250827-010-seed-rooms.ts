/**
 * @file src/migrations/20250827-010-seed-rooms.ts
 * @description Seed minimal pour rooms (quelques chambres par type).
 */
import { QueryInterface } from 'sequelize';

async function getTypeId(q: QueryInterface, code: string): Promise<number | null> {
  const [rows]: any = await q.sequelize.query('SELECT id FROM room_types WHERE code=? LIMIT 1', { replacements: [code] });
  return rows?.[0]?.id ?? null;
}

export async function up(q: QueryInterface) {
  const now = new Date();
  const std = await getTypeId(q, 'STD');
  const dlx = await getTypeId(q, 'DLX');
  const ste = await getTypeId(q, 'STE');

  const rows: any[] = [];
  if (std) ['101','102','103','104'].forEach((n,i)=>rows.push({ number:n, floor:1, room_type_id:std, status:'vacant', created_at:now, updated_at:now }));
  if (dlx) ['201','202','203'].forEach((n)=>rows.push({ number:n, floor:2, room_type_id:dlx, status:'vacant', created_at:now, updated_at:now }));
  if (ste) ['301'].forEach((n)=>rows.push({ number:n, floor:3, room_type_id:ste, status:'vacant', created_at:now, updated_at:now }));

  if (rows.length) await q.bulkInsert('rooms', rows);
}

export async function down(q: QueryInterface) {
  await q.bulkDelete('rooms', { number: ['101','102','103','104','201','202','203','301'] } as any);
}
