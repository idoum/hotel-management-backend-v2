/**
 * @file src/controllers/availability.controller.ts
 * @description Recherche de disponibilité par type sur une plage de dates.
 */
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Room from '@/models/Room';
import Reservation from '@/models/Reservation';
import ReservationRoom from '@/models/ReservationRoom';
import { availabilityQuerySchema } from '@/validation/availability.schema';
import { daysRangeInclusive } from './_date-utils';

/**
 * @function searchAvailability
 * @description GET /availability/search
 * Calcule, pour chaque jour de [check_in, check_out), le nb de chambres disponibles pour le room_type_id.
 */
export async function searchAvailability(req: Request, res: Response) {
  const { value, error } = availabilityQuerySchema.validate(req.query);
  if (error) return res.status(422).json({ message: error.message });

  const { room_type_id, check_in, check_out, rooms } = value;
  const dates = daysRangeInclusive(new Date(check_in), new Date(check_out));

  // 1) Chambres “physiques” disponibles (non OOO/OOS)
  const allRooms = await Room.findAll({ where: { room_type_id, status: { [Op.in]: ['vacant','occupied'] } }, attributes: ['id'] });
  const totalRooms = allRooms.length;

  // 2) Réservations non annulées qui chevauchent la plage
  const overlapping = await Reservation.findAll({
    where: {
      status: { [Op.not]: 'cancelled' },
      check_in: { [Op.lt]: check_out },  // existing.check_in < new.check_out
      check_out: { [Op.gt]: check_in }   // existing.check_out > new.check_in
    },
    include: [{ model: ReservationRoom, as: 'rooms', where: { room_type_id }, required: true, attributes: ['qty'] }]
  });

  // 3) Occupation par jour (approx: on prend la même qty pour chaque jour de la plage)
  const occPerDay: Record<string, number> = Object.fromEntries(dates.map(d => [d, 0]));
  for (const r of overlapping) {
    const rDates = daysRangeInclusive(new Date(r.check_in as any), new Date(r.check_out as any));
    const qtySum = (r as any).rooms.reduce((s: number, rr: ReservationRoom) => s + Number(rr.qty || 0), 0);
    for (const d of rDates) {
      if (occPerDay[d] !== undefined) occPerDay[d] += qtySum;
    }
  }

  // 4) Disponibilité
  const daily: Array<{ date: string; available: number }> = dates.map(d => ({ date: d, available: Math.max(0, totalRooms - (occPerDay[d] || 0)) }));
  const minAvail = daily.reduce((m, x) => Math.min(m, x.available), totalRooms);
  const enough = minAvail >= rooms;

  res.json({ room_type_id, check_in, check_out, request_qty: rooms, daily, total_rooms: totalRooms, min_available: minAvail, available: enough });
}
