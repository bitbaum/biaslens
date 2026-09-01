import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EVIDENCE_STANCE, VERIFICATION_STATUS } from '@/lib/config/verification';

// The route reads stored evidence through the shared Drizzle client. We mock that
// door so the boundary logic (lookup → 404-or-score) is testable without a live
// database — the same test then runs in CI, which has no Postgres.
const findFirst = vi.fn();
vi.mock('@/lib/db/client', () => ({
  db: { query: { claims: { findFirst: (...args: unknown[]) => findFirst(...args) } } },
}));

import { GET } from './route';

function callGet(id: string) {
  return GET(new Request('http://test/'), { params: Promise.resolve({ id }) });
}

describe('GET /api/claims/[id]/verify', () => {
  beforeEach(() => {
    findFirst.mockReset();
  });

  it('404s with a structured error when the claim does not exist', async () => {
    findFirst.mockResolvedValue(undefined);

    const res = await callGet('missing');
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ success: false, error: "No claim with id 'missing'." });
  });

  it('scores the claim from its stored evidence stances', async () => {
    findFirst.mockResolvedValue({
      evidence: [
        { stance: EVIDENCE_STANCE.SUPPORTS },
        { stance: EVIDENCE_STANCE.SUPPORTS },
        { stance: EVIDENCE_STANCE.CONTRADICTS },
      ],
    });

    const res = await callGet('c1');
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe(VERIFICATION_STATUS.SUPPORTED);
    expect(body.data.inputs).toEqual({ supports: 2, contradicts: 1, total: 3 });
  });

  it('reports PENDING for a stored claim that has no evidence yet', async () => {
    findFirst.mockResolvedValue({ evidence: [] });

    const res = await callGet('c2');
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.status).toBe(VERIFICATION_STATUS.PENDING);
    expect(body.data.confidence).toBeNull();
  });
});
