import { describe, expect, it } from 'vitest';

import { draftState, type DraftStateInput } from './draft-state';

const base: DraftStateInput = {
  signedIn: false,
  title: '',
  body: '',
  server: null,
  browserKept: true,
  time: (iso) => `[${iso}]`,
};

describe('draftState', () => {
  it('says nothing before anything is written', () => {
    expect(draftState(base)).toBeNull();
  });

  it('never claims a signed-out draft is on BiasLens', () => {
    const line = draftState({ ...base, title: 'A', body: 'B' });
    expect(line).toMatch(/^Kept in this browser only, not saved to BiasLens/);
    expect(line).toMatch(/Sign in to save it as a draft/);
  });

  it('admits when the browser could not keep it either', () => {
    expect(draftState({ ...base, body: 'B', browserKept: false })).toMatch(/^Not saved anywhere/);
  });

  it('a signed-in new piece is not on the account until saved', () => {
    expect(draftState({ ...base, signedIn: true, body: 'B' })).toBe(
      'Not saved to your account yet, kept in this browser until you save.',
    );
  });

  it('a saved draft says so, with the time', () => {
    const server = { at: '2026-11-12T05:05:00Z', title: 'A', body: 'B', status: 'draft' as const };
    expect(draftState({ ...base, signedIn: true, title: 'A', body: 'B', server })).toBe(
      'Draft saved to your account · [2026-11-12T05:05:00Z]',
    );
    expect(draftState({ ...base, signedIn: true, title: 'A', body: 'B2', server })).toMatch(
      /^Changes not saved to your account yet/,
    );
  });

  it('a published piece shows when it was last saved', () => {
    const server = { at: 'T', title: 'A', body: 'B', status: 'published' as const };
    expect(draftState({ ...base, signedIn: true, title: 'A', body: 'B', server })).toBe(
      'Published · last saved [T]',
    );
  });
});
