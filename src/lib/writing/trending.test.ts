import { describe, expect, it } from 'vitest';

import type { WireItem } from '@/lib/wire/parse';

import { trendingTopics } from './trending';

const item = (title: string, source: string): WireItem => ({
  title,
  source,
  link: 'https://example.org/' + encodeURIComponent(title),
  published: null,
});

describe('trendingTopics', () => {
  it('finds a subject two sources share and lists their headlines', () => {
    const topics = trendingTopics([
      item('Supreme Court hears the case on tariffs', 'BBC News'),
      item('Tariff case reaches Supreme Court', 'NPR'),
      item('Harry Kane extends Bayern contract', 'Al Jazeera'),
    ]);
    expect(topics[0]?.label).toBe('Supreme Court');
    expect(topics[0]?.sources).toBe(2);
    expect(topics[0]?.items.map((i) => i.source)).toEqual(['BBC News', 'NPR']);
  });

  it('ignores a word only one source uses and stop words every source uses', () => {
    const topics = trendingTopics([
      item('The latest on the election', 'BBC News'),
      item('The latest on the harvest', 'NPR'),
    ]);
    expect(topics).toEqual([]);
  });

  it('keeps the pair, not the words inside it, when they cover the same headlines', () => {
    const topics = trendingTopics([
      item('Supreme Court rules', 'A'),
      item('Supreme Court sits', 'B'),
      item('Supreme Court adjourns', 'C'),
    ]);
    expect(topics.map((t) => t.label)).toEqual(['Supreme Court']);
  });

  it('returns nothing for an empty wire', () => {
    expect(trendingTopics([])).toEqual([]);
  });
});
