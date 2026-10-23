import { join } from 'node:path';

import { readEntry } from 'bip-kit/node';

/** The same reviewed Markdown pipeline as the journal; no second renderer. */
export function getWhitepaper() {
  return readEntry(join(process.cwd(), 'content', 'research'), 'open-investigation');
}
