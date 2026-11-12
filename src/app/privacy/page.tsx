import type { Metadata } from 'next';
import Link from 'next/link';

import styles from '../_components/legal.module.css';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What BiasLens keeps, where it goes, and how to have it removed.',
};

const CONTACT = 'cato@orangecat.ch';

/**
 * Every line here was checked against the code that does it (schema,
 * accountkit, ai-kit, the routes that call out). Change the page with the
 * behaviour, in the same pull request.
 */
export default function PrivacyPage() {
  return (
    <main id="main-content" className={`bb-frame ${styles.page}`}>
      <p className={styles.kicker}>BiasLens</p>
      <h1>Privacy</h1>
      <p className={styles.meta}>Last changed 12 November 2026</p>
      <p>
        BiasLens is beta research software made by bitbaum and run by Cato. It keeps what it needs
        to sign you in, to hold what you write and save, and to answer what you ask of it. It has no
        advertising, sells no data and runs no analytics or tracking scripts.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>
          Your email address and a password (stored only as a hash), or the sign-in methods you
          added instead: a passkey, a Lightning wallet&apos;s public key, OrangeCat, or the shared
          bitbaum sign-in (Google or GitHub). From those providers BiasLens keeps the account
          identifier and the name they send.
        </li>
        <li>The name you choose as your byline, and whether two-factor sign-in is on.</li>
        <li>Sign-in cookies that keep you signed in. BiasLens sets no other cookies.</li>
        <li>
          Sign-in links and password resets are sent by email through Resend, which sees the address
          and the message.
        </li>
      </ul>

      <h2>What you write and save</h2>
      <ul>
        <li>
          Articles and drafts you save, and comments you post. A published article or comment is
          public; a draft is visible only to you.
        </li>
        <li>
          A reading you save or share (<code>/r/…</code>): the report, with the passages it quotes,
          and the article&apos;s link and title, not its full text. Replies you send, rewrites you
          make (the rewritten text, not the original) and investigations you save (the question, its
          sources and your drafts) are kept at their own address.
        </li>
      </ul>

      <h2>What leaves BiasLens to answer you</h2>
      <ul>
        <li>
          Text you examine, rewrite or ask writing help about, and recordings you dictate, are sent
          to the AI model providers BiasLens is configured with (currently Groq and OpenRouter) to
          produce the answer. BiasLens keeps neither the recording nor the full article text
          afterwards.
        </li>
        <li>
          A link you give is fetched by the BiasLens server from its publisher. Photo searches go to
          Wikimedia Commons, people and outlets are looked up on Wikidata and Wikipedia, and studies
          on Crossref.
        </li>
      </ul>

      <h2>Kept only in your browser</h2>
      <p>
        Unsaved drafts, the research notebook, the investigations and follows on My desk, the visit
        streak and your settings are stored in this browser and are never sent to BiasLens unless
        you save them. Clearing the browser&apos;s site data removes them.
      </p>

      <h2>Removing it</h2>
      <p>
        Under <Link href="/account">Profile &amp; security</Link> you can delete your account and
        your sign-in methods. Articles and comments you published are not deleted with the account
        yet: delete them from your articles first, or write to{' '}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a> and they will be removed for you. The same
        address answers any question about your data, and requests for a copy of it.
      </p>

      <div className={styles.actions}>
        <Link className="bb-button bb-button--secondary" href="/account">
          Profile &amp; security
        </Link>
        <a className="bb-button bb-button--secondary" href={`mailto:${CONTACT}`}>
          Write to {CONTACT}
        </a>
        <Link className="bb-button bb-button--secondary" href="/terms">
          Terms
        </Link>
      </div>
    </main>
  );
}
