/**
 * @file tests/health.spec.ts
 * @description Teste l'endpoint /api/health de base.
 */

import request from 'supertest';
import app from '@/app';

describe('Health', () => {
  it('GET /api/health → 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
