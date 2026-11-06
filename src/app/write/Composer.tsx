'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { Markdown } from '@bitbaum/chatkit/react';
import { ArticleComposer, type PhotoPick } from '@bitbaum/writingkit/react';

import { authClient } from '@/lib/auth-client';
import { zurichTime } from '@/lib/format-time';
import type { WireItem } from '@/lib/wire/parse';
import { WRITING_LIMITS, type WritingStatus } from '@/lib/writing/input';
import type { Topic } from '@/lib/writing/trending';

import { PhotoSearch } from '../investigations/PhotoSearch';
import styles from './write.module.css';

export interface Source {
  url: string;
  title: string;
  source: string;
}
export interface RespondTo {
  id: string;
  title: string;
  authorName: string;
}
export interface Initial {
  id: string;
  title: string;
  body: string;
  status: WritingStatus;
  source: Source | null;
  respondTo: RespondTo | null;
}

const DRAFT_PREFIX = 'biaslens:draft:';
const draftKey = (userId: string | null, editingId: string | null) =>
  DRAFT_PREFIX + (editingId ?? 'new') + ':' + (userId ?? 'anon');

interface Answer {
  ok?: boolean;
  title?: string;
  body?: string;
  id?: string;
  error?: { message?: string; problems?: string[] };
}

const post = async (url: string, method: string, body: unknown): Promise<Answer> => {
  const response = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return (await response.json()) as Answer;
};

/**
 * What BiasLens adds around the shared composer: where the piece comes from (a
 * headline on the wires, an article being answered), the byline a first piece
 * needs, and the two routes that store it. The writing itself — title, text,
 * microphone, writing help, photos, charts, drafts, publish — is
 * `@bitbaum/writingkit/react`.
 */
