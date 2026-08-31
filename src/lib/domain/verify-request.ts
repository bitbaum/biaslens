import { EVIDENCE_STANCE, type EvidenceStance } from '../config/verification';

/**
 * Boundary validation for a claim-verification request.
 *
 * The HTTP layer must never trust its input; this parser turns an untyped JSON
 * body into the exact `{ stance }[]` the domain scorer consumes, or a structured
 * error explaining the first thing that is wrong. Kept in `domain/` (not the
 * route file) so the rule "what a valid request is" lives in one place and is
 * unit-testable without spinning up HTTP.
 *
 * Stance is validated against {@link EVIDENCE_STANCE} — the same SSOT the scorer
 * uses — so an unknown stance is rejected here with a helpful message rather than
 * being silently dropped downstream.
 */
export type ParseResult<T> = { success: true; data: T } | { success: false; error: string };

export interface VerifyRequest {
  evidence: ReadonlyArray<{ stance: EvidenceStance }>;
}

const ALLOWED_STANCES = Object.values(EVIDENCE_STANCE);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseVerifyRequest(body: unknown): ParseResult<VerifyRequest> {
  if (!isObject(body)) {
    return { success: false, error: 'Request body must be a JSON object.' };
  }

  const { evidence } = body;
  if (!Array.isArray(evidence)) {
    return { success: false, error: '`evidence` must be an array.' };
  }

  const parsed: { stance: EvidenceStance }[] = [];
  for (let i = 0; i < evidence.length; i += 1) {
    const row = evidence[i];
    if (!isObject(row)) {
      return { success: false, error: `evidence[${i}] must be an object.` };
    }
    const { stance } = row;
    if (typeof stance !== 'string' || !ALLOWED_STANCES.includes(stance as EvidenceStance)) {
      return {
        success: false,
        error: `evidence[${i}].stance must be one of: ${ALLOWED_STANCES.join(', ')}.`,
      };
    }
    parsed.push({ stance: stance as EvidenceStance });
  }

  return { success: true, data: { evidence: parsed } };
}
