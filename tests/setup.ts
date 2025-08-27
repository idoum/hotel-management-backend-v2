/**
 * @file tests/setup.ts
 * @description Init DB pour les tests: charge .env.test, init Sequelize avec sync force.
 */
import * as path from 'node:path';
import * as fs from 'node:fs';
// Update the import path to be relative, adjust as needed based on your project structure
import { initSequelize, closeSequelize } from '../src/loaders/sequelize';

beforeAll(async () => {
  // charge .env.test si présent
  const envTest = path.resolve(process.cwd(), '.env.test');
  if (fs.existsSync(envTest)) {
    process.env = { ...process.env, ...Object.fromEntries(
      fs.readFileSync(envTest, 'utf8')
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#'))
        .map(l => {
          const i = l.indexOf('=');
          return [l.slice(0,i), l.slice(i+1)];
        })
    ) };
  }

  await initSequelize({ sync: true, force: true });
});

afterAll(async () => {
  await closeSequelize();
});
