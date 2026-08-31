import { NextResponse } from 'next/server';

import type { ApiResult } from '@/lib/api/result';
import { prisma } from '@/lib/db/prisma';
import { scoreClaimVerification, type ClaimVerification } from '@/lib/domain/claim-verification';

/**
 * GET /api/claims/[id]/verify
 *
 * The DB-backed twin of POST /api/claims/verify. Where the POST route scores
 * ephemeral evidence supplied in the request body, this route realizes the core
 * principle "scores are functions of stored evidence": it loads the claim's
 * `Evidence` rows from Postgres and runs the SAME pure scorer over their stances.
 * The verdict is recomputed from what is stored — never cached or hard-coded — so
 * it stays reproducible and auditable.
 *
 * Success: 200 { success: true, data: ClaimVerification }
 * Missing: 404 { success: false, error: string }
 *
 * Only `stance` is selected — the sole input the tally algorithm consumes — so the
 * query stays minimal and the HTTP layer never over-fetches.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResult<ClaimVerification>>> {
  const { id } = await context.params;

  const claim = await prisma.claim.findUnique({
    where: { id },
    select: { evidence: { select: { stance: true } } },
  });

  if (!claim) {
    return NextResponse.json(
      { success: false, error: `No claim with id '${id}'.` },
      { status: 404 },
    );
  }

  const data = scoreClaimVerification(claim.evidence);
  return NextResponse.json({ success: true, data });
}
