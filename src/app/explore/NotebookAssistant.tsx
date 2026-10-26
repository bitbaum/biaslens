'use client';

import { Composer } from '@bitbaum/chatkit/react';
import type { UseAiForm } from '@fleet/ai-forms/react';

import styles from './explore.module.css';

/** Questions a person can start from with one tap. */
const EXAMPLES = [
  'Why did electricity prices in Switzerland rise in 2022?',
  'Does remote work make people less productive?',
  'Are e-bikes making cycling more dangerous?',
];

/**
 * The notebook's one input: say or type what you want to understand, and the
 * notebook fills itself (@fleet/ai-forms). Once filled, the same box changes
 * it ("only Switzerland", "add an economic explanation"), with undo and
 * one-tap suggestions. The microphone is chatkit's, as everywhere in the fleet.
 */
export function NotebookAssistant({ form }: { form: UseAiForm }) {
  const empty = form.isEmpty;
  const send = async (text: string) => {
    const result = await form.ask(text);
    return result.ok;
  };

  return (
    <section className={styles.assistant} aria-label="Research assistant">
      <Composer
        onSend={send}
        sending={form.busy}
        placeholder={empty ? 'What would you like to understand?' : 'Say what to change…'}
        ariaLabel={empty ? 'Your research question' : 'Change the notebook'}
        attach={false}
        voice={{ transcribeUrl: '/api/transcribe' }}
        labels={{ send: empty ? 'Start' : 'Change' }}
      />
      {form.error && (
        <p className={styles.error} role="alert">
          {form.error}
        </p>
      )}
      {empty ? (
        <div className={styles.examples}>
          <p className={styles.eyebrow}>Or start from one of these</p>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              disabled={form.busy}
              onClick={() => void form.ask(example)}
            >
              {example}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className={styles.assistantActions}>
            <button
              type="button"
              className="bb-button bb-button--secondary"
              disabled={form.busy || form.suggesting}
              onClick={() => void form.suggest()}
            >
              {form.suggesting ? 'Looking…' : 'Suggest more'}
            </button>
            <button
              type="button"
              className="bb-button bb-button--secondary"
              disabled={!form.canUndo || form.busy}
              onClick={form.undo}
            >
              Undo
            </button>
          </div>
          {form.changed.length > 0 && !form.busy && (
            <p className={styles.state} role="status">
              {form.changed.length === 1
                ? '1 part updated.'
                : `${form.changed.length} parts updated.`}
            </p>
          )}
          {form.suggestions.length > 0 && (
            <ul className={styles.suggestions} aria-label="Suggestions">
              {form.suggestions.map((suggestion) => (
                <li key={suggestion.instruction}>
                  <button
                    type="button"
                    disabled={form.busy}
                    onClick={() => void form.applySuggestion(suggestion)}
                  >
                    {suggestion.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
