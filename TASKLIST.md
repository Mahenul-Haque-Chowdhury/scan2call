# Upgrade Task List

This plan is designed to upgrade the stack in controlled phases while protecting the current website, API, database workflow, and deployment path.

## Rules

- Do not combine multiple major upgrades in one commit.
- Validate each phase before starting the next phase.
- Keep production deploy green after every pushed phase.
- If a phase fails validation, stop, fix locally, and rerun that same validation before moving on.
- Prefer lockfile-driven installs so local and CI stay aligned.

## Why Freeze The Baseline

Yes, freezing the baseline is important.

It gives you a known-good restore point before changing the runtime, framework, and toolchain. Without that, when something breaks you cannot tell whether the cause is Node, Next.js, NestJS, Prisma, TypeScript, or CI/runtime drift.

The baseline freeze should include:

- A clean `master` or upgrade branch starting point.
- A recorded successful build, lint, and test result from the current stack.
- A git tag or at least a clearly named commit that represents the pre-upgrade state.
- A short smoke test checklist for the critical user flows.

Recommended baseline tag name:

- `pre-upgrade-baseline`

## Phase 0: Freeze Baseline

Goal: establish a reversible starting point.

Baseline run recorded on 2026-05-01:

- `pnpm install --frozen-lockfile`: passed
- `pnpm db:generate`: passed
- `pnpm -w build`: failed locally on Windows during Next.js standalone trace copy with `EPERM` symlink errors in `apps/web/.next/standalone`
- `pnpm -w lint`: passed
- `pnpm -w test`: passed
- Current baseline commit before further upgrade work: `22061a8`

Known accepted baseline note:

- The current local Windows build issue is environment-specific standalone tracing behavior, not a TypeScript/app-code build break. CI/Linux remains the authority for full web build validation.

Tasks:

- Confirm working tree is clean.
- Run and record:
  - `pnpm install --frozen-lockfile`
  - `pnpm db:generate`
  - `pnpm -w build`
  - `pnpm -w lint`
  - `pnpm -w test`
- Run manual smoke tests for current critical flows:
  - login
  - register
  - forgot/reset password
  - tag activation
  - public scan page
  - finder-to-owner messaging
  - redeem gifts
  - admin pages used in production
- Create a git tag for the current known-good state.
- Save notes on any existing failures that are already known and accepted.

Exit criteria:

- Current stack behavior is documented.
- There is a known-good commit/tag to roll back to.

## Phase 1: Runtime Alignment

Goal: upgrade Node and pnpm consistently across local, CI, and Docker without changing app behavior.

Targets:

- Node.js: latest stable LTS/current chosen for repo standardization
- pnpm: latest stable major compatible with Node target

Files likely to change:

- `package.json`
- `.github/workflows/ci.yml`
- `docker/Dockerfile.web`
- `docker/Dockerfile.api`

Tasks:

- Update root `engines.node`.
- Update root `packageManager`.
- Update CI node version.
- Update Docker base images.
- Reinstall dependencies and regenerate lockfile intentionally.

Validation:

- `pnpm install`
- `pnpm db:generate`
- `pnpm -w build`
- `pnpm -w lint`
- `pnpm -w test`
- Build Docker images locally if possible.

Exit criteria:

- Local, CI, and Docker all use the same Node major.
- No behavior changes beyond runtime alignment.

## Phase 2: Web Stack Upgrade

Goal: move the frontend to the latest supported Next.js stack with minimal behavior regression.

Targets:

- Next.js latest stable
- React latest stable supported by Next.js
- React DOM latest stable supported by Next.js
- `eslint-config-next` matching Next.js version

Files likely to change:

- `apps/web/package.json`
- `apps/web/next.config.js`
- `apps/web/next-env.d.ts`
- app routes and cache/revalidation code where required

Tasks:

- Upgrade Next.js and matching frontend tooling.
- Reinstall and refresh generated Next typing artifacts.
- Fix breaking API changes in route handlers and revalidation calls.
- Check image handling, cache APIs, route typing, and build output behavior.

Validation:

- `pnpm --filter @scan2call/web build`
- `pnpm --filter @scan2call/web lint`
- smoke test login, dashboard, tags, scan flow, store, checkout pages

Exit criteria:

- Web app builds in CI/Linux with the upgraded Next.js version.
- Existing frontend flows still work.

## Phase 3: API Stack Upgrade

Goal: upgrade NestJS and API-side tooling with no endpoint regressions.

Targets:

