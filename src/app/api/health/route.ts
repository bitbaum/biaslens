import { authStatus } from '@/lib/auth';
import { assessBetaReadiness } from '@/lib/health/readiness';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(
    { ...assessBetaReadiness(process.env), accounts: authStatus() },
    {
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );
}
