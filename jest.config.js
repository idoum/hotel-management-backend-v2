/**
 * @file jest.config.js
 * @description Configuration Jest pour tests TypeScript + alias @/
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' }
};
