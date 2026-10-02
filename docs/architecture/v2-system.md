# HotelsVendors V2 System

The V2 application is deliberately isolated from the legacy route tree. The previous application is retained in Git history for rollback/reference but is not part of the V2 build graph.

## Runtime

- Next.js App Router / standalone build
- Clerk authentication
- Neon PostgreSQL via Prisma
- Server-side tenant resolution from verified Clerk identity + persisted User record
- V2 API namespace: `/api/v2/*`
- UI namespace: marketing routes plus authenticated workspace routes

## Core flow

`Evidence → Opportunity → Authorized Action → Outcome → Audit/Revenue evidence`

## V2 release principle

The V2 build must compile with TypeScript enabled and must not depend on legacy UI modules, stale API handlers or synthetic catalog data.

Legacy code is not deleted from history; it is moved outside the active Next.js application so it cannot silently contaminate the production build.
