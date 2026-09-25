/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowJs: true,
          isolatedModules: true,
          target: 'ES2020',
          paths: { '@/*': ['./*'] },
        },
        diagnostics: false,
      },
    ],
  },
  collectCoverageFrom: [
    'app/api/**/*.ts',
    'lib/**/*.ts',
    '!**/*.d.ts',
    '!lib/embeddings.ts',
    '!lib/recommendations.ts',
    '!lib/prisma.ts',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/app/api/auth/\\[\\.\\.\\.nextauth\\]/',
  ],
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  coverageDirectory: 'coverage',
};
