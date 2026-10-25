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
const report = {
  analysis: {
    title: 'A decline in traffic is not yet a causal explanation',
    author: null,
    publication: 'Fictional browser test',
    publication_date: null,
    language: 'English',
    summary:
      'The source reports lower traffic while noting concurrent roadworks and no comparison streets.',
    insight: {
      headline: 'What changed besides the cycle lane?',
      explanation: 'Roadworks offer an alternative explanation for the observed decline.',
      assumption: 'Other causes of traffic changes were stable.',
      test: 'Compare similar streets and review the roadworks timeline.',
    },
    core_claims: [
      {
        claim: 'Traffic fell by 30 percent.',
        source_quote: quote,
        type: 'factual',
        supported_in_article: true,
        evidence_quality: 'asserted',
      },
    ],
    first_principles_critique:
      'The comparison does not isolate the lane from concurrent roadworks.',
    named_sources: [],
    biases_to_consider: 'The council favours its policy; the source also includes a qualification.',
    what_would_change_assessment: 'Comparison-street counts and a longer time series.',
  },
  sourceText: source,
  origin: {
    kind: 'user-pasted-text',
    url: null,
    title: null,
    attribution: 'not-provided',
    modelChars: source.length,
    truncated: false,
    textSha256: createHash('sha256').update(source).digest('hex'),
  },
  modelId: 'browser-fixture',
  run: {
    generatedAt: '2026-10-24T12:00:00Z',
    methodVersion: 'browser-test',
    promptVersion: 'browser-test',
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
      .getByRole('heading', { name: report.analysis.insight.headline, exact: true })
      .waitFor();
    await page.getByText('Inspect the article passage', { exact: true }).click();
    await page.getByRole('blockquote').filter({ hasText: quote }).waitFor();
    await page.getByRole('link', { name: 'Claims', exact: true }).click();
    assert.match(page.url(), /#report-claims$/);
    await page.getByRole('button', { name: 'What is the article’s main argument?' }).click();
    await page
      .getByText('The source reports lower traffic but notes concurrent roadworks.', {
        exact: true,
      })
      .waitFor();
    await page
      .getByText(`Exact passage from “${report.analysis.title}”`, { exact: true })
      .waitFor();
    await page
      .getByRole('textbox', { name: 'Ask a question about this article' })
      .fill('What evidence is missing?');
    await page.getByRole('button', { name: 'Ask', exact: true }).click();
    await page.locator('.ck-turn-user').filter({ hasText: 'What evidence is missing?' }).waitFor();
    assert.equal(chatRequests, 2);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download JSON report', exact: true }).click();
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
