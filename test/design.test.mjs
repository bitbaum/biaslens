import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const chrome = read('src/app/_components/Chrome.tsx');
const shell = read('src/app/_components/Chrome.module.css');
const globals = read('src/app/globals.css');
const home = read('src/app/page.tsx');
const homeCss = read('src/app/home.module.css');
const method = read('src/app/methodology/page.tsx');
const analyze = read('src/app/analyze/AnalyzeWorkspace.tsx');
const analyzeCss = read('src/app/analyze/analyze.module.css');
const demoCss = read('src/app/EvidenceVerifier.module.css');

function color(name) {
  const match = globals.match(new RegExp('^\\s*' + name + ':\\s*(#[0-9a-fA-F]{6});', 'm'));
  assert.ok(match, 'missing palette primitive ' + name);
  const hex = match[1];
  return [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((x) => {
    const channel = x / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(first, second) {
  const x = luminance(first);
  const y = luminance(second);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

test('core text/action palette passes WCAG AA normal-text contrast', () => {
  const pairs = [
    ['--primitive-teal-600', '--primitive-white'],
    ['--primitive-ink-900', '--primitive-paper'],
    ['--primitive-stone-500', '--primitive-paper'],
    ['--primitive-stone-500', '--primitive-white'],
  ];
  for (const [foreground, background] of pairs) {
    const ratio = contrast(color(foreground), color(background));
    assert.ok(ratio >= 4.5, foreground + ' on ' + background + ' is ' + ratio.toFixed(2) + ':1');
  }
});

test('every public route uses the same navigational frame and one skip target', () => {
  for (const [name, content] of [
    ['home', home],
    ['method', method],
    ['analysis', analyze],
  ]) {
    assert.match(content, /<SiteHeader current=/, name + ' must use SiteHeader');
    assert.match(content, /<SiteFooter\s*\/>/, name + ' must use SiteFooter');
    assert.match(content, /id="main-content"/, name + ' must expose skip destination');
    assert.doesNotMatch(content, /<nav className=\{styles\.nav\}/, name + ' duplicates the header');
  }
  assert.match(chrome, /href="#main-content"/);
  assert.match(chrome, /aria-current=/);
  assert.match(chrome, /aria-label="Main navigation"/);
  assert.match(shell, /\.skip:focus/);
});

test('same-kind nav and choices keep their anatomy and mobile widths', () => {
  assert.match(shell, /min-height:\s*44px/);
  assert.match(shell, /@media \(max-width: 380px\)/);
  assert.match(analyzeCss, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(analyzeCss, /min-height:\s*52px/);
  assert.match(homeCss, /@media \(max-width: 420px\)/);
  assert.match(homeCss, /grid-template-columns:\s*1fr/);
  assert.match(homeCss, /min-height:\s*50px/);
});

test('demo controls are touch-safe and article primary CTA stays above the demonstration', () => {
  assert.match(demoCss, /width:\s*44px;\s*height:\s*44px/);
  assert.match(demoCss, /\.verifyBtn\s*\{\s*min-height:\s*44px/);
  assert.ok(home.indexOf('href="/analyze"') < home.indexOf('<EvidenceVerifier />'));
  assert.match(home, /<details className=\{styles\.labDetails\}>/);
  assert.match(analyzeCss, /\.submit\s*\{\s*min-height:\s*48px/);
  assert.match(analyzeCss, /\.exportBtn\s*\{\s*min-height:\s*44px/);
});

test('focus and reduced motion are explicit, not browser-dependent promises', () => {
  assert.match(globals, /a:focus-visible/);
  assert.match(globals, /button:focus-visible/);
  assert.match(globals, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(homeCss, /@media \(prefers-reduced-motion: reduce\)/);
});
