/**
 * @file src/controllers/room-types.controller.ts
 * @description CRUD RoomType avec validations et vérifs d’intégrité.
 */
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import RoomType from '@/models/RoomType';
import Room from '@/models/Room';
import { roomTypeCreateSchema, roomTypeUpdateSchema, roomTypeListQuery } from '@/validation/room-types.schema';

export async function listRoomTypes(req: Request, res: Response) {
  const { value, error } = roomTypeListQuery.validate(req.query);
  if (error) return res.status(422).json({ message: error.message });

  const { q, limit, offset } = value;
  const where: any = {};
  if (q) where[Op.or] = [{ name: { [Op.like]: `%${q}%` } }, { code: { [Op.like]: `%${q}%` } }];

  const rows = await RoomType.findAll({ where, order: [['name','ASC']], limit, offset });
  res.json(rows);
}

export async function createRoomType(req: Request, res: Response) {
  const { value, error } = roomTypeCreateSchema.validate(req.body);
  if (error) return res.status(422).json({ message: error.message });

  const code = value.code ?? value.name.trim().toUpperCase().slice(0, 3);
  const row = await RoomType.create({ ...value, code });
  res.status(201).json(row);
}

export async function updateRoomType(req: Request, res: Response) {
  const { value, error } = roomTypeUpdateSchema.validate(req.body);
  if (error) return res.status(422).json({ message: error.message });

  const id = Number(req.params.id);
  const rt = await RoomType.findByPk(id);
  if (!rt) return res.status(404).json({ message: 'RoomType not found' });

  if (value.code) rt.code = value.code;
  if (value.name) rt.name = value.name;
  if (value.description !== undefined) rt.description = value.description;
  if (value.features !== undefined) rt.features = value.features;
  await rt.save();

  res.json(rt);
}

export async function deleteRoomType(req: Request, res: Response) {
  const id = Number(req.params.id);
  const rt = await RoomType.findByPk(id);
  if (!rt) return res.status(404).json({ message: 'RoomType not found' });

  const count = await Room.count({ where: { room_type_id: id } });
  if (count > 0) return res.status(409).json({ message: 'Cannot delete: rooms exist for this type' });

  await rt.destroy();
  res.status(204).send();
}
