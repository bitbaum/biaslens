import type { Metadata } from 'next';

import { getSession } from '@/lib/auth';
import { loadWire } from '@/lib/wire/load';
import { loadWrittenArticle } from '@/lib/writing/load';
import { trendingTopics } from '@/lib/writing/trending';
import { PUBLIC_ID } from '@/lib/reports/store';

import { Composer, type RespondTo, type Source } from './Composer';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Write',
  description:
    'Write your own article: from scratch, about a headline on the wires, or in answer to another article. Then let the evidence check it.',
};

type Params = Record<string, string | string[] | undefined>;
const one = (params: Params, key: string) => {
  const raw = params[key];
  return (Array.isArray(raw) ? raw[0] : raw) ?? null;
};

/** A headline handed over by Today (`?about=<link>&title=…&source=…`). */
function incomingSource(params: Params): Source | null {
  const url = one(params, 'about');
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return {
      url: parsed.toString(),
      title: one(params, 'title')?.slice(0, 300) || parsed.hostname,
      source: one(params, 'source')?.slice(0, 80) || parsed.hostname,
    };
  } catch {
    return null;
  }
}

export default async function WritePage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const [session, wire] = await Promise.all([getSession(), loadWire()]);
  const respondToId = one(params, 'respondTo');
  let respondTo: RespondTo | null = null;
  if (respondToId && PUBLIC_ID.test(respondToId)) {
    const parent = await loadWrittenArticle(respondToId);
    if (parent) respondTo = { id: parent.id, title: parent.title, authorName: parent.authorName };
  }
  const topic = one(params, 'topic');
  return (
    <main id="main-content" className="bb-frame">
      <Composer
        user={session ? { id: session.user.id, name: session.user.name } : null}
        wire={wire.items}
        topics={trendingTopics(wire.items)}
        initialTopic={topic?.slice(0, 60) ?? null}
        initialSource={incomingSource(params)}
        respondTo={respondTo}
      />
    </main>
  );
}
