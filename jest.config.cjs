/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

/** @type { import('jest').Config } */
const config = {
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  moduleNameMapper: {
    // Do not resolve .wasm.js to .wasm by the rule below
    '^(.+)\\.wasm\\.js$': '$1.wasm.js',
    // SWC converts @/foo/bar.js to `../../src/foo/bar.js`, and then this rule
    // converts it again to `../../src/foo/bar` which then can be resolved to
    // `.ts` files.
    // See https://github.com/swc-project/jest/issues/64#issuecomment-1029753225
    // TODO: Use `--allowImportingTsExtensions` on TypeScript 5.0 so that we can
    // directly import `.ts` files without this hack.
    '^((?:\\.{1,2}|[A-Z:])*/.*)\\.js$': '$1',
    '^@/(.*)\\.js$': '<rootDir>/src/$1',
  },
  restoreMocks: true,
  roots: ['<rootDir>'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/summaly.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  extensionsToTreatAsEsm: ['.ts'],
};

module.exports = config;
