# BiasLens interface contract

Read this and Fleet SHARED.md before changing a screen. Shared package bindings
remain in package-plan.json. Product requirements and canonical development
records retain their existing owners.

The product uses one sans-serif family from design-tokens, neutral surfaces,
ink actions and one interaction accent. Status must be stated in text, never
inferred from colour. CSS modules consume theme roles; colour literals belong
only to the theme adapter. No gradients, decorative shadows, rainbow charts or
page-specific typography scales.

Use the same page-title role for application pages, the same card-title role
for tool cards and the same body/label/metadata roles everywhere. Reading pages
use a narrower measure while retaining the same typography. Use a consistent
8px spacing rhythm, 44px minimum targets, visible keyboard focus and reduced
motion support. Keep exactly one obvious primary action in each task form.

Header: the workspace and working tools. Footer: grouped product, method and
development links. Account access: identity/security; the notebook is a tool,
not an account setting. Use explicit labels describing input or action. Do not
suggest cloud saving, verification or automated transcription where absent.

Before shipping, exercise real input, loading, errors, successful results,
export, notebook continuity and both account states. Inspect screenshots at
390, 834 and 1440px, check for overflow and contrast, and compare sibling pages.
Run verify, production build and browser:smoke. Fix shared rendering behavior
upstream, release it and consume it under the fleet rollout policy. Never waive
a design gate to get a screenshot through; update a changed contract with the
user-visible rationale and a regression check.
