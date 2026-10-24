import { InquiryDesk } from './InquiryDesk';
import styles from './explore.module.css';

export const metadata = {
  title: 'Explore a question',
  description:
    'Keep a question, exact source references and open challenges together in a browser-local investigation.',
};

export default function ExplorePage() {
  return (
    <>
      <main id="main-content" className={`${styles.page} bb-frame`}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>An investigation starts with curiosity</p>
          <h1>What do you want to understand?</h1>
          <p>
            Explore science, history, economics, or an explanation you want to test. Keep source
            references and criticism beside the question.
          </p>
        </header>
        <InquiryDesk />
      </main>
    </>
  );
}
