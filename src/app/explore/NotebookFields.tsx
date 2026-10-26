'use client';

import type { UseAiForm } from '@fleet/ai-forms/react';
import { useState } from 'react';

import styles from './explore.module.css';

/** "- a\n- b" ↔ ["a", "b"]: the explanations are stored as one text field. */
export function explanationList(notes: string): string[] {
  return notes
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);
}
const asNotes = (items: string[]) => items.map((item) => `- ${item}`).join('\n');

/** Text that reads as text; one tap turns it into a box, leaving it saves. */
function Editable({
  label,
  value,
  onChange,
  multiline = false,
  aiWritten,
  big = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  aiWritten: boolean;
  big?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    const props = {
      'aria-label': label,
      autoFocus: true,
      value,
      maxLength: multiline ? 4000 : 400,
      onChange: (event: { target: { value: string } }) => onChange(event.target.value),
      onBlur: () => setEditing(false),
    };
    return multiline ? <textarea rows={5} {...props} /> : <input {...props} />;
  }
  return (
    <button
      type="button"
      className={big ? `${styles.editable} ${styles.editableBig}` : styles.editable}
      onClick={() => setEditing(true)}
      aria-label={`Edit ${label.toLowerCase()}`}
    >
      {value || <span className={styles.placeholder}>Add {label.toLowerCase()}</span>}
      {aiWritten && value && <span className={styles.aiMark}>AI draft · tap to edit</span>}
    </button>
  );
}

export function NotebookFields({ form }: { form: UseAiForm }) {
  const explanations = explanationList(form.text('notes'));
  return (
    <>
      <section className={styles.section} aria-labelledby="question-heading">
        <h2 id="question-heading">Your question</h2>
        <Editable
          big
          label="Question"
          value={form.text('question')}
          onChange={(v) => form.setValue('question', v)}
          aiWritten={form.isAiTouched('question')}
        />
        <p className={styles.fieldLabel}>Scope</p>
        <Editable
          label="Scope"
          value={form.text('scope')}
          onChange={(v) => form.setValue('scope', v)}
          aiWritten={form.isAiTouched('scope')}
        />
      </section>
      <section className={styles.section} aria-labelledby="explanations-heading">
        <h2 id="explanations-heading">Explanations to keep open</h2>
        {explanations.length ? (
          <ul className={styles.explanations}>
            {explanations.map((item, index) => (
              <li key={`${index}-${item}`}>
                <span>{item}</span>
                <button
                  type="button"
                  aria-label={`Remove: ${item}`}
                  onClick={() =>
                    form.setValue('notes', asNotes(explanations.filter((_, i) => i !== index)))
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.placeholder}>
            None yet. Say “add an explanation about …” in the box above.
          </p>
        )}
      </section>
      <section className={styles.section} aria-labelledby="challenge-heading">
        <h2 id="challenge-heading">What would change your mind</h2>
        <Editable
          multiline
          label="Challenge"
          value={form.text('challenge')}
          onChange={(v) => form.setValue('challenge', v)}
          aiWritten={form.isAiTouched('challenge')}
        />
      </section>
    </>
  );
}
