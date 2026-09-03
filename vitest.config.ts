import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    pool: 'threads',
    exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './'),
    },
  },
});
