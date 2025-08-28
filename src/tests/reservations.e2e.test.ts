/**
 * @file src/tests/reservations.e2e.test.ts
 * @description Tests e2e basiques pour disponibilité et création de réservation.
 */
import request from 'supertest';
import app from '@/app';

let token = '';
beforeAll(async () => {
  const res = await request(app).post('/api/auth/login').send({ email: 'admin@hotel.local', password: 'Admin@123' }).expect(200);
  token = res.body.accessToken;
});

describe('Availability & Reservations', () => {
  it('should return availability for room_type_id=1', async () => {
    const today = new Date();
    const d = today.toISOString().slice(0,10);
    const d2 = new Date(today.getTime() + 86400000).toISOString().slice(0,10);

    const resAvail = await request(app)
      .get('/api/availability/search')
      .set('Authorization', `Bearer ${token}`)
      .query({ room_type_id: 1, check_in: d, check_out: d2, rooms: 1 })
      .expect(200);

    expect(typeof resAvail.body.available).toBe('boolean');
  });

  it('should create a basic reservation', async () => {
    const today = new Date();
    const d = today.toISOString().slice(0,10);
    const d2 = new Date(today.getTime() + 86400000).toISOString().slice(0,10);

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        check_in: d,
        check_out: d2,
        rooms: [{ room_type_id: 1, rate_plan_id: null, qty: 1, adults: 2, children: 0 }],
        currency: 'USD'
      })
      .expect(201);

    expect(res.body.id).toBeTruthy();
    expect(Array.isArray(res.body.rooms)).toBe(true);
  });
});
