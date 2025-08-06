import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: 'src/test/setupFile.ts',
    globalSetup: 'src/test/globalSetup.ts',
    include: ['src/**/*.test.ts'],
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
