/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { angularVitestPlugin } from '@angular/build/vitest';

export default defineConfig({
  plugins: [angularVitestPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
  },
});
