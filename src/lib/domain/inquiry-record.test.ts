import { describe, expect, it } from 'vitest';

import { EMPTY_INQUIRY, isSourceURL, parseInquiryRecord } from './inquiry-record';

describe('browser-local inquiry records are user input, not verification', () => {
  it('round trips a question with an exact source location and open criticism', () => {
    const record = {
      ...EMPTY_INQUIRY,
      question: 'What explains this change?',
      scope: 'One country, 2000–2020',
      challenge: 'Could sample selection explain it?',
      sources: [
        {
          id: 'source-1',
          title: 'Original data',
          url: 'https://example.org/data',
          locator: 'Table 2',
          excerpt: '<script>untrusted text</script>',
          stance: 'context',
          addedAt: '2026-10-22T00:00:00Z',
        },
      ],
    };
    expect(parseInquiryRecord(JSON.parse(JSON.stringify(record)))).toEqual(record);
    expect(parseInquiryRecord(record)?.sources[0]).not.toHaveProperty('review');
  });

  it('rejects executable links, credentials, malformed storage and invalid relationships', () => {
    for (const url of [
      'javascript:alert(1)',
      'data:text/html,hello',
      '//example.org',
      'https://name:secret@example.org',
    ]) {
      expect(isSourceURL(url)).toBe(false);
    }
    expect(isSourceURL('https://example.org/record#table-2')).toBe(true);
    for (const value of [
      null,
      [],
      { ...EMPTY_INQUIRY, question: 42 },
      { ...EMPTY_INQUIRY, version: 2 },
      { ...EMPTY_INQUIRY, sources: Array(101).fill({}) },
    ]) {
      expect(parseInquiryRecord(value)).toBeNull();
    }
    const source = {
      id: 's',
      title: 'Source',
      url: 'https://example.org',
      locator: 'p. 2',
      excerpt: '',
      stance: 'context',
      addedAt: '2026-10-22',
    };
    expect(parseInquiryRecord({ ...EMPTY_INQUIRY, sources: [source, source] })).toBeNull();
    expect(
      parseInquiryRecord({ ...EMPTY_INQUIRY, sources: [{ ...source, stance: 'verified' }] }),
    ).toBeNull();
    expect(
      parseInquiryRecord({
        ...EMPTY_INQUIRY,
        sources: [{ ...source, url: 'javascript:alert(1)' }],
      }),
    ).toBeNull();
  });
});
