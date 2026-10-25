'use client';

import { ChatStarters, ChatThread, Composer, type ChatMessageData } from '@bitbaum/chatkit/react';
import { useRef, useState } from 'react';

import type { AnalyzeInput } from '@/lib/analysis/input';
import styles from './analyze.module.css';

type OutputLanguage = NonNullable<AnalyzeInput['outputLanguage']>;

const languageNames: Record<OutputLanguage, string> = {
  en: 'English',
  de: 'German',
  fr: 'French',
};

export function ArticleConversation({
  sourceText,
  sourceDigest,
  title,
  outputLanguage,
}: {
  sourceText: string;
  sourceDigest: string;
  title: string;
  outputLanguage: OutputLanguage;
}) {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [quotes, setQuotes] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  async function ask(question: string) {
    if (sending || !question.trim()) return false;
    setError('');
    setSending(true);
    const userMessage: ChatMessageData = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question.trim(),
    };
    setMessages((current) => [...current, userMessage]);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetch('/api/article-chat', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          text: sourceText,
          sourceDigest,
          outputLanguage,
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        answer?: string;
        sourceQuote?: string | null;
        error?: { message?: string };
      };
      if (!response.ok || !payload.ok || !payload.answer) {
        setMessages((current) => current.filter((message) => message.id !== userMessage.id));
        setDraft(question.trim());
        setError(payload.error?.message || 'The article assistant could not answer. Try again.');
        return false;
      }
      const answerId = crypto.randomUUID();
      const answer: ChatMessageData = {
        id: answerId,
        role: 'assistant',
        content: payload.answer,
        speaker: { id: 'biaslens', name: 'BiasLens' },
      };
      setMessages((current) => [...current, answer]);
      if (payload.sourceQuote)
        setQuotes((current) => ({ ...current, [answerId]: payload.sourceQuote! }));
      return true;
    } catch {
      setMessages((current) => current.filter((message) => message.id !== userMessage.id));
      setDraft(question.trim());
      setError(
        controller.signal.aborted
          ? 'Question stopped. Your draft is ready to send again.'
          : 'Could not reach the article assistant. Your question is still in the box.',
      );
      return false;
    } finally {
      setSending(false);
    }
  }

  return (
    <section className={styles.conversation} aria-labelledby="article-conversation-heading">
      <header className={styles.conversationHeader}>
        <div>
          <p className={styles.eyebrow}>Ask about this article</p>
          <h3 id="article-conversation-heading">Continue the investigation</h3>
          <p>
            Answers use the examined text and show a matching passage when available. No outside
            research is performed here.
          </p>
        </div>
      </header>
      <div className={styles.conversationThread}>
        <ChatThread
          messages={messages}
          live={sending ? { status: 'Reading the examined article…' } : null}
          renderFooter={(message) => {
            const quote = quotes[message.id];
            return quote ? (
              <blockquote className={styles.chatQuote}>
                <p>{quote}</p>
                <cite>Exact passage from “{title}”</cite>
              </blockquote>
            ) : null;
          }}
          empty={
            <ChatStarters
              title="Start with a question"
              starters={[
                'What is the article’s main argument?',
                'Which assumption matters most?',
                'What evidence would challenge this conclusion?',
              ]}
              onPick={(question) => void ask(question)}
            />
          }
        />
      </div>
      {error && (
        <p className={styles.conversationError} role="alert">
          {error}
        </p>
      )}
      <Composer
        onSend={(text) => ask(text)}
        placeholder="Ask a question about this article…"
        ariaLabel="Ask a question about this article"
        sending={sending}
        onStop={() => abortRef.current?.abort()}
        value={draft}
        onValueChange={setDraft}
        attach={false}
        voice={false}
        labels={{ send: 'Ask', stop: 'Stop' }}
      />
      <p className={styles.conversationNote}>
        Response language: {languageNames[outputLanguage]}. Conversation stays in this page and is
        not saved on our server.
      </p>
    </section>
  );
}
