'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type SetStateAction,
} from 'react';
import { Markdown } from '@bitbaum/chatkit/react';

import { useWritingOperation } from '@/app/_components/writing/useWritingOperation';
import { authClient } from '@/lib/auth-client';
import type { WireItem } from '@/lib/wire/parse';
import { readingMinutes, WRITING_LIMITS, type WritingStatus } from '@/lib/writing/input';
import type { Topic } from '@/lib/writing/trending';
import { zurichTime } from '@/lib/format-time';

import {
  ChartPanel,
  ImprovePanel,
  insertAt,
  PhotoPanel,
  SpeakPanel,
  wrapSelection,
  type Panel,
} from './WritingTools';
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

type Fields = { title: string; body: string };

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
type ComposerProps = {
  user: { id: string; name: string } | null;
  wire: WireItem[];
  topics: Topic[];
  initialTopic: string | null;
  initialSource: Source | null;
  respondTo: RespondTo | null;
  initial?: Initial;
};

export function Composer(props: ComposerProps) {
  return (
    <ComposerEditor
      key={JSON.stringify([props.user?.id ?? null, props.initial?.id ?? null])}
      {...props}
    />
  );
}

function ComposerEditor({
  user,
  wire,
  topics,
  initialTopic,
  initialSource,
  respondTo,
  initial,
}: ComposerProps) {
  const router = useRouter();
  const editingId = initial?.id ?? null;
  const key = draftKey(user?.id ?? null, editingId);
  const [title, setTitleState] = useState(initial?.title ?? '');
  const [body, setBodyState] = useState(initial?.body ?? '');
  const [source, setSourceState] = useState<Source | null>(initial?.source ?? initialSource);
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
  const [panel, setPanel] = useState<Panel>(null);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [undo, setUndo] = useState<{ before: Fields; after: Fields; context: string } | null>(null);
  const undoRef = useRef<typeof undo>(null);
  const fields = useRef({ title, body });
  const published = useRef(false);
  const writing = useWritingOperation(key, JSON.stringify([title, body, source, answering]));
  const assisting = writing.busy;
  const context = JSON.stringify([source, answering]);
  const canUndo =
    !!undo &&
    undo.context === context &&
    undo.after.title === title &&
    undo.after.body === body &&
    !assisting &&
    !busy;
  const latestDraft = useRef<Draft | null>(null);
  useLayoutEffect(() => {
    latestDraft.current = {
      title,
      body,
      source,
      respondToId: answering?.id ?? null,
      savedAt: new Date().toISOString(),
    };
  }, [title, body, source, answering]);
  useLayoutEffect(
    () => () => {
      const draft = latestDraft.current;
      if (published.current || !draft || (!draft.title && !draft.body)) return;
      try {
        localStorage.setItem(key, JSON.stringify({ ...draft, ...fields.current }));
      } catch {
        /* Device storage can be blocked. */
      }
    },
    [key],
  );

  function edit(patch: Partial<Fields>) {
    published.current = false;
    writing.invalidate();
    undoRef.current = null;
    setUndo(null);
    fields.current = { ...fields.current, ...patch };
    if (patch.title !== undefined) setTitleState(patch.title);
    if (patch.body !== undefined) setBodyState(patch.body);
  }
  const setTitle = (next: SetStateAction<string>) =>
    edit({ title: typeof next === 'function' ? next(fields.current.title) : next });
  const setBody = (next: SetStateAction<string>) =>
    edit({ body: typeof next === 'function' ? next(fields.current.body) : next });
  const setSource = (next: SetStateAction<Source | null>) => {
    published.current = false;
    writing.invalidate();
    undoRef.current = null;
    setUndo(null);
    setSourceState(next);
  };
  function undoChange() {
    const change = undoRef.current;
    if (
      !change ||
      change.context !== context ||
      writing.isBusy() ||
      busy ||
      fields.current.title !== change.after.title ||
      fields.current.body !== change.after.body
    )
      return;
    edit(change.before);
  }
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // A draft from an earlier visit comes back — including one typed before
  // signing in, which moves from the anonymous key to this account's.
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active || initial) return;
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
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per keyed editor, on mount
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

  /** Writing help: a brief becomes a draft; an instruction revises the text. */
  const assist = async (mode: 'draft' | 'improve', instruction: string) => {
    if (!user) {
      router.push('/sign-in?next=' + encodeURIComponent('/write'));
      return;
    }
    if (busy || writing.isBusy()) return;
    setProblems([]);
    const before = { ...fields.current };
    await writing.run(
      async ({ signal }) => {
        const payload = (await fetch('/api/writing/assist', {
          method: 'POST',
          signal,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ mode, instruction, ...before, language: 'English' }),
        })
          .then((response) => response.json())
          .catch(() => {
            throw new Error(
              'Writing help could not be reached. Check your connection and try again.',
            );
          })) as {
          ok?: boolean;
          title?: string;
          body?: string;
          error?: { message?: string };
        };
        if (!payload.ok || !payload.body)
          throw new Error(payload.error?.message ?? 'Writing help could not answer. Try again.');
        return { title: payload.title || before.title, body: payload.body };
      },
      (after) => {
        fields.current = after;
        writing.invalidate();
        const change = { before, after, context };
        undoRef.current = change;
        setUndo(change);
        setTitleState(after.title);
        setBodyState(after.body);
        setTab('write');
        setPanel(null);
      },
    );
  };

  const toggle = (next: Panel) => setPanel((current) => (current === next ? null : next));
  const insert = (snippet: string) => {
    setTab('write');
    insertAt(bodyRef, body, snippet, setBody);
    setPanel(null);
  };

  const save = async (status: WritingStatus) => {
    if (!ready) return;
    if (!user) {
      router.push('/sign-in?next=' + encodeURIComponent('/write'));
      return;
    }
    writing.cancel();
    setBusy(status);
    setProblems([]);
    try {
      if (needsName) {
        const { error } = await authClient.updateUser({ name: penName.trim().slice(0, 80) });
        if (!writing.isActive()) return;
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
      if (!writing.isActive()) return;
      if (!payload.ok || !payload.id) {
        setProblems(
          payload.error?.problems?.length
            ? payload.error.problems
            : [payload.error?.message ?? 'The article could not be saved. Try again.'],
        );
        return;
      }
      published.current = true;
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
        <div className={styles.editorHead}>
          <div className={styles.tabs} role="tablist" aria-label="Write or preview">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'write'}
              className={styles.tab}
              onClick={() => setTab('write')}
            >
              Write
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'preview'}
              className={styles.tab}
              onClick={() => setTab('preview')}
            >
              Preview
            </button>
          </div>
          <div className={styles.toolbar} role="toolbar" aria-label="Writing tools">
            <button
              type="button"
              className={styles.tool}
              aria-pressed={panel === 'speak'}
              onClick={() => toggle('speak')}
            >
              Speak
            </button>
            <button
              type="button"
              className={styles.tool}
              aria-pressed={panel === 'improve'}
              onClick={() => toggle('improve')}
              disabled={!body.trim()}
            >
              Improve
            </button>
            <button
              type="button"
              className={styles.tool}
              aria-pressed={panel === 'photo'}
              onClick={() => toggle('photo')}
            >
              Photo
            </button>
            <button
              type="button"
              className={styles.tool}
              aria-pressed={panel === 'chart'}
              onClick={() => toggle('chart')}
            >
              Chart
            </button>
            <span className={styles.toolGap} aria-hidden="true" />
            <button
              type="button"
              className={styles.tool}
              onClick={() => wrapSelection(bodyRef, body, '## ', '', 'Heading', setBody)}
              title="Heading"
            >
              H
            </button>
            <button
              type="button"
              className={styles.tool}
              onClick={() => wrapSelection(bodyRef, body, '**', '**', 'bold', setBody)}
              title="Bold"
            >
              B
            </button>
            <button
              type="button"
              className={styles.tool}
              onClick={() => wrapSelection(bodyRef, body, '> ', '', 'A quotation', setBody)}
              title="Quote"
            >
              “
            </button>
            <button
              type="button"
              className={styles.tool}
              onClick={() => wrapSelection(bodyRef, body, '- ', '', 'First point', setBody)}
              title="List"
            >
              •
            </button>
            <button
              type="button"
              className={styles.tool}
              onClick={() => wrapSelection(bodyRef, body, '[', '](https://)', 'link text', setBody)}
              title="Link"
            >
              Link
            </button>
          </div>
        </div>

        {panel === 'speak' && (
          <SpeakPanel
            onEdit={writing.invalidate}
            busy={assisting}
            canDraft={!!user}
            onBrief={(brief) => void assist('draft', brief)}
            onDictate={(text) => insert(text)}
          />
        )}
        {panel === 'improve' && (
          <ImprovePanel
            onEdit={writing.invalidate}
            busy={assisting}
            canUndo={canUndo}
            onUndo={undoChange}
            onImprove={(instruction) => void assist('improve', instruction)}
          />
        )}
        {panel === 'photo' && <PhotoPanel onPick={insert} />}
        {panel === 'chart' && <ChartPanel onInsert={insert} />}

        {writing.busy && (
          <button type="button" className="bb-button bb-button--secondary" onClick={writing.cancel}>
            Cancel writing help
          </button>
        )}
        {writing.error && (
          <p role="alert" className={styles.problemLine}>
            {writing.error}
          </p>
        )}
        {tab === 'write' ? (
          <textarea
            id="write-body"
            ref={bodyRef}
            aria-label="Article"
            className={`${styles.body} bb-control`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={WRITING_LIMITS.body}
            placeholder="Write here — or press Speak and say what you want written. Paragraphs are enough; Markdown works for headings, lists, links and quotes."
            disabled={!!busy}
          />
        ) : (
          <div className={`${styles.preview} journalTheme`} aria-label="Preview">
            {body.trim() ? (
              <Markdown text={body} />
            ) : (
              <p className={styles.meta}>Nothing to preview yet.</p>
            )}
          </div>
        )}
        {canUndo && (
          <p className={styles.meta}>
            The text was changed by writing help.{' '}
            <button type="button" className={styles.linkButton} onClick={undoChange}>
              Undo
            </button>
          </p>
        )}
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
