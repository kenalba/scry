# Scry

The customized Element Call frontend for https://scry.wzrdz.cool.
Based on upstream Element Call v0.26.0, commit71593f1a245b1afa971e3940596e1c500edf9548. Upstream history and licensing are retained.

Scry adds the wzrdz visual theme, shared sign-in, member-only circle creation UI, guest invitation handling, personalized circle names, and accessible starfield motion. Server-side creation permissions are enforced separately by Synapse; this repository does not contain server credentials or private configuration.

Release tags identify deployed customized source. The app footer links to its release tag; /scry-source.tar.gz also remains available for downloadable corresponding source.

Use Node24 and the packageManager version pinned in package.json. Run corepack pnpm install --frozen-lockfile, corepack pnpm exec tsc, and VITE_PRODUCT_NAME=Scry corepack pnpm exec vite build. Upstream docs/ covers setup and development. The Scry-specific release workflow is documented in SCRY-UPGRADES.md.

Shared styling loads from https://wzrdz.cool/theme/v1/wzrdz.css. The theme-snapshot directory contains the source assets used by this release; the canonical working theme is maintained separately in wzrdz-infra/theme.
