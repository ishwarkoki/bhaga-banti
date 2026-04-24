# AGENTS.md

## Purpose

This repository is a TypeScript backend for `Bhaga-Banti`, a Splitwise-style expense sharing service with Better Auth, Express-style controllers, Drizzle ORM, PostgreSQL, email notifications, and Swagger annotations.

This file is for coding agents and contributors who need to work safely inside the repo without guessing about structure or wiring.

## Current State At A Glance

- The codebase contains domain logic for groups, expenses, balances, invites, settlements, auth, email, and DB schema.
- The checked-in repository does **not** currently include `src/app.ts`, even though `package.json` references it in `dev` and `start`.
- There is **no checked-in route registration layer** under `src/routes`; the folder exists but is empty.
- Controllers exist for:
  - groups
  - expenses
  - balances
- Services exist for:
  - groups
  - expenses
  - balances
  - invites
  - settlements
  - email
- Swagger annotations are attached directly to controllers.
- Better Auth is configured, but the HTTP auth mount point is not visible in this snapshot because the app entrypoint is missing.

## High-Confidence Architecture

Request flow is intended to look like this:

1. Express app entrypoint mounts middleware and routes.
2. Route handlers call controller methods.
3. Controllers validate request data with Zod and authorize against `req.user`.
4. Services contain most business logic and DB access.
5. Drizzle schema modules define the PostgreSQL tables and relations.
6. Shared helpers live under `src/utils`.

Relevant directories:

- `src/controllers`
  - HTTP-facing handler layer
  - Swagger docs live here
- `src/services`
  - business logic and DB orchestration
- `src/config`
  - auth, database, email, swagger
- `src/middleware`
  - auth, errors, validation, rate limiting
- `src/db/schema`
  - Drizzle table definitions and relations
- `src/utils`
  - validators, constants, calculations, helpers

## What Is Actually Public Today

From the checked-in code, the public API surface that is clearly implemented is the controller layer:

- `src/controllers/groups.controller.ts`
- `src/controllers/expenses.controller.ts`
- `src/controllers/balances.controller.ts`

Those files define the intended HTTP endpoints. However, because route registration and `src/app.ts` are missing, you should treat them as the **intended exposed API**, not guaranteed running endpoints in the current snapshot.

Service-only features that are implemented but not exposed by checked-in controllers:

- invitation lifecycle
- settlement lifecycle
- email notifications

## Main Domain Model

Core entities:

- `users`
  - app users with Better Auth-aligned fields plus `phone`, `preferredLanguage`, `timezone`, `upiId`
- `groups`
  - expense-sharing container
- `groupMembers`
  - membership with `admin` or `member` role
- `expenses`
  - a payment made in a group
- `expenseSplits`
  - per-user share of an expense
- `settlements`
  - money paid from one member to another to settle balances
- `invitations`
  - tokenized group invite flow

## Important Structural Hazards

### 1. Missing runtime entrypoint

`package.json` references `src/app.ts`, but that file is absent. Any task involving booting the server, route wiring, Better Auth mounting, Swagger UI mounting, or middleware order will need either:

- a newly created `src/app.ts`, or
- confirmation that the file exists elsewhere and was omitted from this snapshot

### 2. Empty `src/routes`

Swagger is configured to scan `./src/routes/*.ts` and `./src/controllers/*.ts`, but route files are not present. If you add routing, keep docs synchronized with controllers and mount points.

### 3. Duplicate / conflicting schema definitions

There are overlapping schema definitions across multiple files:

- `src/db/schema/groups.ts` defines both `groups` and `groupMembers`
- `src/db/schema/groupMembers.ts` also defines `groupMembers`
- `src/db/schema/expenses.ts` defines both `expenses` and `expenseSplits`
- `src/db/schema/expenseSplits.ts` also defines `expenseSplits`

These are not identical:

- table names differ in places
- id lengths differ (`36` vs `255`)
- timestamps differ (`withTimezone` vs not)
- one version includes extra fields like `shares`

Before changing DB logic, first determine which table definitions are meant to be canonical. Do not casually update only one side of a duplicated schema.

### 4. Mixed import style in schema files

Some schema files import siblings with `.js`, others without extensions. Because the project uses ESM (`"type": "module"`), be cautious when normalizing imports.

### 5. Service/controller exposure mismatch

`InviteService` and `SettlementService` appear production-intended, but there are no checked-in controllers or routes exposing them. If you implement new API endpoints, prefer matching the existing controller style.

## Conventions Already In Use

### Validation

- Zod lives in `src/utils/validators.ts`
- Controllers mostly call `schema.parse(...)` inline
- Validation middleware exists in `src/middleware/validation.ts`, but current controllers do not rely on it much

### Error handling

- Use `AppError` from `src/middleware/error.ts`
- Wrap async controllers with `asyncHandler`
- Errors return JSON with `success: false`
- Messages are often bilingual English + Odia

### Auth

- `requireAuth` resolves Better Auth session and populates:
  - `req.user`
  - `req.session`
- Controller methods usually still guard `if (!req.user)` explicitly

### Response shape

Most success responses follow:

```json
{
  "success": true,
  "data": {},
  "message": "optional"
}
```

Pagination responses usually return:

