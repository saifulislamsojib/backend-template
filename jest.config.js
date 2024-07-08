const setupFile = '<rootDir>/src/__tests__/setup.ts';
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: [setupFile],
  modulePathIgnorePatterns: ['<rootDir>/dist/', setupFile, '<rootDir>/src/__tests__/utils'],
};
