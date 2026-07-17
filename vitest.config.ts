import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

// Resolve the `@/*` alias the same way tsconfig.json does, so tests can import app
// modules (route handlers, lib) by the path the app itself uses. tsconfig is the
// SSOT for the mapping; this mirrors it for the test runner rather than inventing
// a second convention.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
