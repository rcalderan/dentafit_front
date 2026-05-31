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
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      include: [
        'src/rentafit/domains/account/services/account.service.ts',
        'src/rentafit/domains/account/features/profile/account-profile.component.ts',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
});
