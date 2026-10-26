import { describe, expect, it } from 'vitest';

import { analyzeArticle } from '@/lib/analysis/run';
import { FIXTURE_ARTICLE, FIXTURE_ASSESSMENT, FIXTURE_READING } from '@/lib/analysis/test-fixture';
import { forbiddenLabelsIn } from '@/lib/config/vocabulary';

import { guessFor, rankFindings } from './findings';
import { replyText } from './render';

async function fixtureReport() {
  const { report } = await analyzeArticle(
    { mode: 'text', url: null, text: FIXTURE_ARTICLE, outputLanguage: 'de-CH' },
    {
      readSource: async () => ({ ok: false, url: '', reason: '' }),
      complete: async (_messages, pass) => ({
        text: JSON.stringify(pass === 'reading' ? FIXTURE_READING : FIXTURE_ASSESSMENT),
        modelId: null,
      }),
    },
  );
  return report;
}

describe('rankFindings', () => {
  it('leads with the quoted expert’s explanation, then the figures that disagree', async () => {
    const findings = rankFindings(await fixtureReport(), 'de-CH');
    expect(findings[0]?.kind).toBe('attribution');
    expect(findings[0]?.text).toContain('Peter Beispiel (Politologe, Forschungsbüro Kompass)');
    expect(findings[1]?.text).toMatch(/^Zahlen, die nicht zusammenpassen:/);
    expect(
      findings.slice(0, 3).every((finding) => forbiddenLabelsIn(finding.text).length === 0),
    ).toBe(true);
  });

  it('never repeats the same passage', async () => {
    const findings = rankFindings(await fixtureReport(), 'en');
    const passages = findings
      .filter((f) => f.passage)
      .map((f) => `${f.passage!.start}-${f.passage!.end}`);
    expect(new Set(passages).size).toBe(passages.length);
  });
});

describe('guessFor', () => {
  it('asks who said the attributed claim, with the author among the options', async () => {
    const report = await fixtureReport();
    const guess = guessFor(report, rankFindings(report, 'en'), 'en');
    expect(guess?.answerLabel).toBe('Peter Beispiel');
    expect(guess?.options.map((option) => option.label)).toContain('Anna Muster');
    expect(guess?.options.some((option) => option.id === guess.answerId)).toBe(true);
  });
});

describe('replyText', () => {
  it('fits one line in a chat message and ends with the link', async () => {
    const report = await fixtureReport();
    const text = replyText({
      report,
      findings: rankFindings(report, 'de-CH'),
      language: 'de-CH',
      length: 'line',
      blocks: ['findings'],
      note: null,
      url: 'https://biaslens.example/a/abc123defg',
    });
    const [line, url] = text.split('\n');
    expect(line!.length).toBeLessThanOrEqual(240);
    expect(url).toBe('https://biaslens.example/a/abc123defg');
  });

  it('writes a brief with three findings, a question and the link', async () => {
    const report = await fixtureReport();
    const text = replyText({
      report,
      findings: rankFindings(report, 'de-CH'),
      language: 'de-CH',
      length: 'brief',
      blocks: ['findings', 'questions'],
      note: 'Schau dir die Zahlen an.',
      url: 'https://biaslens.example/a/x',
    });
    expect(text.split('\n')[0]).toBe('Schau dir die Zahlen an.');
    expect(text.match(/^• /gm)).toHaveLength(3);
    expect(text).toContain('Eine Frage an die Autorin oder den Autor: Wie viele Personen');
    expect(text).not.toContain('ß');
  });
});
