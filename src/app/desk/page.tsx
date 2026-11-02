import { AccountTabs } from '../_components/AccountTabs';
import { MyDesk } from './MyDesk';
import styles from './desk.module.css';

export const metadata = {
  title: 'My desk',
  description: 'Your investigations, review queue and follows.',
};

export default function DeskPage() {
  return (
    <main id="main-content" className={`bb-frame ${styles.page}`}>
      <p className={styles.kicker}>Your BiasLens</p>
      <h1>My desk</h1>
      <AccountTabs current="/desk" />
      <MyDesk />
    </main>
  );
}
