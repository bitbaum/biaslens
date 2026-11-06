import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const [url, widthArg, heightArg, output] = process.argv.slice(2);
const width = Number(widthArg);
const height = Number(heightArg);
assert.ok(
  url && output && Number.isInteger(width) && width > 0 && Number.isInteger(height) && height > 0,
);
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_EXECUTABLE,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: output });
} finally {
  await browser.close();
}
