/**
 * @file src/controllers/rooms.controller.ts
 * @description PMS - Chambres :
 *   - Liste avec filtres avancés (multi-status, room_type_id multiples, étages liste/plage),
 *     tri multi-colonnes, pagination + métadonnées.
 *   - CRUD minimal (create/update/delete).
 *   - Export CSV de la liste filtrée.
 */

import { Request, Response } from 'express';
import { Op, WhereOptions, Order } from 'sequelize';
import Room from '@/models/Room';
import RoomType from '@/models/RoomType';
import { roomsListQuery, roomCreateSchema, roomUpdateSchema } from '@/validation/rooms.schema';
import { buildMultiSort, toNumberArray, toStringArray } from '@/utils/query';
import { toCsv } from '@/utils/csv';

/**
 * @function listRooms
 * @description GET /rooms — Retourne { data, meta } avec filtres/tri/pagination.
 */
export async function listRooms(req: Request, res: Response) {
  // 1) Validation "shape"
  const { error } = roomsListQuery.validate(req.query);
  if (error) return res.status(422).json({ message: error.message });

  // 2) Construire les parties de requête (WHERE/ORDER/limit/offset)
  const { where, order, limit, offset } = buildRoomsQueryParts(req.query);

  // 3) total + rows
  const [total, rows] = await Promise.all([
    Room.count({ where }),
    Room.findAll({
      where,
      include: [{ model: RoomType, as: 'roomType', attributes: ['id', 'code', 'name'] }],
      order,
      limit,
      offset
    })
  ]);

  // 4) Sortie paginée
  res.json({
    data: rows,
    meta: { total, limit, offset }
  });
}

/**
 * @function createRoom
 * @description POST /rooms — Création d'une chambre.
 */
export async function createRoom(req: Request, res: Response) {
  const { value, error } = roomCreateSchema.validate(req.body);
  if (error) return res.status(422).json({ message: error.message });

  const row = await Room.create(value);
  res.status(201).json(row);
}

/**
 * @function updateRoom
 * @description PATCH /rooms/:id — Mise à jour partielle d’une chambre.
 */
export async function updateRoom(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { value, error } = roomUpdateSchema.validate(req.body);
  if (error) return res.status(422).json({ message: error.message });

  const room = await Room.findByPk(id);
  if (!room) return res.status(404).json({ message: 'Room not found' });

  Object.assign(room, value);
  await room.save();
  res.json(room);
}

/**
 * @function deleteRoom
 * @description DELETE /rooms/:id — Suppression d’une chambre (interdit si occupée).
 */
export async function deleteRoom(req: Request, res: Response) {
  const id = Number(req.params.id);
  const room = await Room.findByPk(id);
  if (!room) return res.status(404).json({ message: 'Room not found' });

  if (room.status === 'occupied') {
    return res.status(409).json({ message: 'Cannot delete an occupied room' });
  }
  await room.destroy();
  res.status(204).send();
}

/**
 * @function exportRooms
 * @description GET /rooms/export — Export CSV de la liste filtrée (mêmes filtres/tri que GET /rooms).
 *              Nécessite la permission `perm.rooms.export` (à gérer dans la route).
 */
export async function exportRooms(req: Request, res: Response) {
  const { error } = roomsListQuery.validate(req.query);
  if (error) return res.status(422).json({ message: error.message });

  const { where, order } = buildRoomsQueryParts(req.query);

  const rows = await Room.findAll({
    where,
    include: [{ model: RoomType, as: 'roomType', attributes: ['code', 'name'] }],
    order
  });

  // Colonnes exportées
  const headers = ['number', 'floor', 'status', 'room_type_code', 'room_type_name', 'created_at'];
  const data = rows.map(r => ({
    number: r.number,
    floor: r.floor ?? '',
    status: r.status,
    room_type_code: (r as any).roomType?.code ?? '',
    room_type_name: (r as any).roomType?.name ?? '',
    created_at: r.created_at?.toISOString?.() ?? ''
  }));

  const csv = toCsv(headers, data);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="rooms.csv"');
  res.status(200).send(csv);
}

/* ============================================================================================
 * Helper interne — construit WHERE/ORDER/limit/offset à partir de req.query
 *   Réutilisé par listRooms() et exportRooms()
 * ============================================================================================ */

/**
 * @function buildRoomsQueryParts
 * @description Construit WHERE/ORDER/limit/offset à partir des query params validés par Joi.
 */
function buildRoomsQueryParts(query: any): {
  where: WhereOptions; order: Order; limit: number; offset: number;
} {
  const { value } = roomsListQuery.validate(query, { abortEarly: false });

  // Recherche libre
  const q: string | undefined = value.q;

  // Multi-status
  const statuses = (() => {
    const arr = Array.isArray(value.status)
      ? value.status
      : (typeof value.status === 'string' ? value.status : undefined);
    if (Array.isArray(arr)) return arr;
    if (typeof arr === 'string') return toStringArray(arr);
    return [];
  })();

  // room_type_id multiples
  const typeIds = (() => {
    if (Array.isArray(value.room_type_id)) return value.room_type_id.map(Number).filter(Number.isFinite);
    if (value.room_type_id !== undefined) return [Number(value.room_type_id)].filter(Number.isFinite);
    return [];
  })();

  // Étages : liste + plage min/max
  const floorsList = toNumberArray(value.floors);
  const floorMin = typeof value.floorMin === 'number' ? value.floorMin : undefined;
  const floorMax = typeof value.floorMax === 'number' ? value.floorMax : undefined;

  // WHERE
  const where: WhereOptions = {};

  if (q) {
    (where as any)[Op.or] = [{ number: { [Op.like]: `%${q}%` } }];
  }

  if (statuses.length) {
    (where as any)['status'] = { [Op.in]: statuses };
  }

  if (typeIds.length) {
    (where as any)['room_type_id'] = { [Op.in]: typeIds };
  }

  // Étages : combinaison intelligente liste/plage
  if (floorsList.length && (floorMin !== undefined || floorMax !== undefined)) {
    (where as any)[Op.and] = [
      (where as any)[Op.and] as any,
      {
        [Op.or]: [
          { floor: { [Op.in]: floorsList } },
          {
            floor: {
              ...(floorMin !== undefined ? { [Op.gte]: floorMin } : {}),
              ...(floorMax !== undefined ? { [Op.lte]: floorMax } : {})
            }
          }
        ]
      }
    ].filter(Boolean);
  } else if (floorsList.length) {
    (where as any)['floor'] = { [Op.in]: floorsList };
  } else if (floorMin !== undefined || floorMax !== undefined) {
    (where as any)['floor'] = {
      ...(floorMin !== undefined ? { [Op.gte]: floorMin } : {}),
      ...(floorMax !== undefined ? { [Op.lte]: floorMax } : {})
    };
  }

  // Tri multi-colonnes (liste blanche)
  const allowedSortFields = ['number', 'floor', 'status', 'room_type_id', 'created_at'] as const;
  const order: Order = buildMultiSort(value.sort, allowedSortFields, [['number', 'ASC']]);

  // Pagination
  const limit: number = value.limit;
  const offset: number = value.offset;

  return { where, order, limit, offset };
}
