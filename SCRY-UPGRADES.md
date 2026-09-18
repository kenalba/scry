# Building and updating Scry

Release tags identify the exact frontend source deployed to Scry. Upstream is https://github.com/element-hq/element-call, initially v0.26.0 at71593f1a245b1afa971e3940596e1c500edf9548.

## Build a release

Use Node24 with Corepack:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm exec tsc
corepack pnpm exec vitest run --project unit src/auth/scrySsoState.test.ts src/auth/scrySsoBootstrap.test.ts src/auth/scrySso.test.ts src/auth/useScryMembership.test.tsx src/auth/LoginPage.test.tsx src/scry/starGeometry.test.ts src/scry/StarfieldScene.test.tsx
VITE_PRODUCT_NAME=Scry corepack pnpm exec vite build
```

Configure your own public Matrix/LiveKit endpoints following docs/self_hosting.md. The production backend's private settings and credentials are intentionally absent. Shared visual assets are distributed in theme-snapshot for this release; production references the compatible https://wzrdz.cool/theme/v1/ assets.

## Upgrade

Select an explicit upstream release and commit, review its backend compatibility requirements, and integrate it on a separate branch. Preserve Scry authentication, invitation fragments, member presentation, standalone/widget behavior, and source attribution. Run the checks above and the new upstream version's applicable checks. Verify member and guest flows, mobile error wrapping, circle-name defaults, pause/reduced-motion behavior, and Settle transitions in a preview deployment.

Set the footer source URL to the new release tag before building. Publish the matching commit/tag, retain licenses, and package exact source alongside each build. Scry's operational deployment scripts live in the separate wzrdz-infra workspace: they validate checksums, retain old hashed assets for open calls, and switch the frontend symlink atomically. Backend upgrades are separate. Keep prior releases for rollback.
