/**
 * @file src/controllers/rooms.controller.ts
 * @description CRUD Rooms + filtrage/pagination.
 */
import { Request, Response } from 'express';
import { Op, WhereOptions, Order } from 'sequelize';
import Room from '@/models/Room';
import RoomType from '@/models/RoomType';
import { roomsListQuery, roomCreateSchema, roomUpdateSchema } from '@/validation/rooms.schema';
import { buildMultiSort, toNumberArray, toStringArray } from '@/utils/query';

export async function listRooms(req: Request, res: Response) {
  // 1) Validation "shape" (types de base)
  const { value, error } = roomsListQuery.validate(req.query);
  if (error) return res.status(422).json({ message: error.message });

  // 2) Normalisation avancée
  const q: string | undefined = value.q;

  // status -> Set<string>
  const statuses = (() => {
    const arr = Array.isArray(value.status) ? value.status : (typeof value.status === 'string' ? value.status : undefined);
    if (Array.isArray(arr)) return arr;
    if (typeof arr === 'string') return toStringArray(arr);
    return [];
  })();

  // room_type_id -> number[]
  const typeIds = (() => {
    if (Array.isArray(value.room_type_id)) return value.room_type_id.map(Number).filter(Number.isFinite);
    if (value.room_type_id !== undefined) return [Number(value.room_type_id)].filter(Number.isFinite);
    return [];
  })();

  // floors list -> number[]
  const floorsList = toNumberArray(value.floors);

  // floor range
  const floorMin = typeof value.floorMin === 'number' ? value.floorMin : undefined;
  const floorMax = typeof value.floorMax === 'number' ? value.floorMax : undefined;

  // 3) WHERE dynamique
  const where: Record<string | symbol, any> = {};

  if (q) {
    where[Op.or] = [
      { number: { [Op.like]: `%${q}%` } }
    ];
  }

  if (statuses.length) {
    where['status'] = { [Op.in]: statuses };
  }

  if (typeIds.length) {
    where['room_type_id'] = { [Op.in]: typeIds };
  }

  // Gestion étages: liste OU plage (si les deux fournis, on combine intelligemment)
  if (floorsList.length && (floorMin !== undefined || floorMax !== undefined)) {
    // Combine: (floor IN floorsList) OR (floor BETWEEN min/max)
    where[Op.and] = [
      where[Op.and] as any,
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
    where['floor'] = { [Op.in]: floorsList };
  } else if (floorMin !== undefined || floorMax !== undefined) {
    where['floor'] = {
      ...(floorMin !== undefined ? { [Op.gte]: floorMin } : {}),
      ...(floorMax !== undefined ? { [Op.lte]: floorMax } : {})
    };
  }

  // 4) Tri multi-colonnes
  const allowedSortFields = ['number', 'floor', 'status', 'room_type_id', 'created_at'] as const;
  const order: Order = buildMultiSort(value.sort, allowedSortFields, [['number', 'ASC']]);

  // 5) Pagination
  const limit: number = value.limit;
  const offset: number = value.offset;

  // 6) Requête
  const rows = await Room.findAll({
    where,
    include: [{ model: RoomType, as: 'roomType', attributes: ['id','code','name'] }],
    order,
    limit,
    offset
  });

  res.json(rows);
}

export async function createRoom(req: Request, res: Response) {
  const { value, error } = roomCreateSchema.validate(req.body);
  if (error) return res.status(422).json({ message: error.message });

  const row = await Room.create(value);
  res.status(201).json(row);
}

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
