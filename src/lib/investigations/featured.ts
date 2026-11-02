import { HOUSING_DEMO } from '@/lib/investigations/housing-demo';
import { getInvestigation } from '@/lib/investigations/store';
import type { Investigation } from '@/lib/domain/investigation';
import { db } from '@/lib/db/client';

/**
 * Investigations shown on the Today page. Saved investigations are unlisted
 * by default (anyone with the link can read them); only ids named here are
 * featured, so nobody's private link turns up on the home page.
 */
export const FEATURED_IDS = ['3iqMy8Z5ro'] as const;

export interface Featured {
  id: string;
  href: string;
  investigation: Investigation;
  updatedAt: string | null;
}

export async function loadFeatured(): Promise<Featured[]> {
  const saved: Featured[] = [];
  if (process.env.DATABASE_URL) {
    for (const id of FEATURED_IDS) {
      try {
        const row = await getInvestigation(db, id);
        if (row)
          saved.push({
            id,
            href: '/investigations/' + id,
            investigation: row.investigation,
            updatedAt: new Date(row.updatedAt).toISOString(),
          });
      } catch {
        /* The home page renders without the database. */
      }
    }
  }
  return [
    ...saved,
    { id: 'demo', href: '/investigations/demo', investigation: HOUSING_DEMO, updatedAt: null },
  ];
}

export interface ScrutinisedClaim {
  text: string;
  href: string;
  supports: number;
  contradicts: number;
  context: number;
  contested: boolean;
}

/** Claims with the most linked findings, contested ones first. Not a popularity measure. */
export function claimsUnderScrutiny(list: Featured[], limit = 5): ScrutinisedClaim[] {
  const seen = new Set<string>();
  const out: ScrutinisedClaim[] = [];
  for (const f of list)
    for (const claim of f.investigation.claims) {
      if (seen.has(claim.text)) continue;
      seen.add(claim.text);
      const links = f.investigation.links.filter((l) => l.claimId === claim.id);
      const n = (s: string) => links.filter((l) => l.stance === s).length;
      out.push({
        text: claim.text,
        href: f.href + '#map-heading',
        supports: n('supports'),
        contradicts: n('contradicts'),
        context: n('context'),
        contested: n('supports') > 0 && n('contradicts') > 0,
      });
    }
  return out
    .sort(
      (a, b) =>
        Number(b.contested) - Number(a.contested) ||
        b.supports + b.contradicts + b.context - (a.supports + a.contradicts + a.context),
    )
    .slice(0, limit);
}

export interface EvidenceOfTheDay {
  statement: string;
  locator: string;
  study: string;
  studyUrl: string;
  claim: string;
  stance: string;
  href: string;
}

/** One finding per calendar day (Europe/Zurich), the same for every reader. */
export function evidenceOfTheDay(list: Featured[], now = new Date()): EvidenceOfTheDay | null {
  const rows: EvidenceOfTheDay[] = [];
  const seen = new Set<string>();
  for (const f of list)
    for (const link of f.investigation.links) {
      const study = f.investigation.studies.find((s) => s.id === link.studyId);
      const finding = study?.findings.find((x) => x.id === link.findingId);
      const claim = f.investigation.claims.find((c) => c.id === link.claimId);
      if (!study || !finding || !claim || seen.has(finding.statement)) continue;
      seen.add(finding.statement);
      rows.push({
        statement: finding.statement,
        locator: finding.locator,
        study: `${study.authors} (${study.year ?? 'n.d.'})`,
        studyUrl: study.doi ? 'https://doi.org/' + study.doi : study.url,
        claim: claim.text,
        stance: link.stance,
        href: f.href + '#evidence',
      });
    }
  if (!rows.length) return null;
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(now);
  const index = [...day].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % rows.length;
  return rows[index]!;
}

export interface Change {
  at: string;
  title: string;
  investigation: string;
  href: string;
}

/** Every saved version across featured investigations, newest first. */
export function recentChanges(list: Featured[]): Change[] {
  return list
    .flatMap((f) =>
      (f.investigation.drafts ?? []).map((d) => ({
        at: d.createdAt,
        title: `v${d.version}: ${d.title}`,
        investigation: f.investigation.question,
        href: f.href + '#versions',
      })),
    )
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 12);
}
