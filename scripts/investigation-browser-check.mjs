import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
const base = process.env.BROWSER_SMOKE_URL ?? 'http://127.0.0.1:3000';
const output = process.env.BROWSER_SMOKE_DIR;
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_EXECUTABLE ?? '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const source =
  'Fictional browser test: Traffic on West Street fell by 30 percent after a cycle lane opened. The council described the change as proof that the lane reduced car use. A neighbouring junction was also closed for roadworks. Counts for comparison streets were not supplied. These conditions mean that the before-and-after comparison does not isolate the effect of the lane.';
const quote = 'Traffic on West Street fell by 30 percent after a cycle lane opened.';
const at = (text) => {
  const start = source.indexOf(text);
  if (start < 0) throw new Error('Fixture quote not in source: ' + text);
  return { text, start, end: start + text.length };
};
const report = {
  report: {
    schema: 'biaslens-report@4',
    title: 'A decline in traffic is not yet a causal explanation',
    byline: { authors: [], publication: 'Fictional browser test', date: null, source: 'model' },
    genre: 'news_report',
    genreReason: 'Reports council figures.',
    summary:
      'The source reports lower traffic while noting concurrent roadworks and no comparison streets.',
    centralClaim: { text: 'The lane reduced car use.', speaker: 'v1', quote: null },
    voices: [
      {
        id: 'v1',
        name: 'The council',
        kind: 'organisation',
        affiliation: 'Local authority',
        stance: 'supports',
        quotes: [at('described the change as proof that the lane reduced car use')],
      },
    ],
    claims: [
      {
        id: 'c1',
        text: 'Traffic fell by 30 percent.',
        type: 'factual',
        speaker: 'author',
        support: 'data',
        quote: at(quote),
      },
    ],
    figures: [
      {
        id: 'n1',
        value: '30 percent',
        kind: 'statistic',
        about: 'Traffic on West Street',
        source: null,
        sampleSizeStated: false,
        marginStated: false,
        comparisonGiven: false,
        quote: at('fell by 30 percent'),
      },
    ],
    detections: [
      {
        id: 'd1',
        technique: 'causal_leap',
        explanation: 'A before-and-after change is presented as the effect of the lane.',
        alternative: 'Traffic fell after the lane opened; roadworks may also have contributed.',
        quote: at('described the change as proof that the lane reduced car use'),
      },
    ],
    insight: {
      headline: 'What changed besides the cycle lane?',
      explanation: 'Roadworks offer an alternative explanation for the observed decline.',
      assumption: 'Other causes of traffic changes were stable.',
      test: 'Compare similar streets and review the roadworks timeline.',
    },
    strongestCase: 'Traffic fell sharply right after the lane opened.',
    strongestObjection: 'A closed junction nearby could explain the same drop.',
    missingVoices: [{ who: 'Residents of side streets', why: 'Diverted traffic may land there.' }],
    questions: ['Were neighbouring streets counted?'],
    whatWouldChange: ['Counts from comparable streets without a lane.'],
    metrics: {
      voices: 1,
      stanceCounts: { supports: 1, opposes: 0, mixed: 0, neutral: 0, unclear: 0 },
      quotedWordsByStance: { supports: 10, opposes: 0, mixed: 0, neutral: 0, unclear: 0 },
      quotedShare: 0,
      anonymousVoices: 0,
      figures: 1,
      figuresWithoutSource: 1,
      pollsWithoutSample: 0,
      detectionCounts: { causal_leap: 1 },
      oneSided: null,
      missingResponse: false,
    },
    quality: { proposedQuotes: 4, groundedQuotes: 4, droppedItems: 0, modelRepairs: 0 },
  },
  sourceText: source,
  language: 'en',
  origin: {
    kind: 'user-pasted-text',
    url: null,
    title: null,
    attribution: 'not-provided',
    modelChars: source.length,
    truncated: false,
    textSha256: createHash('sha256').update(source).digest('hex'),
  },
  run: {
    generatedAt: '2026-10-24T12:00:00Z',
    methodVersion: 'browser-test',
    promptVersion: 'browser-test',
    passes: [
      { pass: 'reading', modelId: 'browser-fixture', repairAttempts: 0 },
      { pass: 'assessment', modelId: 'browser-fixture', repairAttempts: 0 },
    ],
  },
  durationMs: 500,
  independentlyVerified: false,
};
try {
  for (const width of [390, 834, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    let requests = 0;
    let chatRequests = 0;
    let releaseResponse;
    const responseReady = new Promise((resolve) => {
      releaseResponse = resolve;
    });
    await page.route('**/api/analyze', async (route) => {
      requests++;
      if (requests === 1)
        return route.fulfill({
          status: 422,
          json: {
            ok: false,
            error: {
              code: 'SOURCE_UNAVAILABLE',
              message: 'The source could not be retrieved. Paste the text to continue.',
            },
          },
        });
      await responseReady;
      return route.fulfill({ json: { ok: true, result: report } });
    });
    await page.route('**/api/article-chat', async (route) => {
      chatRequests++;
      const request = route.request().postDataJSON();
      assert.equal(request.text, source);
      assert.equal(request.sourceDigest, report.origin.textSha256);
      assert.equal(request.outputLanguage, 'en');
      return route.fulfill({
        json: {
          ok: true,
          answer: 'The source reports lower traffic but notes concurrent roadworks.',
          sourceQuote: quote,
          sourceDigest: report.origin.textSha256,
        },
      });
    });
    await page.goto(base + '/analyze', { waitUntil: 'networkidle' });
    await page.getByLabel('Source URL', { exact: true }).fill('https://example.test/article');
    await page.getByRole('button', { name: 'Examine text', exact: true }).click();
    await page.locator('main [role=alert]').waitFor();
    await page.getByRole('button', { name: 'Paste article text instead →', exact: true }).click();
    await page.getByLabel('Text to examine', { exact: true }).fill(source);
    await page.getByRole('button', { name: 'Examine text', exact: true }).click();
    await page.getByRole('button', { name: 'Examining…', exact: true }).waitFor();
    assert.equal(await page.getByLabel('Text to examine', { exact: true }).isDisabled(), true);
    releaseResponse();
    await page
      .getByRole('heading', { name: report.report.insight.headline, exact: true })
      .waitFor();
    await page.locator('mark[data-annotations~="a-d1"]').first().click();
    await page
      .getByRole('complementary', { name: 'Why it is marked' })
      .getByText('Causal leap')
      .waitFor();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.getByRole('button', { name: 'Numbers 1' }).click();
    await page.getByText('No source named').first().waitFor();
    await page.getByRole('link', { name: 'Claims', exact: true }).click();
    assert.match(page.url(), /#report-claims$/);
    await page.getByRole('button', { name: 'What is the article’s main argument?' }).click();
    await page
      .getByText('The source reports lower traffic but notes concurrent roadworks.', {
        exact: true,
      })
      .waitFor();
    await page.getByText(`Exact passage from “${report.report.title}”`, { exact: true }).waitFor();
    await page
      .getByRole('textbox', { name: 'Ask a question about this article' })
      .fill('What evidence is missing?');
    await page.getByRole('button', { name: 'Ask', exact: true }).click();
    await page.locator('.ck-turn-user').filter({ hasText: 'What evidence is missing?' }).waitFor();
    assert.equal(chatRequests, 2);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download the report (JSON)', exact: true }).click();
    const download = await downloadPromise;
    const exported = JSON.parse(readFileSync(await download.path(), 'utf8'));
    assert.equal(exported.sourceText, source);
    assert.equal(exported.origin.textSha256, report.origin.textSha256);
    assert.equal(exported.independentlyVerified, false);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    if (output) {
      mkdirSync(output, { recursive: true });
      await page.evaluate(() => {
        document.activeElement?.blur();
        window.scrollTo(0, 0);
      });
      await page.screenshot({ path: `${output}/analysis-result-${width}.png`, fullPage: true });
    }
    await page.goto(base + '/debates', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Try an example', exact: true }).click();
    await page.getByRole('button', { name: 'Analyse transcript', exact: true }).click();
    await page.getByRole('region', { name: 'Transcript airtime results' }).waitFor();
    assert.ok(
      (await page.getByRole('region', { name: 'Transcript airtime results' }).innerText()).includes(
        'not proven interruptions',
      ),
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    if (output)
      await page.evaluate(() => {
        document.activeElement?.blur();
        window.scrollTo(0, 0);
      });
    if (output)
      await page.screenshot({ path: `${output}/conversation-result-${width}.png`, fullPage: true });
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(
    'User flows passed: source recovery, analysis loading, exact article passages, report export, article chat starters/follow-ups, and transcript results at phone/desktop widths. Model responses are labelled test fixtures; no model calls were made.',
  );
} finally {
  await browser.close();
}
