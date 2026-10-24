import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.BROWSER_SMOKE_URL ?? 'http://127.0.0.1:3000';
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_EXECUTABLE ?? '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const width of [390, 834, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + '/analyze', { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Examine text.' }).waitFor();
    await page.getByRole('link', { name: 'Sign in', exact: true }).waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      'viewport overflow at ' + width,
    );
    const titleStyle = await page.locator('h1').evaluate((el) => ({
      font: getComputedStyle(el).fontFamily,
      size: parseFloat(getComputedStyle(el).fontSize),
      weight: parseInt(getComputedStyle(el).fontWeight),
    }));
    assert.match(titleStyle.font, /Inter/);
    assert.ok(
      titleStyle.size >= 30 && titleStyle.size <= 44,
      'application title scale at ' + width,
    );
    assert.ok(titleStyle.weight >= 600, 'application title weight');
    const headerHeight = (await page.locator('.sk-masthead').boundingBox()).height;
    assert.ok(headerHeight >= 64 && headerHeight <= 70, 'compact shared header at ' + width);
    assert.equal(await page.locator('.sk-footer-group').count(), 2);
    if (width <= 1100) {
      const menu = page.locator('[data-sitekit-menu]');
      const summary = menu.locator('summary');
      await summary.click();
      assert.equal(await menu.evaluate((el) => el.open), true);
      const links = menu.getByRole('link');
      assert.equal(await links.count(), 4);
      for (const link of await links.all()) assert.ok((await link.boundingBox()).height >= 44);
      await links.first().focus();
      await page.keyboard.press('Escape');
      assert.equal(await menu.evaluate((el) => el.open), false);
      assert.equal(await summary.evaluate((el) => el === document.activeElement), true);
      await summary.click();
      await page.mouse.click(4, 500);
      assert.equal(await menu.evaluate((el) => el.open), false);
      await summary.click();
      await menu.getByRole('link', { name: 'Notebook', exact: true }).click();
      await page.waitForURL('**/explore');
      assert.equal(await menu.evaluate((el) => el.open), false);
      await summary.click();
      assert.equal(
        await menu
          .getByRole('link', { name: 'Notebook', exact: true })
          .getAttribute('aria-current'),
        'page',
      );
    } else assert.equal(await page.locator('.sk-desktop-nav').isVisible(), true);
  }
  for (const path of [
    '/workspace',
    '/roadmap',
    '/changelog',
    '/blog',
    '/sign-in',
    '/not-a-real-page',
  ]) {
    await page.goto(base + path);
    assert.equal(await page.locator('.sk-masthead').count(), 1);
    assert.equal(await page.locator('.sk-footer').count(), 1);
    assert.equal(await page.locator('#main-content').count(), 1);
  }
  await page.goto(base + '/');
  await page.getByRole('button', { name: 'Finance', exact: true }).click();
  await page
    .getByText('Is a record profit the same as a stronger business?', { exact: true })
    .waitFor();
  assert.equal(
    await page.getByRole('button', { name: 'Finance', exact: true }).getAttribute('aria-pressed'),
    'true',
  );
  await page.evaluate(() =>
    localStorage.setItem(
      'biaslens:inquiry:v1',
      JSON.stringify({
        version: 1,
        question: 'What explains this financial result?',
        scope: '',
        notes: '',
        challenge: '',
        sources: [],
      }),
    ),
  );
  await page.goto(base + '/workspace', { waitUntil: 'networkidle' });
  await page
    .getByRole('heading', { name: 'What explains this financial result?', exact: true })
    .waitFor();
  await page.getByRole('link', { name: 'Continue investigating →', exact: true }).click();
  await page.waitForURL('**/explore');
  await page.waitForFunction(
    () =>
      document.querySelector('[aria-label="Question"]')?.value ===
      'What explains this financial result?',
  );
  await page.goto(base + '/sign-in', { waitUntil: 'networkidle' });
  assert.equal(
    await page.locator('.sk-masthead').getByRole('link', { name: 'Sign in', exact: true }).count(),
    0,
    'auth screens do not repeat the sign-in navigation action',
  );
  await page.getByLabel('Email', { exact: true }).waitFor();
  await page.getByLabel('Password', { exact: true }).waitFor();
  assert.equal((await page.locator('.account-card .acct-auth-button').count()) > 0, true);
  const authColors = await page
    .locator('.account-card .acct-auth-button')
    .first()
    .evaluate((el) => ({
      action: getComputedStyle(el).backgroundColor,
      ink: getComputedStyle(document.body).color,
    }));
  assert.equal(
    authColors.action,
    authColors.ink,
    'auth action uses the product ink role, not a package default accent',
  );
  await page
    .getByText('Your current notebook is saved in this browser', { exact: false })
    .waitFor();
  await page.goto(base + '/');
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.evaluate(() => document.fonts.check('16px Inter')), true);
  assert.match(await page.locator('h1').evaluate((el) => getComputedStyle(el).fontFamily), /Inter/);
  assert.deepEqual(errors, []);
  const signedIn = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await signedIn.route('**/api/auth/get-session**', (route) =>
    route.fulfill({
      json: {
        user: {
          id: 'browser-fixture',
          name: 'Test Researcher',
          email: 'researcher@example.test',
          emailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        session: {
          id: 'browser-session',
          token: 'test-only',
          userId: 'browser-fixture',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    }),
  );
  const accountPage = await signedIn.newPage();
  await accountPage.goto(base + '/workspace', { waitUntil: 'networkidle' });
  const accountTrigger = accountPage.getByRole('button', {
    name: 'Account: Test Researcher',
    exact: true,
  });
  await accountTrigger.click();
  assert.equal(
    await accountPage
      .getByRole('menuitem', { name: 'Profile & security', exact: true })
      .getAttribute('href'),
    '/account',
  );
  assert.equal(
    await accountPage
      .getByRole('menuitem', { name: 'Your notebook', exact: true })
      .getAttribute('href'),
    '/explore',
  );
  await accountPage.keyboard.press('Escape');
  assert.equal(await accountTrigger.getAttribute('aria-expanded'), 'false');
  await signedIn.close();
  const noJs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const plain = await noJs.newPage();
  await plain.goto(base + '/analyze');
  await plain.locator('[data-sitekit-menu] summary').click();
  assert.equal(await plain.locator('[data-sitekit-menu] a').first().isVisible(), true);
  await noJs.close();
  console.log(
    'Shared shell: responsive navigation, Escape/outside/route dismissal, active state, account entry, one root shell, native no-JS menu and shared fonts passed.',
  );
} finally {
  await browser.close();
}
