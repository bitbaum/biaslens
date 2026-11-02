import Link from 'next/link';

import { AccountTabs } from '../_components/AccountTabs';
import { SettingsForm } from './SettingsForm';
import styles from './settings.module.css';

export const metadata = {
  title: 'Settings',
  description: 'Reading preferences and what this device keeps.',
};

export default function SettingsPage() {
  return (
    <main id="main-content" className={`bb-frame ${styles.page}`}>
      <p className={styles.kicker}>Your BiasLens</p>
      <h1>Settings</h1>
      <AccountTabs current="/settings" />
      <SettingsForm />
      <p className={styles.meta}>
        Sign-in, passkeys and two-factor live under{' '}
        <Link href="/account">Profile &amp; security</Link>.
      </p>
    </main>
  );
}
