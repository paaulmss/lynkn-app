module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { experimentalDecorators: true, emitDecoratorMetadata: true, esModuleInterop: true, target: 'ES2022', types: ['node', 'jest', 'multer'] } }] },
  clearMocks: true,
  testTimeout: 20000,
};
