import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/** Live-model report evaluation (eval/*.eval.ts). Not part of `verify`. */
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { include: ['eval/**/*.eval.ts'], testTimeout: 240_000 },
});
