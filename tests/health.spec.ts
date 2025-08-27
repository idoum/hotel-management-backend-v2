/**
 * @file tests/health.spec.ts
 */
import request from 'supertest';
// Update the import path below to the correct relative path to your app module
import app from '../src/app';

describe('Health', () => {
  it('GET /api/health -> 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
  });
});
