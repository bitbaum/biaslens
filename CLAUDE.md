# BiasLens agent entrypoint

**First read:** [this repository's AGENTS.md](AGENTS.md) and the
[Bitbaum Fleet agent rules](https://github.com/bitbaum/fleet/blob/main/AGENTS.md).

Do not create a second product brief, brand, identity register or
shared-package implementation here. Loki's project profile is the source for
mission, vision, problem and solution. `ROADMAP.md` and `CHANGELOG.md` in this
repository are the canonical development records, which Loki ingests into the
project profile.

## Product and engineering references

- [Public Open Epistemic Method v0.1](docs/methodology/open-epistemic-method-v0.1.md)
- [Truth Seeker → BiasLens migration handoff](docs/convergence-truthseeker.md)
- [Repository README](README.md) for the current implemented state and commands
- `src/lib/domain/epistemic-graph.ts` for claim/evidence/causal-link audit types
- `src/lib/domain/first-principles.ts` for the model-output contract
- `src/lib/analysis/` and `src/app/api/analyze/route.ts` for the first working
  URL/paste workflow; `src/app/analyze/` for the browser report

The article output is **unverified AI analysis**, not an external fact verdict.
Keep evidence quality, framing, attribution and causal hypotheses visibly
distinct. A claim can be challenged; a human disagreement cannot be closed
merely by generating an AI answer.

## Coordination

The first on-demand slice was integrated in
[PR #49](https://github.com/bitbaum/biaslens/pull/49), superseding the older
integration draft #46. Do **not** redo that migration. Before any work, inspect
current `main` and active PRs; use a separate branch, run `pnpm run verify`
and `pnpm run build`, and keep historical Truth Seeker code intact until
production parity and rollback checks succeed.
