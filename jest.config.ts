import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/?(*.)+(jest.test).[tj]s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // Speed up ts-jest
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.node.json',
      diagnostics: false,
      isolatedModules: true,
    },
  },
  // Reduce noisy output
  verbose: false,
  collectCoverage: false,
};

export default config;
