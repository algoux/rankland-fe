import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      umi: path.resolve(__dirname, 'tests/shims/umi.ts'),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/unit/**/*.test.ts', 'tests/ssr/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**', 'tests/e2e/**'],
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/utils/**', 'src/configs/**', 'src/services/api/**'],
      exclude: ['**/*.d.ts', '**/index.ts'],
    },
  },
});