export function Composer({
  user,
  wire,
  topics,
  initialTopic,
  initialSource,
  respondTo,
  initial,
}: {
  user: { id: string; name: string } | null;
  wire: WireItem[];
  topics: Topic[];
  initialTopic: string | null;
  initialSource: Source | null;
  respondTo: RespondTo | null;
  initial?: Initial;
}) {
  const router = useRouter();
  const editingId = initial?.id ?? null;
  const [source, setSource] = useState<Source | null>(initial?.source ?? initialSource);
  const answering = initial?.respondTo ?? respondTo;
  const [topic, setTopic] = useState<string | null>(initialTopic);
  // An account starts nameless; the first piece needs a byline, chosen here —
  // a real name or a pen name, theirs to change later.
  const needsName = !!user && !user.name.trim();
  const [penName, setPenName] = useState('');
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const next = '/sign-in?next=' + encodeURIComponent('/write');

  const headlines = useMemo(() => {
    if (!topic) return wire;
    const found = topics.find((t) => t.label === topic);
    return found ? found.items : wire;
  }, [wire, topics, topic]);

  const publish = async (status: WritingStatus, content: { title: string; body: string }) => {
    if (needsName) {
      const { error } = await authClient.updateUser({ name: penName.trim().slice(0, 80) });
      if (error)
        return { problems: [error.message ?? 'The byline could not be saved. Try again.'] };
    }
    const payload = await post(
      editingId ? `/api/writing/${editingId}` : '/api/writing',
      editingId ? 'PUT' : 'POST',
      {
        ...content,
        status,
        respondToId: answering?.id ?? null,
        sourceUrl: source?.url ?? null,
        sourceTitle: source ? `${source.title} — ${source.source}` : null,
      },
    );
    if (!payload.ok || !payload.id) {
      return {
        problems: payload.error?.problems?.length
          ? payload.error.problems
          : [payload.error?.message ?? 'The article could not be saved. Try again.'],
      };
    }
    router.push(status === 'published' ? `/articles/${payload.id}` : '/desk');
    router.refresh();
  };

  const assist = async (request: {
    mode: 'draft' | 'improve';
    instruction: string;
    title: string;
    body: string;
  }) => {
    const payload = await post('/api/writing/assist', 'POST', { ...request, language: 'English' });
    return payload.ok && payload.body
      ? { title: payload.title ?? request.title, body: payload.body }
      : null;
  };

  const above = (
    <>
      <header className={styles.head}>
        <p className={styles.kicker}>{editingId ? 'Edit' : 'Write'}</p>
        <h1>{editingId ? 'Edit your article' : answering ? 'Write a response' : 'Write'}</h1>
        <p className={styles.dek}>
          {answering
            ? 'Say where you agree, where you don’t, and what the other piece left out.'
            : 'Your own article, from scratch or about what is happening. Publish it, share it, then let the evidence check it.'}
        </p>
      </header>

      {answering && (
        <p className={styles.context}>
          In response to <Link href={`/articles/${answering.id}`}>{answering.title}</Link> by{' '}
          {answering.authorName}.
        </p>
      )}

      {source ? (
        <div className={styles.context}>
          <span>
            About:{' '}
            <a href={source.url} rel="noreferrer">
              {source.title}
            </a>{' '}
            <span className={styles.meta}>· {source.source}</span>
          </span>
          <button type="button" className={styles.linkButton} onClick={() => setSource(null)}>
            Remove
          </button>
        </div>
      ) : (
        !editingId &&
        !answering &&
        wire.length > 0 && (
          <section className={styles.topics} aria-labelledby="topics-heading">
            <h2 id="topics-heading">Writing about what is happening?</h2>
            {topics.length > 0 && (
              <div className={styles.chips} role="group" aria-label="Topics on more than one wire">
                <span className={styles.meta}>On the wires now:</span>
                {topics.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    className={styles.chip}
                    aria-pressed={topic === t.label}
                    onClick={() => setTopic(topic === t.label ? null : t.label)}
                  >
                    {t.label} <span className={styles.meta}>· {t.sources} sources</span>
                  </button>
                ))}
              </div>
            )}
            <ul className={styles.headlines}>
              {headlines.slice(0, topic ? 12 : 6).map((item) => (
                <li key={item.link}>
                  <span>
                    {item.title}{' '}
                    <span className={styles.meta}>
                      · {item.source}
                      {item.published ? ` · ${zurichTime(item.published)}` : ''}
                    </span>
                  </span>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => {
                      setSource({ url: item.link, title: item.title, source: item.source });
                      bodyRef.current?.focus();
                    }}
                  >
                    Write about it
                  </button>
                </li>
              ))}
            </ul>
            <p className={styles.meta}>Or write about anything else. Nothing here is required.</p>
          </section>
        )
      )}
    </>
  );

  return (
    <div className={styles.page}>
      <ArticleComposer
        signedIn={!!user}
        signInHref={next}
        authorName={user?.name.trim() || penName.trim()}
        draftKey={draftKey(user?.id ?? null, editingId)}
        anonymousDraftKey={draftKey(null, editingId)}
        initial={initial ? { title: initial.title, body: initial.body } : undefined}
        editingPublished={!!editingId && initial?.status === 'published'}
        canPublish={!needsName || penName.trim().length > 0}
        limits={{ title: WRITING_LIMITS.title, body: WRITING_LIMITS.body }}
        voice={{ transcribeUrl: '/api/transcribe', rememberKey: 'biaslens:dictation' }}
        formatTime={zurichTime}
        bodyRef={bodyRef}
        above={above}
        photos={(pick) => <PhotoSearch onPick={(image) => pick(image satisfies PhotoPick)} />}
        renderPreview={(text) => (
          <div className="journalTheme">
            <Markdown text={text} />
          </div>
        )}
        below={
          needsName && (
            <>
              <label className={styles.label} htmlFor="write-byline">
                Byline — the name readers see
              </label>
              <input
                id="write-byline"
                className={`${styles.byline} bb-control`}
                value={penName}
                onChange={(event) => setPenName(event.target.value)}
                maxLength={80}
                placeholder="Your name, or a pen name"
                autoComplete="nickname"
              />
              <p className={styles.meta}>Kept on your account; change it any time under Profile.</p>
            </>
          )
        }
        extraActions={
          editingId ? (
            <Link className="wk-btn" href={`/articles/${editingId}`}>
              Cancel
            </Link>
          ) : undefined
        }
        transport={{ publish, assist }}
      />
    </div>
  );
}
