'use client';

import { useState } from 'react';

import type { OutputLanguage } from '@/lib/config/languages';
import { replyCopy } from '@/lib/config/reply-copy';

import styles from './replies.module.css';

type Network = { name: string; href: (text: string, url: string, title: string) => string };

const NETWORKS: Network[] = [
  { name: 'WhatsApp', href: (text) => 'https://wa.me/?text=' + encodeURIComponent(text) },
  {
    name: 'Telegram',
    href: (text, url) =>
      'https://t.me/share/url?url=' +
      encodeURIComponent(url) +
      '&text=' +
      encodeURIComponent(text.replace(url, '').trim()),
  },
  { name: 'Signal', href: (text) => 'sgnl://send?text=' + encodeURIComponent(text) },
  { name: 'X', href: (text) => 'https://x.com/intent/post?text=' + encodeURIComponent(text) },
  {
    name: 'Bluesky',
    href: (text) => 'https://bsky.app/intent/compose?text=' + encodeURIComponent(text),
  },
  {
    name: 'LinkedIn',
    href: (_text, url) =>
      'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url),
  },
  {
    name: 'Facebook',
    href: (_text, url) => 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url),
  },
  {
    name: 'Email',
    href: (text, _url, title) =>
      'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(text),
  },
];

/**
 * One primary action: Share. On a phone it opens the system sheet with the
 * text, the link and the image; elsewhere the same choices are spelled out.
 */
export function SharePanel({
  language,
  replyId,
  url,
  text,
  title,
  onEdit,
}: {
  language: OutputLanguage;
  replyId: string;
  url: string;
  text: string;
  title: string;
  onEdit?: () => void;
}) {
  const copy = replyCopy(language);
  const [copied, setCopied] = useState<'text' | 'link' | null>(null);
  const imageUrl = `/a/${replyId}/image?format=square`;

  const share = async () => {
    const data: ShareData = { title, text };
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'biaslens-' + replyId + '.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) data.files = [file];
    } catch {
      // The text and link still go out without the image.
    }
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    await copy_(text, 'text');
  };

  const copy_ = async (value: string, which: 'text' | 'link') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  return (
    <section className={styles.share} aria-label={copy.share}>
      <pre className={styles.sharedText}>{text}</pre>
      <button
        type="button"
        className={`${styles.primary} bb-button bb-button--primary`}
        onClick={share}
      >
        {copy.share}
      </button>
      <div className={styles.twoCells}>
        <button type="button" className={styles.secondary} onClick={() => copy_(text, 'text')}>
          {copied === 'text' ? copy.copied : copy.copyText}
        </button>
        <button type="button" className={styles.secondary} onClick={() => copy_(url, 'link')}>
          {copied === 'link' ? copy.copied : copy.copyLink}
        </button>
      </div>
      <p className={styles.kicker}>{copy.sendVia}</p>
      <div className={styles.networks}>
        {NETWORKS.map((network) => (
          <a
            key={network.name}
            className={styles.network}
            href={network.href(text, url, title)}
            target="_blank"
            rel="noreferrer"
          >
            {network.name}
          </a>
        ))}
      </div>
      <div className={styles.twoCells}>
        <a className={styles.secondary} href={imageUrl} download={'biaslens-' + replyId + '.png'}>
          {copy.downloadImage}
        </a>
        <a className={styles.secondary} href={url}>
          {copy.openPage}
        </a>
      </div>
      {onEdit && (
        <button type="button" className={styles.textButton} onClick={onEdit}>
          ← {copy.composerTitle}
        </button>
      )}
    </section>
  );
}
