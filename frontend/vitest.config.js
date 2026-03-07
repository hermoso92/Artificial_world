import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['**/*.test.*', '**/test/**', 'node_modules'],
    },
    reporters: ['verbose'],
  },
});
