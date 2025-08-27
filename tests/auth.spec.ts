/**
 * @file tests/auth.spec.ts
 */
import request from 'supertest';
// Update the import path to the correct relative path, e.g.:
import app from '../src/app';

describe('Auth E2E', () => {
  const email = 'e2e.user@hotel.local';
  const pass = 'Test@12345';
  let refreshToken = '';

  it('POST /api/auth/register -> 201', async () => {
    const res = await request(app).post('/api/auth/register').send({ email, password: pass });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    refreshToken = res.body.refreshToken;
  });

  it('POST /api/auth/login -> 200', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password: pass });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    refreshToken = res.body.refreshToken;
  });

  it('POST /api/auth/refresh -> 200 & rotates token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    // l'ancien refresh ne doit plus marcher
    const res2 = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res2.status).toBe(401);
  });

  it('POST /api/auth/forgot-password -> 200', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email });
    expect(res.status).toBe(200);
    // en test MAIL_DRIVER=json -> pas d'email réel
    // on peut récupérer le token depuis debug (en non-production)
    expect(res.body).toHaveProperty('message');
    // debug peut ne pas être présent si NODE_ENV=production
  });
});
