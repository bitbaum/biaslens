import { describe, expect, it } from 'vitest';

import { HOUSING_DEMO } from '@/lib/investigations/housing-demo';

import { auditEpistemicGraph } from './epistemic-graph';
import {
  citableFindings,
  compareClaims,
  investigationProblems,
  parseInvestigation,
  toEpistemicGraph,
  validateInvestigation,
} from './investigation';

const clone = () => structuredClone(HOUSING_DEMO);

describe('housing investigation fixture', () => {
  it('is a valid investigation and a valid epistemic graph', () => {
    expect(validateInvestigation(HOUSING_DEMO)).toEqual([]);
    expect(parseInvestigation(clone())).not.toBeNull();
  });

  it('cites every study by a resolvable link and a locator', () => {
    for (const study of HOUSING_DEMO.studies) {
      expect(study.url).toMatch(/^https:\/\//);
      for (const finding of study.findings) expect(finding.locator.length).toBeGreaterThan(3);
    }
    expect(HOUSING_DEMO.studies.find((s) => s.id === 's-auckland')?.doi).toBe(
      '10.1016/j.jue.2023.103555',
    );
  });

  it('maps every link to an evidence record the method audits', () => {
    const graph = toEpistemicGraph(HOUSING_DEMO);
    expect(graph.evidence).toHaveLength(HOUSING_DEMO.links.length);
    const audit = auditEpistemicGraph(graph);
    const rc = audit.claims.find((c) => c.claimId === 'h-rentcontrol')!;
    expect(rc.evidenceStage).toBe('leads_only');
    expect(rc.gaps).toContain('All sources are unreviewed leads');
  });
});

describe('compareClaims', () => {
  const comparison = compareClaims(HOUSING_DEMO);
  const byId = (id: string) => comparison.find((row) => row.claim.id === id)!;

  it('keeps supporting and contradicting evidence side by side, with no score', () => {
    const rc = byId('h-rentcontrol');
    expect(rc.supports.map((r) => r.study.id)).toEqual(['s-kholodilin']);
    expect(rc.contradicts.map((r) => r.study.id).sort()).toEqual(['s-argentina', 's-kholodilin']);
    expect(Object.keys(rc)).not.toContain('score');
  });

  it('explains a disagreement by horizon before calling it open', () => {
    const rc = byId('h-rentcontrol');
    const text = rc.tensions.join(' ');
    expect(text).toMatch(/Kholodilin report both/);
    expect(text).toMatch(/Elfert & Thomsen \(Buenos Aires, 2023–2024\) study different places/);
  });

  it('flags a causal claim with only descriptive support', () => {
    const inv = clone();
    inv.links = inv.links.filter((l) => l.claimId !== 'c-drivers' || l.studyId === 's-eurostat');
    const drivers = compareClaims(inv).find((row) => row.claim.id === 'c-drivers')!;
    expect(drivers.gaps).toContain(
      'Causal claim rests only on associational, descriptive or review evidence',
    );
  });

  it('raises the economic scaffold questions for each lens', () => {
    expect(byId('h-supply').scaffold.map((s) => s.lens)).toContain('identification');
    expect(byId('c-rate').scaffold).toEqual([]);
  });
});

describe('investigationProblems', () => {
  it('rejects a link to a finding that does not exist', () => {
    const inv = clone();
    inv.links[0].findingId = 'nope';
    expect(investigationProblems(inv).join(' ')).toMatch(/unknown finding/);
  });

  it('rejects malformed DOIs and non-http URLs', () => {
    const inv = clone();
    inv.studies[1].doi = 'not-a-doi';
    inv.studies[2].url = 'javascript:alert(1)';
    const problems = investigationProblems(inv).join(' ');
    expect(problems).toMatch(/DOI is malformed/);
    expect(problems).toMatch(/http\(s\) URL/);
  });

  it('rejects non-objects', () => {
    expect(investigationProblems(null)).toEqual(['Send a JSON object.']);
  });
});

describe('citableFindings', () => {
  it('states design, horizon and locator for each linked finding', () => {
    const lines = citableFindings(HOUSING_DEMO);
    expect(
      lines.some((l) => l.includes('Regression discontinuity') && l.includes('short-run')),
    ).toBe(true);
    expect(lines.every((l) => /https:\/\//.test(l))).toBe(true);
  });
});
