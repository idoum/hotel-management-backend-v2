/**
 * @file src/tests/rates.e2e.test.ts
 * @description Tests e2e basiques pour Rates (login, quote, CRUD minimal).
 */
import request from 'supertest';
import app from '@/app';

let token = '';

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@hotel.local', password: 'Admin@123' })
    .expect(200);
  token = res.body.accessToken;
});

describe('Rates — quotation', () => {
  it('GET /api/rates/quote returns nights & total', async () => {
    // BAR seedé par migration 014
    const today = new Date();
    const check_in = today.toISOString().slice(0,10);
    const check_out = new Date(today.getTime() + 2*86400000).toISOString().slice(0,10);

    const rpList = await request(app)
      .get('/api/rate-plans')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const bar = rpList.body.find((x: any) => x.code === 'BAR');
    expect(bar).toBeTruthy();

    const res = await request(app)
      .get('/api/rates/quote')
      .set('Authorization', `Bearer ${token}`)
      .query({ rate_plan_id: bar.id, check_in, check_out, adults: 2, children: 1 })
      .expect(200);

    expect(Array.isArray(res.body.nights)).toBe(true);
    expect(typeof res.body.total).toBe('number');
  });
});

describe('Rates — CRUD rate plans', () => {
  it('POST /api/rate-plans creates a plan', async () => {
    const res = await request(app)
      .post('/api/rate-plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'NRF', currency: 'USD', refundable: false })
      .expect(201);
    expect(res.body.id).toBeTruthy();
  });
});
