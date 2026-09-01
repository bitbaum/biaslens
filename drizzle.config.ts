/**
 * Drizzle Kit configuration — fleet house pattern (see hirnli, vitareba).
 *
 * `src/lib/db/schema.ts` is the SSOT for domain types; migrations are generated
 * into `drizzle/` with `npm run db:generate` and applied with `npm run
 * db:migrate`. DATABASE_URL comes from the environment (no dotenv magic —
 * export it or prefix the command).
 */

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
