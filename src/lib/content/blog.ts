import { join } from 'node:path';

import { readCollection, readEntry } from 'bip-kit/node';

const JOURNAL_PATH = join(process.cwd(), 'content', 'blog');

/**
 * bip-kit's filesystem content contract is the single blog reader.
 * This site intentionally does not duplicate a markdown parser, article
 * database or AI-written publication workflow.
 */
export function listPublishedPosts() {
  return readCollection(JOURNAL_PATH);
}

export function getPublishedPost(slug: string) {
  return readEntry(JOURNAL_PATH, slug);
}
