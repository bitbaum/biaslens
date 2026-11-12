/* global window, document */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const root = process.cwd();
const require = createRequire(import.meta.url);
const output = path.resolve(
  process.env.BROWSER_SMOKE_DIR ?? 'browser-smoke-artifacts',
  'writingkit',
);
fs.mkdirSync(output, { recursive: true });
const bundle = await build({
  absWorkingDir: root,
  bundle: true,
  write: false,
  outfile: 'writingkit-fixture.js',
  format: 'iife',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' },
  loader: { '.woff2': 'dataurl', '.woff': 'dataurl' },
  stdin: {
    loader: 'jsx',
    resolveDir: root,
    contents: `
import React from 'react';import{createRoot}from'react-dom/client';
import{Composer}from'./src/app/write/Composer';
import{RewriteStudio}from'./src/app/_components/rewrite/RewriteStudio';
import '@bitbaum/design-tokens/tokens.css';
import './src/app/globals.css';
import '@bitbaum/design-tokens/composition.css';
import '@bitbaum/sitekit/styles.css';import '@bitbaum/bip-kit/styles.css';
import '@bitbaum/accountkit/styles.css';import '@bitbaum/chatkit/styles.css';
import './src/app/theme.css';import './src/app/blog/journal.css';
const root=createRoot(document.getElementById('app'));
window.calls=[];window.paths=[];window.published=[];window.holdPublish=false;
Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copiedText=text}},configurable:true});
window.fetch=(url,init={})=>{
 const input=init.body?JSON.parse(init.body):{};
 if(url==='/api/writing' || (url.startsWith('/api/writing/') && url!='/api/writing/assist')) {
   window.published.push(input);
   if(!window.holdPublish)return Promise.resolve(new Response(JSON.stringify({ok:true,id:'saved-article'})));
 }
 // Deliberately ignore abort: the package must independently reject late answers.
 return new Promise((resolve,reject)=>window.calls.push({url,input,signal:init.signal,done:value=>resolve(new Response(JSON.stringify(value))),fail:()=>reject(new Error('Fixture request failed'))}));
};
window.mount=({userId='a',docId='one',title='Original title',body='Original body.'}={})=>root.render(
 <React.StrictMode><Composer user={userId?{id:userId,name:'Fixture writer'}:null} wire={[]} topics={[]} initialTopic={null} initialSource={null} respondTo={null}
 initial={docId?{id:docId,title,body,status:'draft',source:null,respondTo:null}:undefined}/></React.StrictMode>);
window.rewrite=(reportId='report-one',sourceText='Immutable examined source. [E1]')=>root.render(
 <React.StrictMode><RewriteStudio reportId={reportId} result={{language:'en',sourceText,origin:{url:null,textSha256:sourceText}}}/></React.StrictMode>);
window.closeWorkspace=()=>root.render(<p>Workspace closed</p>);
window.mount();`,
  },
  plugins: [
    {
      name: 'controlled-boundaries',
      setup(b) {
        b.onResolve(
          {
            filter:
              /^(next\/(navigation|link)|@\/lib\/auth-client|@bitbaum\/chatkit\/react|@\/app\/investigations\/PhotoSearch|@\/app\/_components\/replies\/ReplyComposer)$/,
          },
          (a) => ({ path: a.path, namespace: 'boundary' }),
        );
        b.onResolve({ filter: /^fixture-chatkit$/ }, () => ({
          path: require.resolve('@bitbaum/chatkit/react'),
        }));
        b.onLoad({ filter: /.*/, namespace: 'boundary' }, (a) => ({
          loader: 'jsx',
          resolveDir: root,
          contents:
            a.path === 'next/navigation'
              ? `export const useRouter=()=>({push:p=>window.paths.push(p),refresh:()=>{}});`
              : a.path === 'next/link'
                ? `import React from 'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}`
                : a.path === '@/lib/auth-client'
                  ? `export const authClient={updateUser:async()=>({error:null})};`
                  : a.path === '@bitbaum/chatkit/react'
                    ? `export {Markdown} from 'fixture-chatkit';export const useDictation=()=>({supported:true,status:'idle',start(){},stop(){}});`
                    : a.path.includes('PhotoSearch')
                      ? `export function PhotoSearch(){return null}`
                      : `export function ReplyComposer(){return null}`,
        }));
        b.onResolve({ filter: /^@\// }, (a) => {
          const p = path.join(root, 'src', a.path.slice(2));
          const found = ['', '.tsx', '.ts', '/index.ts', '/index.tsx']
            .map((ext) => p + ext)
            .find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
          if (!found) throw Error('Unresolved fixture import ' + a.path);
          return { path: found };
        });
      },
    },
  ],
});
const js = bundle.outputFiles.find((f) => f.path.endsWith('.js')).text;
const css = bundle.outputFiles.find((f) => f.path.endsWith('.css'))?.text ?? '';
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_EXECUTABLE ?? '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const proposed = (body = 'AI body.', title = 'AI title') => ({ ok: true, title, body });
const rewritten = (text = 'Labelled simulation [E1].') => ({
  ok: true,
  rewrite: {
    id: 'rewrite-one',
    title: 'A rewrite',
    text,
    label: 'AI-generated outlet simulation — not written by the outlet',
    simulated: true,
    factDiff: { total: 1, kept: 1, changed: [], dropped: [], added: [] },
    evidence: { cited: ['[E1] Fixture evidence.'], omitted: [] },
  },
});
let activePage;
try {
  for (const width of [320, 390, 834, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    activePage = page;
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('http://writing.test/**', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<html><head></head><body><div id="app" class="bb-frame"></div></body></html>',
      }),
    );
    await page.goto('http://writing.test/');
    await page.addStyleTag({ content: css });
    await page.addScriptTag({ content: js });
    const title = page.getByLabel('Title', { exact: true }),
      body = page.getByRole('textbox', { name: 'Article', exact: true });
    const settle = () =>
      page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
      );
    const mount = async (options) => {
      await page.evaluate((o) => window.mount(o), options);
      await settle();
    };
    const count = () => page.evaluate(() => window.calls.length);
    const finish = async (i, payload) => {
      await page.evaluate(({ i, payload }) => window.calls[i].done(payload), { i, payload });
      await settle();
    };
    const improve = async () => {
      if (!(await page.getByRole('textbox', { name: 'What to change' }).count()))
        await page.getByRole('button', { name: 'Improve', exact: true }).click();
      await page.getByRole('textbox', { name: 'What to change' }).fill('Make it clearer');
      const i = await count();
      await page.getByRole('button', { name: 'Improve', exact: true }).last().click();
      await page.waitForFunction((n) => window.calls.length === n + 1, i);
      return i;
    };
    await body.waitFor();
    // Title edits and edit/revert must invalidate the captured revision.
    let i = await improve();
    await title.fill('Manual title');
    await finish(i, proposed());
    assert.equal(await title.inputValue(), 'Manual title');
    assert.equal(await body.inputValue(), 'Original body.');
    await page
      .getByRole('alert')
      .getByText('Your writing or options changed', { exact: false })
      .waitFor();
    i = await improve();
    await page.getByRole('textbox', { name: 'What to change' }).fill('A different instruction');
    await finish(i, proposed('Obsolete instruction result'));
    assert.equal(await body.inputValue(), 'Original body.');
    assert.equal(
      await page.getByRole('textbox', { name: 'What to change' }).inputValue(),
      'A different instruction',
    );
    i = await improve();
    await body.fill('Changed');
    await body.fill('Original body.');
    await finish(i, proposed());
    assert.equal(await body.inputValue(), 'Original body.');
    // Apply and guarded Undo; manual changes permanently retire that Undo.
    i = await improve();
    await finish(i, proposed());
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    assert.equal(await title.inputValue(), 'Manual title');
    assert.equal(await body.inputValue(), 'Original body.');
    i = await improve();
    await finish(i, proposed());
    await body.fill('Later manual edit');
    await body.fill('AI body.');
    assert.equal(await page.getByRole('button', { name: 'Undo', exact: true }).count(), 0);
    // Cancelling an abort-ignoring provider cannot clear a newer request or notice.
    const old = await improve();
    await page.getByRole('button', { name: 'Cancel writing help' }).click();
    assert.equal(await page.evaluate((i) => window.calls[i].signal.aborted, old), true);
    i = await improve();
    await finish(old, proposed('Old answer'));
    assert.equal(await body.inputValue(), 'AI body.');
    assert.equal(await page.getByRole('button', { name: 'Cancel writing help' }).count(), 1);
    await finish(i, proposed('Newest answer'));
    assert.equal(await body.inputValue(), 'Newest answer');
    // Formatting is an edit too, even while assistance is running.
    i = await improve();
    await page.getByRole('button', { name: 'Heading', exact: true }).click();
    const formatted = await body.inputValue();
    await finish(i, proposed('Obsolete formatted answer'));
    assert.equal(await body.inputValue(), formatted);
    // A late error from an unmounted account cannot enter the next account's UI.
    i = await improve();
    await mount({ userId: 'b', docId: 'one', body: 'Account B body.' });
    await page.evaluate((i) => window.calls[i].fail(), i);
    await settle();
    assert.equal(await body.inputValue(), 'Account B body.');
    assert.equal(await page.getByRole('alert').count(), 0);
    i = await improve();
    await mount({ userId: 'b', docId: 'two', body: 'Another draft.' });
    await finish(i, proposed('Wrong draft'));
    assert.equal(await body.inputValue(), 'Another draft.');
    // Flush the latest anonymous keystrokes before ownership changes (no debounce wait).
    await mount({ userId: null, docId: null });
    await title.fill('Anonymous title');
    await body.fill('Anonymous latest text');
    await mount({ userId: 'claimed', docId: null });
    assert.equal(await body.inputValue(), 'Anonymous latest text');
    assert.equal(await title.inputValue(), 'Anonymous title');
    // A draft left by an earlier session is offered, never filled in silently.
    const leaveDraft = (userId) =>
      page.evaluate((id) => {
        const key = 'biaslens:draft:new:' + id;
        localStorage.setItem(
          key,
          JSON.stringify({
            title: 'Old title',
            body: 'Old text.',
            source: null,
            respondToId: null,
            savedAt: '2026-11-01T09:00:00.000Z',
          }),
        );
        sessionStorage.removeItem('biaslens:draft-tab:' + key);
      }, userId);
    const resume = page.getByRole('button', { name: 'Resume draft', exact: true });
    await leaveDraft('stale');
    await mount({ userId: 'stale', docId: null });
    await resume.waitFor();
    assert.equal(await title.inputValue(), '');
    assert.equal(await body.inputValue(), '');
    await resume.click();
    assert.equal(await title.inputValue(), 'Old title');
    assert.equal(await body.inputValue(), 'Old text.');
    await leaveDraft('fresh-start');
    await mount({ userId: 'fresh-start', docId: null });
    await page.getByRole('button', { name: 'Start empty', exact: true }).click();
    assert.equal(await resume.count(), 0);
    assert.equal(await body.inputValue(), '');
    assert.equal(
      await page.evaluate(() => localStorage.getItem('biaslens:draft:new:fresh-start')),
      null,
    );
    // Publishing cancels the proposal and does not resurrect the deleted device draft.
    await mount({ userId: 'publisher', docId: 'publication' });
    i = await improve();
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await page.waitForFunction(() => window.paths.length > 0);
    await finish(i, proposed('Too late for publication'));
    assert.equal(await body.inputValue(), 'Original body.');
    await mount({ userId: 'publisher', docId: 'after-publication' });
    assert.equal(
      await page.evaluate(() => localStorage.getItem('biaslens:draft:publication:publisher')),
      null,
    );
    // Unmount and Strict Mode replay leave the next owner usable.
    i = await improve();
    await page.evaluate(() => window.closeWorkspace());
    await settle();
    await finish(i, proposed());
    await page.getByText('Workspace closed', { exact: true }).waitFor();
    await mount({ docId: 'strict-mode' });
    i = await improve();
    await finish(i, proposed('Fresh Strict Mode owner'));
    assert.equal(await body.inputValue(), 'Fresh Strict Mode owner');
    i = await improve();
    await page.evaluate((i) => window.calls[i].fail(), i);
    await page
      .getByRole('alert')
      .getByText('Writing help could not be reached.', { exact: false })
      .waitFor();
    assert.equal(await body.inputValue(), 'Fresh Strict Mode owner');
    i = await improve();
    await finish(i, proposed('Recovered after retry'));
    assert.equal(await body.inputValue(), 'Recovered after retry');
    await page.screenshot({ path: path.join(output, `composer-${width}.png`) });
    // Source rewrite options, report switches and cancellation retain source/labels.
    await page.evaluate(() => window.rewrite());
    await settle();
    i = await count();
    await page.getByRole('button', { name: 'Write it', exact: true }).click();
    await page.getByRole('button', { name: 'As an outlet', exact: true }).click();
    await page.getByRole('combobox').selectOption('guardian');
    await finish(i, rewritten('Stale options result'));
    assert.equal(await page.getByText('Stale options result', { exact: true }).count(), 0);
    await page.getByRole('alert').waitFor();
    i = await count();
    await page.getByRole('button', { name: 'Write it', exact: true }).click();
    await finish(i, rewritten());
    assert.equal(await page.evaluate((i) => window.calls[i].input.voice.outlet, i), 'guardian');
    await page.getByRole('button', { name: 'Copy the text', exact: true }).click();
    assert.match(await page.evaluate(() => window.copiedText), /^AI-generated outlet simulation/);
    assert.match(await page.evaluate(() => window.copiedText), /\[E1\]/);
    const original = await page.evaluate((i) => window.calls[i].input.text, i);
    assert.equal(original, 'Immutable examined source. [E1]');
    await page.getByRole('button', { name: 'Write another', exact: true }).click();
    const prior = await count();
    await page.getByRole('button', { name: 'Write it', exact: true }).click();
    await page.getByRole('button', { name: 'Stop waiting', exact: true }).click();
    i = await count();
    await page.getByRole('button', { name: 'Write it', exact: true }).click();
    await finish(prior, rewritten('Cancelled result'));
    assert.equal(await page.getByRole('button', { name: 'Stop waiting', exact: true }).count(), 1);
    await page.evaluate(() => window.rewrite('different-report', 'Different immutable source.'));
    await settle();
    await finish(i, rewritten('Previous report result'));
    assert.equal(await page.getByText('Previous report result', { exact: true }).count(), 0);
    i = await count();
    await page.getByRole('button', { name: 'Write it', exact: true }).click();
    await finish(i, rewritten());
    await page.screenshot({ path: path.join(output, `rewrite-${width}.png`) });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `overflow at ${width}`,
    );
    assert.deepEqual(errors, []);
    await page.close();
    console.log(
      `WritingKit lifecycle passed at ${width}px: edits/revert, Undo, cancellation, identity, Strict Mode, labels and source preservation.`,
    );
  }
} catch (error) {
  if (activePage && !activePage.isClosed())
    await activePage.screenshot({ path: path.join(output, 'failure.png') });
  throw error;
} finally {
  await browser.close();
}
