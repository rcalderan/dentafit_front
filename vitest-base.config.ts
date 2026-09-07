// Learn more about Vitest configuration options at https://vitest.dev/config/

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    // Compilação de componentes Angular no vitest pode estourar 5s no cold start sob carga
    testTimeout: 20000,
  },
});
