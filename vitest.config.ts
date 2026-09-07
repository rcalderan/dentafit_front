/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

// Nota: O builder @angular/build:unit-test usa vitest-base.config.ts (via runnerConfig: true).
// Este arquivo e usado apenas por `vitest --ui` standalone. Para testes Angular, use `ng test`.
// O plugin angularVitestPlugin nao e exportado publicamente por @angular/build@21.0.x;
// a integracao Angular+Vitest e gerenciada internamente pelo builder `ng test`.
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    testTimeout: 20000,
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