- NestJS latest stable compatible major
- Swagger/testing/throttler packages aligned with Nest major
- TypeScript and ESLint tooling aligned with repo standard

Files likely to change:

- `apps/api/package.json`
- Nest config files if required
- test config where required

Tasks:

- Upgrade Nest core packages together.
- Upgrade testing and CLI packages together.
- Fix any decorators, bootstrap, validation, or Swagger integration issues.
- Confirm auth, file upload, QR, payments, and notifications still compile.

Validation:

- `pnpm --filter @scan2call/api build`
- `pnpm --filter @scan2call/api test`
- API smoke tests for auth, tags, scans, gifts, admin, orders

Exit criteria:

- API builds and boots cleanly.
- Existing endpoints preserve expected behavior.

## Phase 4: Shared Tooling And Type System

Goal: modernize repo-wide tooling without introducing drift between packages.

Targets:

- TypeScript latest stable supported by web and api stack
- ESLint ecosystem latest compatible stable
- repo-level shared tools aligned across packages

Files likely to change:

- root and package `package.json` files
- eslint config files
- tsconfig files

Tasks:

- Upgrade TypeScript deliberately after framework upgrades are stable.
- Upgrade eslint-related packages in one pass.
- Resolve any new strictness or config incompatibilities.

Validation:

- `pnpm -w build`
- `pnpm -w lint`
- focused checks for any touched package

Exit criteria:

- Tooling versions are aligned across the monorepo.
- No local/CI mismatch remains.

## Phase 5: Prisma Upgrade

Goal: upgrade Prisma safely because it affects codegen, runtime behavior, and deployment.

Targets:

- `prisma` latest stable
- `@prisma/client` matching version

Files likely to change:

- root `package.json`
- `apps/api/package.json` if needed
- generated Prisma client artifacts and possibly migration workflow assumptions

Tasks:

- Upgrade Prisma packages together.
- Regenerate client.
- Verify schema compatibility.
- Validate `migrate deploy` path used in production script.

Validation:

- `pnpm db:generate`
- `pnpm --filter @scan2call/api build`
- local migration command dry run where safe
- production deploy script review

Exit criteria:

- Prisma generate/build/deploy path works end to end.

## Phase 6: CI And Deployment Hardening

Goal: ensure upgraded stack is reproducible in GitHub Actions and Docker deployment.

Files likely to change:

- `.github/workflows/ci.yml`
- `.github/workflows/deploy-production.yml`
- `scripts/deploy-production.sh`
- Dockerfiles if further adjustment is needed

Tasks:

- Update GitHub action versions to Node 24-compatible releases.
- Ensure CI uses the same Node and pnpm versions as local and Docker.
- Verify deploy scripts do not rely on outdated package manager/runtime assumptions.

Validation:

- CI passes on push.
- production image build succeeds.
- deploy workflow remains green.

Exit criteria:

- Same stack version is used consistently everywhere.

## Phase 7: Final Regression Pass

Goal: verify the product still works as a product, not just as a build.

Automated checks completed 2026-05-02:

- `pnpm build`: all 3 packages (shared, api, web) build clean
- `pnpm lint`: all 4 lint tasks pass with zero errors
- `pnpm test`: all tests pass
- `pnpm db:generate`: Prisma 7 client generates without DATABASE_URL

Manual regression checklist (requires running environment):

- homepage and marketing pages load
- login/register/reset flows work
- dashboard loads for existing user
- tag list and tag details work
- QR scan public flow works
- inactive tag flow still blocks correctly
- redeem gifts works
- store, cart, checkout, and success pages work
- admin analytics/orders/products/users pages load

Exit criteria:

- No critical regression in production flows.

## Rollback Strategy

- If a phase introduces failures, stop at that phase.
- Revert only the current phase commit(s), not unrelated working changes.
- Rebuild and confirm the previous phase remains green.
- Use the baseline tag if rollback needs to be immediate and broad.

## Execution Order

1. Freeze baseline
2. Runtime alignment
3. Web stack upgrade
4. API stack upgrade
5. Shared tooling and TypeScript alignment
6. Prisma upgrade
7. CI and deployment hardening
8. Final regression pass

## Important Constraint

No one can honestly guarantee a zero-error major-stack upgrade up front.

What can be done is reduce risk sharply by:

- isolating phases
- validating after each phase
- keeping rollback easy
- not mixing framework, runtime, and database tooling changes together

That is the safest way to upgrade without breaking existing website and API functionality.