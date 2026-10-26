import { describe, expect, it, vi } from 'vitest';

import { analyzeArticle, type ReportResult } from '@/lib/analysis/run';
import { FIXTURE_ARTICLE, FIXTURE_ASSESSMENT, FIXTURE_READING } from '@/lib/analysis/test-fixture';
import { parseRewriteRequest } from '@/lib/config/rewrite-modes';

import { originalFacts, rewriteLabel, writeRewrite } from './run';

async function fixture(): Promise<ReportResult> {
  return analyzeArticle(
    { mode: 'text', url: null, text: FIXTURE_ARTICLE, outputLanguage: 'de-CH' },
    {
      readSource: async () => ({ ok: false, url: '', reason: '' }),
      complete: async (_m, pass) => ({
        text: JSON.stringify(pass === 'reading' ? FIXTURE_READING : FIXTURE_ASSESSMENT),
        modelId: null,
      }),
    },
  );
}

const body =
  'Laut einer Umfrage des Instituts Demoskop unterstützt ein Teil der Wählenden mit Wurzeln in Nordland die Bürgerpartei. Die Zahlen im Text weichen voneinander ab: 40 und 31 Prozent. Ein Politologe nennt kulturelle Gründe, der Parteipräsident die Kriminalitätspolitik.';

describe('writeRewrite', () => {
  it('labels a simulation in code and reports which facts the framing kept, dropped or added', async () => {
    const result = await fixture();
    const complete = vi.fn(
      async (messages: { role: string; content: string }[], pass: 'write' | 'facts') => {
        if (pass === 'write') {
          expect(messages[0]!.content).toContain('Die Weltwoche');
          expect(messages[1]!.content).toContain('<<<ARTICLE');
          return {
            text: JSON.stringify({ title: 'Die treuen Nordländer', text: body }),
            modelId: 'm',
          };
        }
        return {
          text: JSON.stringify({
            facts: [
              { n: 1, status: 'kept' },
              { n: 2, status: 'changed' },
              { n: 3, status: 'dropped' },
            ],
            added: ['Die Partei gewann 2023 die Wahlen.'],
          }),
          modelId: 'm',
        };
      },
    );
    const output = await writeRewrite(
      {
        result,
        text: result.sourceText,
        form: 'rewrite',
        voice: { kind: 'outlet', outlet: 'weltwoche' },
        length: 'short',
      },
      { complete },
    );
    expect(output.label).toBe(
      'Simulation · nicht von Die Weltwoche geschrieben. Von KI aus den Fakten dieses Artikels verfasst.',
    );
    expect(output.simulated).toBe(true);
    expect(output.factDiff).toMatchObject({
      kept: 1,
      added: ['Die Partei gewann 2023 die Wahlen.'],
    });
    expect(output.factDiff!.total).toBe(originalFacts(result).length);
  });

  it('refuses to rewrite without the article text, but can respond from the reading', async () => {
    const result = await fixture();
    const complete = vi.fn(async () => ({
      text: JSON.stringify({ title: 'Brief', text: body }),
      modelId: 'm',
    }));
    await expect(
      writeRewrite(
        { result, text: null, form: 'rewrite', voice: { kind: 'neutral' }, length: 'short' },
        { complete },
      ),
    ).rejects.toThrow(/needs its text/);
    const letter = await writeRewrite(
      { result, text: null, form: 'response', voice: { kind: 'letter' }, length: 'short' },
      { complete },
    );
    expect(letter.factDiff).toBeNull();
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('keeps the vocabulary rule for BiasLens’s own voices', async () => {
    const result = await fixture();
    const complete = vi.fn(async () => ({
      text: JSON.stringify({ title: 'Antwort', text: body + ' Die Zeitung ist rechtsgerichtet.' }),
      modelId: 'm',
    }));
    const output = await writeRewrite(
      { result, text: null, form: 'response', voice: { kind: 'biaslens' }, length: 'short' },
      { complete },
    );
    expect(output.text).not.toContain('rechtsgerichtet');
  });

  it('states perspective premises in the label', async () => {
    expect(rewriteLabel({ kind: 'perspective', axes: ['welfare_state'] }, 'en')).toBe(
      'Written by AI from these value premises: A strong welfare state should protect people against poverty and life’s risks.',
    );
  });
});

describe('parseRewriteRequest', () => {
  const base = { reportId: 'abcDEF2345', form: 'rewrite', length: 'short' };
  it('accepts allowed voices and refuses mismatches', () => {
    expect(parseRewriteRequest({ ...base, voice: { kind: 'neutral' } }).ok).toBe(true);
    expect(parseRewriteRequest({ ...base, voice: { kind: 'letter' } }).ok).toBe(false);
    expect(parseRewriteRequest({ ...base, voice: { kind: 'perspective', axes: [] } }).ok).toBe(
      false,
    );
    expect(
      parseRewriteRequest({ ...base, voice: { kind: 'perspective', axes: ['a', 'b', 'c'] } }).ok,
    ).toBe(false);
    expect(parseRewriteRequest({ ...base, voice: { kind: 'outlet', outlet: 'unknown' } }).ok).toBe(
      false,
    );
    const person = parseRewriteRequest({
      ...base,
      form: 'response',
      voice: { kind: 'person', name: '  Erika   Beispiel ', qid: 'Q100' },
    });
    expect(person.ok && person.data.voice).toEqual({
      kind: 'person',
      name: 'Erika Beispiel',
      qid: 'Q100',
    });
  });
});
