import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: 'src/test/setupFile.ts',
    globalSetup: 'src/test/globalSetup.ts',
    include: ['src/**/*.test.ts'],
    coverage: {
      exclude: ['src/**/*.test.ts', 'src/test/**', 'src/index.d.ts'],
      include: ['src/**/*.ts'],
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        branches: 67,
        functions: 80,
        lines: 81,
        statements: 80,
      },
    },
  },
  resolve: { tsconfigPaths: true },
});
