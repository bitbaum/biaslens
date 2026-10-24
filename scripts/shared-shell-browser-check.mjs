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
    await page.getByRole('heading', { name: 'Read between the lines.' }).waitFor();
    await page.getByRole('link', { name: 'Sign in', exact: true }).waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      'viewport overflow at ' + width,
    );
    if (width <= 1100) {
      const menu = page.locator('[data-sitekit-menu]');
      const summary = menu.locator('summary');
      await summary.click();
      assert.equal(await menu.evaluate((el) => el.open), true);
      const links = menu.getByRole('link');
      assert.equal(await links.count(), 5);
      for (const link of await links.all()) assert.ok((await link.boundingBox()).height >= 44);
      await links.first().focus();
      await page.keyboard.press('Escape');
      assert.equal(await menu.evaluate((el) => el.open), false);
      assert.equal(await summary.evaluate((el) => el === document.activeElement), true);
      await summary.click();
      await page.mouse.click(4, 500);
      assert.equal(await menu.evaluate((el) => el.open), false);
      await summary.click();
      await menu.getByRole('link', { name: 'Explore', exact: true }).click();
      await page.waitForURL('**/explore');
      assert.equal(await menu.evaluate((el) => el.open), false);
      await summary.click();
      assert.equal(
        await menu.getByRole('link', { name: 'Explore', exact: true }).getAttribute('aria-current'),
        'page',
      );
    } else assert.equal(await page.locator('.sk-desktop-nav').isVisible(), true);
  }
  for (const path of ['/roadmap', '/changelog', '/blog', '/sign-in', '/not-a-real-page']) {
    await page.goto(base + path);
    assert.equal(await page.locator('.sk-masthead').count(), 1);
    assert.equal(await page.locator('.sk-footer').count(), 1);
    assert.equal(await page.locator('#main-content').count(), 1);
  }
  await page.goto(base + '/');
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.evaluate(() => document.fonts.check('16px Inter')), true);
  assert.equal(await page.evaluate(() => document.fonts.check('48px "Instrument Serif"')), true);
  assert.deepEqual(errors, []);
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
