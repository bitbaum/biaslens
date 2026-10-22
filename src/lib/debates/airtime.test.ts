import { describe, expect, it } from 'vitest';

import { formatAirtime, measureAirtime, parseTimedTranscript, parseTimestamp } from './airtime';

const sample = [
  '00:00-00:30 | Speaker A | A response.',
  '00:20-00:40 | Speaker B | Another response, including overlap.',
  '00:40-01:00 | Speaker A | A second response.',
  '01:10-01:30 | Moderator | Follow-up question.',
].join('\n');

describe('manual debate airtime', () => {
  it('parses MM:SS and HH:MM:SS clocks without inventing timings', () => {
    expect(parseTimestamp('90:30')).toBe(5430);
    expect(parseTimestamp('01:30:00')).toBe(5400);
    expect(parseTimestamp('00:61')).toBeNull();
    expect(parseTimestamp('xx:30')).toBeNull();
  });

  it('groups users supplied speakers and counts each distinct segment exactly once', () => {
    const parsed = parseTimedTranscript(sample);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const report = measureAirtime(parsed.turns);
    expect(report.speakers.map((s) => [s.speaker, s.airtimeSeconds])).toEqual([
      ['Speaker A', 50],
      ['Speaker B', 20],
      ['Moderator', 20],
    ]);
    expect(report.recordedWindowSeconds).toBe(90);
    expect(report.coveredSeconds).toBe(80);
    expect(report.simultaneousSpeakerSeconds).toBe(10);
    expect(report.unattributedSeconds).toBe(10);
    expect(report.sourceVerified).toBe(false);
  });

  it('never double-counts overlapping turns from the SAME speaker', () => {
    const parsed = parseTimedTranscript(
      '00:00-00:30 | Speaker A | First.\n00:20-00:40 | Speaker A | Second.',
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const report = measureAirtime(parsed.turns);
    expect(report.speakers[0].airtimeSeconds).toBe(40);
    expect(report.simultaneousSpeakerSeconds).toBe(0);
  });

  it('makes percent denominator explicit when multiple speakers overlap', () => {
    const parsed = parseTimedTranscript(sample);
    if (!parsed.ok) throw new Error(parsed.error);
    const report = measureAirtime(parsed.turns);
    expect(report.speakers.reduce((a, b) => a + b.shareOfSpeakerSeconds, 0)).toBeCloseTo(100);
    expect(report.speakers[0].shareOfSpeakerSeconds).toBeCloseTo((50 / 90) * 100);
  });

  it('rejects missing timestamps, backward intervals and unrecognised lines', () => {
    expect(parseTimedTranscript('').ok).toBe(false);
    expect(parseTimedTranscript('00:15-00:01 | A | Bad').ok).toBe(false);
    expect(parseTimedTranscript('just some speech without timing').ok).toBe(false);
  });

  it('caps input to prevent excessive processing or accidental unlimited uploads', () => {
    expect(parseTimedTranscript('a'.repeat(65_001)).ok).toBe(false);
  });

  it('formats airtime consistently for display', () => {
    expect(formatAirtime(65)).toBe('1:05');
    expect(formatAirtime(0)).toBe('0:00');
  });
});
