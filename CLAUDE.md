# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The parent file `../CLAUDE.md` already documents the high-level architecture, module convention, response envelope, ESM `.js` import rule, external-id pattern, and domain model. Read it first. This file only adds backend-local specifics.

## Lint & style enforcement quirks

- `console.log` is **banned** — ESLint allows only `console.info` and `console.error` (see `eslint.config.js`). Use `console.info` for general logs.
- `@typescript-eslint/no-explicit-any` is **off** — `any` is permitted (used throughout, e.g. `error as IAPIErrorResponse`).
- Prettier: `printWidth: 120`, `singleQuote: true`, `trailingComma: 'all'`, `tabWidth: 2`, `semi: true`. Run `npm run lint-and-fix` before every commit.

## Route param naming

Path params are always `<entity>ExternalId` (UUIDs), never `id` and never the internal numeric `id`. Examples already in the codebase: `studentExternalId`, `classExternalId`, `studentScoreExternalId`. Validation schemas use `z.uuid(...)` to enforce this. New routes must follow the same naming.

## Module imports

Always import a module's siblings (controller, service, validation, messages, types, routes) via its `./index.js` barrel — never reach into individual files:

```ts
// good
import { StudentController, StudentValidation } from './index.js';

// bad
import StudentController from './student.controller.js';
```

When adding a new module, mirror `src/modules/student/index.ts` exactly so external mounts keep working.

## Prisma client

The generated client lives at `src/generated/prisma/` and is **gitignored**. After a fresh clone, after pulling schema changes, or after editing `prisma/schema.prisma`, run:

```bash
npx prisma generate
```

The full migration workflow (format → migrate dev → generate) is in `README.md`.

## Adding a new resource

There is no central route registry beyond `src/app.ts`. When you add a new module:

1. Create `src/modules/<name>/` with the five-file pattern + `index.ts` barrel (see parent CLAUDE.md).
2. Import its routes in `src/app.ts` and `app.use(<BASE + '/<name>'>, <Name>Routes)` — without this step the module is invisible to Express.

## Pre-commit checklist

- `npm run lint-and-fix` (runs Prettier write + ESLint --fix).
- If `prisma/schema.prisma` changed: `npx prisma migrate dev --name <descriptive_name>` and `npx prisma generate`.
