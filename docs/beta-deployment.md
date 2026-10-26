# Beta hosting readiness

The app is **not public merely because GitHub CI passes**. A real beta
requires three separate checks: the canonical Fleet registration, a reachable
public HTTP host, and at least one configured AI provider.

## Existing Fleet provisioning process

Loki owns the host, deployment keys, Caddy and ports. **Do not** duplicate a
port or deploy script inside this product:

```bash
# Run on the existing studio box, using the durable Loki checkout and credentials.
cd /home/ubuntu/dev/loki
bash scripts/hetzner/register-site.sh biaslens \
  --repo bitbaum/biaslens \
  --owner bitbaum \
  --kind product \
  --status validating \
  --title "Research beta"
```

The slug `biaslens` is a temporary technical routing identifier; the public
brand is separately configurable and can change without renaming the host or
repository. That script is designed to allocate an unused port, create the
site's runtime environment, install the deploy key and GitHub variables, add
the Caddy vhost and reusable CD shim, and deploy. Do not edit
`loki/scripts/hetzner/apps.conf` by hand before registration; this risks
claiming a port that belongs to another process. For non-destructive
inspection, run the same command with `--dry-run`.

After registration, use the existing site domain
`https://biaslens.orangecat.ch` until an owner-approved custom domain is
connected through Loki. This is a host name, not the final product name.

## Runtime environment (owned by the studio box, never GitHub)

`/opt/biaslens/shared/.env` must contain:

```dotenv
NODE_ENV=production
PORT=<assigned by Fleet>
NEXT_PUBLIC_SITE_URL=https://biaslens.orangecat.ch
NEXT_PUBLIC_PRODUCT_NAME=BiasLens
NEXT_PUBLIC_PRODUCT_MARK=B/L
GROQ_API_KEY=<set in the box secrets store if available>
# Or OPENROUTER_API_KEY=<set in the box secrets store>
```

The existing deploy runner fetches this environment securely from the box
**before** building Next.js. A name/logo or `NEXT_PUBLIC_*` change requires
a redeploy. No provider key is written to a source file, GitHub variable,
browser or public report.

The availability endpoint `GET /api/health` reports `ai:
credentials-missing` if providers aren't configured, rather than claiming
the service works. `credentials-present` is only an env check; it does NOT
prove the model endpoint is responding.

## Acceptance sequence

1. Confirm the Fleet manifest row and a real Caddy/TLS response.
2. Confirm `/`, `/analyze`, `/methodology`, `/blog`, a journal article and
   `/api/health` respond from the **public** host, not just CI's localhost.
3. Confirm the API reports provider credentials present without exposing a
   key. **If missing, model-driven analysis is unavailable.**
4. Submit a public, non-sensitive article URL and verify the generated analysis
   arrives with explicit provenance/uncertainty rather than a fabricated
   independent verdict.
5. Confirm mobile/desktop screenshot artifacts and public page navigation.
6. Record this beta in `CHANGELOG.md`; the roadmap is `ROADMAP.md`.

Until these are observed, mark the product as **not yet deployed** or
**beta — running, not released** only after the host actually responds.

## Known follow-ups

- Replace in-process IP rate limiting with a shared per-user/provider quota
  before broader anonymous traffic; free external model tiers are finite.
- Persist sources, analysis runs, evidence citations and challenge/correction
  history for reproducible published findings.
- Debate analytics require real audio/video source spans, diarisation quality
  assessment and reviewable corrections; the journal currently documents the
  intended methodology, not a working debate-scoring pipeline.
