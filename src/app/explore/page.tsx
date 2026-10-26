import { InquiryDesk } from './InquiryDesk';
import styles from './explore.module.css';

export const metadata = {
  title: 'Research notebook',
  description:
    'Say what you want to understand: the question, the explanations to keep open and what would change your mind, laid out for you. Saved in this browser.',
};

export default function ExplorePage() {
  return (
    <>
      <main id="main-content" className={`${styles.page} bb-frame`}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Your investigation</p>
          <h1>Research notebook.</h1>
          <p>
            Say what you want to understand. BiasLens sets out the question, the explanations to
            keep open and what would change your mind; you add the sources. Saved in this browser.
          </p>
        </header>
        <InquiryDesk />
      </main>
    </>
  );
}