```json
{
  "success": true,
  "data": {
    "items_or_domain_key": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

### Authorization pattern

The recurring service checks are:

- membership check through `GroupService.isGroupMember`
- admin check via `groupMembers.role === 'admin'`
- payer-or-admin check for editing/deleting expenses

## File Guide

### Controllers

- [src/controllers/groups.controller.ts](/Users/iswarkokkili/Desktop/Projects/bhaga-banti/src/controllers/groups.controller.ts)
  - create, list, read, update, delete groups
  - list/add/remove members
- [src/controllers/expenses.controller.ts](/Users/iswarkokkili/Desktop/Projects/bhaga-banti/src/controllers/expenses.controller.ts)
  - create, list, read, update, delete expenses
- [src/controllers/balances.controller.ts](/Users/iswarkokkili/Desktop/Projects/bhaga-banti/src/controllers/balances.controller.ts)
  - group balances, simplified debts, user total balance

### Services

- [src/services/group.service.ts](/Users/iswarkokkili/Desktop/Projects/bhaga-banti/src/services/group.service.ts)
  - group CRUD and membership checks
- [src/services/expense.service.ts](/Users/iswarkokkili/Desktop/Projects/bhaga-banti/src/services/expense.service.ts)
  - expense CRUD, split validation, balance calculation
- [src/services/balance.service.ts](/Users/iswarkokkili/Desktop/Projects/bhaga-banti/src/services/balance.service.ts)
  - balance projection and debt simplification
- [src/services/invite.service.ts](/Users/iswarkokkili/Desktop/Projects/bhaga-banti/src/services/invite.service.ts)
  - invite creation, validation, acceptance, revocation
- [src/services/settlement.service.ts](/Users/iswarkokkili/Desktop/Projects/bhaga-banti/src/services/settlement.service.ts)
  - settlement creation, listing, deletion
- [src/services/email.service.ts](/Users/iswarkokkili/Desktop/Projects/bhaga-banti/src/services/email.service.ts)
  - notification fan-out

### Infrastructure

- [src/config/auth.ts](/Users/iswarkokkili/Desktop/Projects/bhaga-banti/src/config/auth.ts)
  - Better Auth setup with Google OAuth
- [src/config/database.ts](/Users/iswarkokkili/Desktop/Projects/bhaga-banti/src/config/database.ts)
  - Drizzle + Postgres pool
- [src/config/email.ts](/Users/iswarkokkili/Desktop/Projects/bhaga-banti/src/config/email.ts)
  - Nodemailer transport and templates
- [src/config/swagger.ts](/Users/iswarkokkili/Desktop/Projects/bhaga-banti/src/config/swagger.ts)
  - OpenAPI base spec and shared schemas

## Environment Expectations

The repo expects at least:

- `PORT`
- `NODE_ENV`
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- `FRONTEND_URL`

Reference file:

- [.env.example](/Users/iswarkokkili/Desktop/Projects/bhaga-banti/.env.example)

## Commands

From `package.json`:

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm lint`
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:push`
- `pnpm db:studio`
- `pnpm auth:generate`
- `pnpm auth:migrate`

Note: `dev` and `start` currently depend on the missing `src/app.ts`.

## Working Rules For Agents

### When changing API behavior

- Update the controller Swagger block and the README API docs together.
- Keep response envelopes consistent.
- Preserve auth checks and role checks unless the task explicitly changes authorization.

### When changing DB schema

- Inspect **all** schema files under `src/db/schema` first.
- Decide whether you are consolidating duplicate schemas or only updating the canonical one.
- If you cannot confidently determine canonical ownership, stop and document the ambiguity in your change notes.

### When adding routes

- Prefer a dedicated route module per domain in `src/routes`
- Mount `requireAuth` at route level where possible
- Keep controllers thin and services stateful/business-oriented

### When touching auth

- Preserve Better Auth as the source of truth for session resolution.
- Be careful with cookie names and mounted auth base path.
- Document any mounted auth endpoints in `README.md`.

### When touching balances

- The business-critical logic lives in:
  - `ExpenseService.calculateGroupBalances`
  - `BalanceService.getGroupBalances`
  - `BalanceService.getSimplifiedDebts`
  - `src/utils/calculations.ts`
- Re-check rounding behavior and settlement adjustments after any change.

### When touching notifications

- Email sending is best-effort in several flows and often intentionally not awaited.
- Preserve non-blocking behavior unless the task explicitly requires stronger delivery guarantees.

## Known Gaps To Keep In Mind

- Missing application entrypoint
- Missing route registration
- Missing controller exposure for invites and settlements
- No checked-in tests
- Duplicate schema definitions increase migration risk
- Swagger likely cannot represent the true live API until route mounting exists

## Recommended Next Steps For Future Agents

If the user asks for productization or completion work, the safest order is:

1. Reconstruct `src/app.ts`
2. Add route modules under `src/routes`
3. Decide canonical schema files and remove duplication
4. Expose invite and settlement APIs if intended
5. Add smoke tests for auth, groups, expenses, balances
6. Verify Swagger UI matches mounted routes

## Documentation Source Of Truth

Use the code as source of truth in this priority order:

1. controllers for intended HTTP behavior
2. services for actual domain rules
3. validators for input contracts
4. schema files for persistence model, with duplication caveat
5. swagger config for shared OpenAPI component shapes

If any of those disagree, document the disagreement instead of silently picking one.
