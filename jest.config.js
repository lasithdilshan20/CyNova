/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/?(*.)+(jest.test).[tj]s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.node.json',
      diagnostics: false,
      isolatedModules: true,
    },
  },
  verbose: false,
  collectCoverage: false,
};
