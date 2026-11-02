'use client';

import { useEffect, useState } from 'react';

import { follows, setFollow } from '@/lib/client/local';

/** Follow an investigation: its new versions show on your desk and on Today. */
export function FollowButton({ id }: { id: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    queueMicrotask(() => setOn(follows().includes(id)));
  }, [id]);
  return (
    <button
      type="button"
      className="bb-button bb-button--secondary"
      aria-pressed={on}
      onClick={() => {
        setFollow(id, !on);
        setOn(!on);
      }}
    >
      {on ? '★ Following' : '☆ Follow'}
    </button>
  );
}
