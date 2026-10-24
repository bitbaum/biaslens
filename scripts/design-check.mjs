import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const chrome = read('src/app/_components/Chrome.tsx') + read('src/app/_components/Footer.tsx');
const layout = read('src/app/layout.tsx');
const packageJson = JSON.parse(read('package.json'));
const shell = read('src/app/_components/Chrome.module.css');
const globals = read('src/app/globals.css') + read('src/app/theme.css');
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
    ['--primitive-accent-600', '--primitive-white'],
    ['--primitive-ink-900', '--primitive-paper'],
    ['--primitive-slate-600', '--primitive-paper'],
    ['--primitive-slate-600', '--primitive-white'],
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
    assert.doesNotMatch(content, /<SiteHeader|<SiteFooter/, name + ' inherits the root shell');
    assert.match(content, /id="main-content"/, name + ' must expose skip destination');
    assert.doesNotMatch(content, /<nav className=\{styles\.nav\}/, name + ' duplicates the header');
  }
  assert.match(layout, /<SiteHeader/);
  assert.match(layout, /<SiteFooter/);
  assert.match(chrome, /SiteMasthead/);
  assert.match(chrome, /mainId="main-content"/);
  assert.doesNotMatch(chrome, /<header|<nav|<footer/);
});

test('composition comes from one pinned source and frames are not duplicated', () => {
  const ref = packageJson.dependencies['@bitbaum/design-tokens'];
  assert.match(ref, /github:bitbaum\/design-tokens#v[0-9.]+|\^[0-9.]+/);
  assert.match(layout, /@bitbaum\/design-tokens\/tokens\.css/);
  assert.match(layout, /@bitbaum\/sitekit\/styles\.css/);
  assert.match(layout, /@bitbaum\/design-tokens\/composition\.css/);
  assert.ok(
    layout.indexOf("'./globals.css'") < layout.indexOf('composition.css'),
    'low-specificity controls must load after the app reset',
  );
  for (const role of ['--bb-action-bg', '--bb-action-fg', '--bb-line', '--bb-focus']) {
    assert.ok(globals.includes(role + ':'), 'missing semantic mapping ' + role);
  }
  assert.match(chrome, /@bitbaum\/sitekit\/react/);
  assert.match(method, /bb-frame/);
  assert.match(analyze, /bb-frame/);
  assert.doesNotMatch(shell, /\.frame,\s*\.footerFrame\s*\{/);
});

test('choices and buttons share anatomy, while editorial character stays local', () => {
  assert.ok(packageJson.dependencies['@bitbaum/sitekit']);
  assert.doesNotMatch(shell, /\.nav|\.header|\.footer/);
  assert.match(analyze, /bb-choice-row/);
  assert.match(analyze, /bb-control/);
  assert.match(analyzeCss, /min-height:\s*52px/);
  assert.match(home, /<HeroSection/);
  assert.match(home, /Examine an article/);
  assert.match(homeCss, /@media \(max-width: 420px\)/);
  assert.match(homeCss, /grid-template-columns:\s*1fr/);
  assert.match(globals, /--font-editorial/);
});

test('demo controls are touch-safe and article primary CTA stays above the demonstration', () => {
  assert.match(demoCss, /width:\s*44px;\s*height:\s*44px/);
  assert.match(demoCss, /\.verifyBtn\s*\{\s*min-height:\s*44px/);
  assert.ok(home.indexOf('<HeroSection') < home.indexOf('<EvidenceVerifier />'));
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

function stylesUnder(directory) {
  return readdirSync(new URL('../' + directory, import.meta.url), { withFileTypes: true }).flatMap(
    (entry) => {
      const path = directory + '/' + entry.name;
      return entry.isDirectory() ? stylesUnder(path) : path.endsWith('.module.css') ? [path] : [];
    },
  );
}
test('component styles consume palette roles rather than introducing colours', () => {
  for (const path of stylesUnder('src/app')) {
    assert.doesNotMatch(
      read(path),
      /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl)a?\(/,
      path + ' introduces a colour outside the theme',
    );
    assert.doesNotMatch(
      read(path),
      /(?:linear|radial)-gradient\(/,
      path + ' introduces a decorative gradient',
    );
  }
});
test('application typography is governed by shared roles', () => {
  assert.match(globals, /--font-display:\s*var\(--font-sans\)/);
  assert.match(globals, /--type-page-title:/);
  assert.match(read('src/app/workspace/workspace.module.css'), /font:\s*var\(--type-card-title\)/);
  assert.match(read('src/app/account/account.css'), /font:\s*var\(--type-page-title\)/);
  assert.match(read('src/app/_components/Footer.tsx'), /groups=/);
});

test('product roles load after package defaults so account colours cannot drift', () => {
  assert.ok(layout.indexOf("'./theme.css'") > layout.indexOf("'@bitbaum/accountkit/styles.css'"));
  assert.ok(layout.indexOf("'./theme.css'") > layout.indexOf("'bip-kit/styles.css'"));
  assert.match(read('src/app/theme.css'), /--acct-action:\s*var\(--color-text\)/);
});
