import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import { PUBLIC_ID } from '@/lib/reports/store';
import { loadWrittenArticle } from '@/lib/writing/load';

import { Composer } from '@/app/write/Composer';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Edit your article' };

export default async function EditWrittenArticle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!PUBLIC_ID.test(id)) notFound();
  const session = await getSession();
  if (!session) redirect('/sign-in?next=' + encodeURIComponent(`/articles/${id}/edit`));
  const article = await loadWrittenArticle(id);
  if (!article || article.authorId !== session.user.id) notFound();
  const parent = article.respondToId ? await loadWrittenArticle(article.respondToId) : null;
  const [sourceTitle, sourceName] = (article.sourceTitle ?? '').split(' — ');
  return (
    <main id="main-content" className="bb-frame">
      <Composer
        user={{ id: session.user.id, name: session.user.name }}
        wire={[]}
        topics={[]}
        initialTopic={null}
        initialSource={null}
        respondTo={null}
        initial={{
          id: article.id,
          title: article.title,
          body: article.body,
          status: article.status,
          source: article.sourceUrl
            ? {
                url: article.sourceUrl,
                title: sourceTitle || article.sourceUrl,
                source: sourceName || '',
              }
            : null,
          respondTo: parent
            ? { id: parent.id, title: parent.title, authorName: parent.authorName }
            : null,
        }}
      />
    </main>
  );
}
