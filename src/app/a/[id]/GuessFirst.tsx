'use client';

import { useState, type ReactNode } from 'react';

import type { Guess } from '@/lib/replies/findings';

import styles from './receiver.module.css';

/**
 * One tap before the reveal. Guessing turns a correction into a game, and a
 * wrong guess is the most memorable way to learn who actually said it.
 */
export function GuessFirst({
  guess,
  copy,
  children,
}: {
  guess: Guess;
  copy: { title: string; right: string; wrong: string; skip: string };
  /** The findings: shown once the reader has guessed or skipped, so the answer is not spoiled. */
  children: ReactNode;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);
  if (skipped) return <>{children}</>;
  return (
    <>
      <section className={styles.guess} aria-labelledby="guess-heading">
        <p id="guess-heading" className={styles.kicker}>
          {copy.title}
        </p>
        <p className={styles.guessQuestion}>{guess.question}</p>
        <div className={styles.guessOptions} role="group" aria-label={copy.title}>
          {guess.options.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={picked !== null}
              aria-pressed={picked === option.id}
              className={
                picked && option.id === guess.answerId ? styles.guessAnswer : styles.guessOption
              }
              onClick={() => setPicked(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p aria-live="polite" className={styles.guessResult}>
          {picked === null ? '' : picked === guess.answerId ? copy.right : copy.wrong}
        </p>
        {picked === null && (
          <button type="button" className={styles.textButton} onClick={() => setSkipped(true)}>
            {copy.skip}
          </button>
        )}
      </section>
      {picked !== null && children}
    </>
  );
}
