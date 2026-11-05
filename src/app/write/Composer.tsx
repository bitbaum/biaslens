'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { authClient } from '@/lib/auth-client';
import type { WireItem } from '@/lib/wire/parse';
import { readingMinutes, WRITING_LIMITS, type WritingStatus } from '@/lib/writing/input';
import type { Topic } from '@/lib/writing/trending';
import { zurichTime } from '@/lib/format-time';

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

interface Draft {
  title: string;
  body: string;
  source: Source | null;
  respondToId: string | null;
  savedAt: string;
}

const readDraft = (key: string): Draft | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
};

/**
 * One place to write: a title, the text, and — if you want one — the
 * headline or article you are answering. Drafts stay on this device until
 * you publish; signing in never loses them.
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
  const key = draftKey(user?.id ?? null, editingId);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [source, setSource] = useState<Source | null>(initial?.source ?? initialSource);
  const answering = initial?.respondTo ?? respondTo;
  const [topic, setTopic] = useState<string | null>(initialTopic);
  const [restored, setRestored] = useState<string | null>(null);
  // An account starts nameless; the first piece needs a byline, and the
  // writer chooses it here — a real name or a pen name, theirs to change later.
  const needsName = !!user && !user.name.trim();
  const [penName, setPenName] = useState('');
  const [busy, setBusy] = useState<WritingStatus | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // A draft from an earlier visit comes back — including one typed before
  // signing in, which moves from the anonymous key to this account's.
  useEffect(() => {
    queueMicrotask(() => {
      if (initial) return;
      const anonKey = draftKey(null, editingId);
      let draft = readDraft(key);
      if (!draft && user && anonKey !== key) {
        draft = readDraft(anonKey);
        if (draft) {
          try {
            localStorage.setItem(key, JSON.stringify(draft));
            localStorage.removeItem(anonKey);
          } catch {
            /* storage full or blocked: the draft is still shown */
          }
        }
      }
      if (!draft || (!draft.title && !draft.body)) return;
      const found = draft;
      setTitle((current) => current || found.title);
      setBody((current) => current || found.body);
      if (found.source) setSource((current) => current ?? found.source);
      setRestored(found.savedAt);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, on mount
  }, []);

  // Keep the draft on this device as it is written.
  useEffect(() => {
    if (!title && !body) return;
    const handle = window.setTimeout(() => {
      try {
        const draft: Draft = {
          title,
          body,
          source,
          respondToId: answering?.id ?? null,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(key, JSON.stringify(draft));
        setSavedNote('Draft kept on this device.');
      } catch {
        setSavedNote(null);
      }
    }, 600);
    return () => window.clearTimeout(handle);
  }, [title, body, source, answering, key]);

  // The text box grows with the article; the page scrolls, never an inner box.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const frame = requestAnimationFrame(() => {
      el.style.height = 'auto';
      el.style.height = `${Math.max(240, el.scrollHeight)}px`;
    });
    return () => cancelAnimationFrame(frame);
  }, [body]);

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const ready =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    !busy &&
    (!needsName || penName.trim().length > 0);
  const headlines = useMemo(() => {
    if (!topic) return wire;
    const found = topics.find((t) => t.label === topic);
    return found ? found.items : wire;
  }, [wire, topics, topic]);

  const save = async (status: WritingStatus) => {
    if (!ready) return;
    if (!user) {
      router.push('/sign-in?next=' + encodeURIComponent('/write'));
      return;
    }
    setBusy(status);
    setProblems([]);
    try {
      if (needsName) {
        const { error } = await authClient.updateUser({ name: penName.trim().slice(0, 80) });
        if (error) {
          setProblems([error.message ?? 'The byline could not be saved. Try again.']);
          return;
        }
      }
      const response = await fetch(editingId ? `/api/writing/${editingId}` : '/api/writing', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          status,
          respondToId: answering?.id ?? null,
          sourceUrl: source?.url ?? null,
          sourceTitle: source ? `${source.title} — ${source.source}` : null,
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        id?: string;
        error?: { message?: string; problems?: string[] };
      };
      if (!payload.ok || !payload.id) {
        setProblems(
          payload.error?.problems?.length
            ? payload.error.problems
            : [payload.error?.message ?? 'The article could not be saved. Try again.'],
        );
        return;
      }
      localStorage.removeItem(key);
      router.push(status === 'published' ? `/articles/${payload.id}` : '/desk');
      router.refresh();
    } catch {
      setProblems(['The article could not be sent. Check your connection and try again.']);
    } finally {
      setBusy(null);
    }
  };

  const onKey = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      void save('published');
    }
  };

  const publishLabel = !user
    ? 'Sign in to publish'
    : busy === 'published'
      ? 'Publishing…'
      : editingId && initial?.status === 'published'
        ? 'Save changes'
        : 'Publish';

  return (
    <div className={styles.page} onKeyDown={onKey}>
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

      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void save('published');
        }}
      >
        <label className={styles.label} htmlFor="write-title">
          Title
        </label>
        <input
          id="write-title"
          className={`${styles.title} bb-control`}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={WRITING_LIMITS.title}
          placeholder="Say it in one line"
          autoComplete="off"
          disabled={!!busy}
        />
        <label className={styles.label} htmlFor="write-body">
          Article
        </label>
        <textarea
          id="write-body"
          ref={bodyRef}
          className={`${styles.body} bb-control`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={WRITING_LIMITS.body}
          placeholder="Write here. Paragraphs are enough; Markdown works for headings, lists, links and quotes."
          disabled={!!busy}
        />
        {needsName && (
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
              disabled={!!busy}
            />
            <p className={styles.meta}>Kept on your account; change it any time under Profile.</p>
          </>
        )}
        <p className={styles.meta} aria-live="polite">
          {words} {words === 1 ? 'word' : 'words'} · {readingMinutes(body)} min read
          {restored ? ` · Draft from ${zurichTime(restored)} restored` : ''}
          {!restored && savedNote ? ` · ${savedNote}` : ''}
        </p>

        {problems.length > 0 && (
          <div role="alert" className={styles.problems}>
            <ul>
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={`${styles.primary} bb-button bb-button--primary`}
            disabled={!ready}
          >
            {publishLabel}
          </button>
          {user && (
            <button
              type="button"
              className="bb-button bb-button--secondary"
              disabled={!ready}
              onClick={() => void save('draft')}
            >
              {busy === 'draft' ? 'Saving…' : 'Save as draft'}
            </button>
          )}
          {editingId && (
            <Link className="bb-button bb-button--secondary" href={`/articles/${editingId}`}>
              Cancel
            </Link>
          )}
        </div>
        <p className={styles.meta}>
          {user
            ? `Published as ${user.name.trim() || penName.trim() || 'you'}. Anyone with the link can read it; you can edit or delete it later. Ctrl/⌘ + Enter publishes.`
            : 'Your draft stays on this device while you sign in or create an account; nothing is lost.'}
        </p>
      </form>
    </div>
  );
}
