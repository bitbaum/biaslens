/**
 * Runs the real two-pass pipeline on the articles in eval/articles.json and
 * writes one JSON per article plus a summary table to eval/out/<prompt>/.
 * Needs a model key (GROQ_API_KEY or OPENROUTER_API_KEY); without one every
 * article is skipped and the run says so. Not part of `pnpm run verify`.
 *
 *   pnpm run eval:reports
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { complete, freeChain, usableChain } from '@bitbaum/ai-kit';
import { describe, expect, it } from 'vitest';

import { EXAMPLE_ARTICLE } from '@/lib/analysis/example';
import { REPORT_PROMPT_VERSION } from '@/lib/analysis/prompts';
import { analyzeArticle, type ArticleAnalysisResult } from '@/lib/analysis/run';
import { readSource } from '@/lib/analysis/source';
import { FIXTURE_ARTICLE } from '@/lib/analysis/test-fixture';
import { isOutputLanguage } from '@/lib/config/languages';
import { forbiddenLabelsIn } from '@/lib/config/vocabulary';

type Entry = {
  id: string;
  url?: string;
  fixture?: string;
  language: string;
  expect: {
    voices: string[];
    notVoices: string[];
    techniques: string[];
    attributedTo: Record<string, string>;
  };
};

const FIXTURES: Record<string, string> = {
  'src/lib/analysis/test-fixture.ts#FIXTURE_ARTICLE': FIXTURE_ARTICLE,
  'src/lib/analysis/example.ts#EXAMPLE_ARTICLE': EXAMPLE_ARTICLE,
};

const { articles } = JSON.parse(
  readFileSync(join(process.cwd(), 'eval/articles.json'), 'utf8'),
) as { articles: Entry[] };
const chain = usableChain(freeChain('BIASLENS'), process.env);
const out = join(process.cwd(), 'eval/out', REPORT_PROMPT_VERSION);
const rows: string[] = [];

function score(entry: Entry, result: ArticleAnalysisResult, seconds: number) {
  const { report } = result;
  const names = report.voices.map((voice) => voice.name.toLowerCase());
  const found = entry.expect.voices.filter((voice) =>
    names.some((name) => name.includes(voice.toLowerCase())),
  );
  const wrongVoices = entry.expect.notVoices.filter((voice) =>
    names.some((name) => name.includes(voice.toLowerCase())),
  );
  const techniques = new Set(report.detections.map((detection) => detection.technique));
  const foundTechniques = entry.expect.techniques.filter((technique) =>
    techniques.has(technique as never),
  );
  const attribution = Object.entries(entry.expect.attributedTo).filter(([passage, who]) =>
    report.claims.some(
      (claim) =>
        claim.quote?.text.includes(passage) &&
        report.voices.find((voice) => voice.id === claim.speaker)?.name.includes(who),
    ),
  );
  const labels = forbiddenLabelsIn(JSON.stringify({ ...report, voices: [], claims: [] }));
  return {
    id: entry.id,
    grounded: `${report.quality.groundedQuotes}/${report.quality.proposedQuotes}`,
    voices: `${found.length}/${entry.expect.voices.length}`,
    authorAsVoice: wrongVoices.length,
    techniques: `${foundTechniques.length}/${entry.expect.techniques.length}`,
    attribution: `${attribution.length}/${Object.keys(entry.expect.attributedTo).length}`,
    detections: report.detections.length,
    forbiddenLabels: labels.length,
    seconds: Math.round(seconds),
    models: result.run.passes.map((pass) => pass.modelId).join(' + '),
  };
}

describe.skipIf(chain.length === 0)('report evaluation (' + REPORT_PROMPT_VERSION + ')', () => {
  mkdirSync(out, { recursive: true });
  for (const entry of articles) {
    it(entry.id, { timeout: 240_000 }, async () => {
      const started = Date.now();
      const text = entry.fixture ? FIXTURES[entry.fixture] : undefined;
      const language = isOutputLanguage(entry.language) ? entry.language : 'en';
      const result = await analyzeArticle(
        text
          ? { mode: 'text', url: null, text, outputLanguage: language }
          : { mode: 'url', url: entry.url!, text: null, outputLanguage: language },
        {
          readSource: (url, maxChars) => readSource(url, maxChars),
          complete: async (messages, pass) => {
            const response = await complete({
              chain,
              messages,
              timeoutMs: 60_000,
              maxTokens: pass === 'reading' ? 3_600 : 3_200,
              temperature: 0.2,
              reasoning: 'light',
              extraBody: { response_format: { type: 'json_object' } },
            });
            return { text: response.text, modelId: response.id };
          },
        },
      );
      const row = score(entry, result, (Date.now() - started) / 1000);
      writeFileSync(join(out, entry.id + '.json'), JSON.stringify({ score: row, result }, null, 2));
      rows.push(Object.values(row).join(' | '));
      writeFileSync(
        join(out, 'summary.md'),
        '| ' +
          Object.keys(row).join(' | ') +
          ' |\n|' +
          Object.keys(row)
            .map(() => ' --- |')
            .join('') +
          '\n' +
          rows.map((line) => '| ' + line + ' |').join('\n') +
          '\n',
      );
      expect(row.forbiddenLabels).toBe(0);
      expect(row.authorAsVoice).toBe(0);
    });
  }
});

it.runIf(chain.length === 0)('needs a model key', () => {
  console.warn('No GROQ_API_KEY or OPENROUTER_API_KEY: the evaluation was skipped.');
});
