import { InquiryDesk } from './InquiryDesk';
import styles from './explore.module.css';

export const metadata = {
  title: 'Research notebook',
  description:
    'Keep a question, exact source references and open challenges together in a browser-local investigation.',
};

export default function ExplorePage() {
  return (
    <>
      <main id="main-content" className={`${styles.page} bb-frame`}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Your investigation</p>
          <h1>Research notebook.</h1>
          <p>
            Keep your question, sources and competing explanations together. Saved in this browser;
            export a copy to take it with you.
          </p>
        </header>
        <InquiryDesk />
      </main>
    </>
  );
}
