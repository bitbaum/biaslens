import { NextResponse } from 'next/server';

import { scoreClaimVerification } from '@/lib/domain/claim-verification';
import { parseVerifyRequest } from '@/lib/domain/verify-request';

/**
 * POST /api/claims/verify
 *
 * The HTTP boundary for the claim-verification score. Thin by design: it
 * validates the request, delegates to the pure domain scorer, and returns the
 * fully explainable verdict as JSON — the DoD's "exportable JSON output".
 *
 * Body:     { "evidence": [{ "stance": "supports" | "contradicts" }, ...] }
 * Success:  200 { success: true, data: ClaimVerification }
 * Failure:  400 { success: false, error: string }
 *
 * The response carries the tally, confidence, and algorithm id straight from the
 * domain, so a caller can reproduce the verdict from what they sent.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Request body must be valid JSON.' },
      { status: 400 },
    );
  }

  const parsed = parseVerifyRequest(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  }

  const data = scoreClaimVerification(parsed.data.evidence);
  return NextResponse.json({ success: true, data });
}
