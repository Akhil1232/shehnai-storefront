# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Shehnai — an Indian jewellery storefront. Next.js 15 App Router (React 19, RSC-first),
TypeScript strict, Prisma + PostgreSQL, Tailwind, Razorpay. Imports use `@/*` → `src/*`.

## Commands

```bash
npm run dev          # dev server on :3000
npm run build        # prisma generate && prisma migrate deploy && next build
npm run lint         # next lint (eslint-config-next)
npm run db:push      # sync schema without a migration — dev only
npm run db:migrate   # create a real migration (required once live)
npm run db:seed      # taxonomy + 14 products + homepage content; re-runnable
npm run db:studio    # Prisma Studio — the de facto admin panel until one is built
```

Nothing runs without `DATABASE_URL` (pooled) and `DIRECT_URL` (direct, for migrations)
in `.env`; copy `.env.example`. There is **no test framework** in this repo — verify
changes with `npm run lint` and `npx tsc --noEmit`.

`prisma/migrations/` does not exist yet (schema has only ever been `db:push`ed), so
`prisma migrate deploy` in the build is a no-op until the first `db:migrate`.

## Invariants that break things silently if violated

**1. Money is integer paise, everywhere.** `₹1,899` is `189900`. Never floats, never
rupees — DB columns, API bodies, and Razorpay all speak paise, so nothing converts at
the payment boundary. Display via `formatINR()` in `src/lib/money.ts`.

**2. Never write `ProductVariant.stockQty` directly.** Go through
`applyStockMovement()` in `src/lib/inventory.ts`, which writes a `StockMovement` ledger
row and the running total in one transaction. The ledger is the audit trail.

```
stockQty     physically on the shelf
reservedQty  promised to orders not yet shipped
available    stockQty - reservedQty      <- what the storefront shows
```

Lifecycle: `reserveStock()` at order creation → `commitReservation()` when payment
clears → `releaseReservation()` on failure/cancel. Every one of these accepts an
optional `tx` and must run inside the caller's transaction when there is one.

**3. The client cart is untrusted.** `src/store/cart.ts` (zustand + localStorage) holds
prices for display only. `/api/checkout/create` re-reads every price, coupon, and
shipping rule from the database; the browser payload contributes only variant ids and
quantities (clamped 1–20).

**4. Stock and price live on the variant, not the product.** Products with no real
options still get exactly one variant flagged `isDefault`.

## Payment flow

- `POST /api/checkout/create` — prices authoritatively, applies coupon + shipping,
  reserves stock and creates the `Order` in one transaction, then opens a Razorpay
  order. COD short-circuits to `CONFIRMED` with no charge.
- `POST /api/checkout/verify` — browser callback. `verifyPaymentSignature()` must pass
  before anything is marked paid. Idempotent: returns early if the webhook won first.
- `POST /api/webhooks/razorpay` — backstop for customers who close the tab. Reads the
  **raw** body (re-serialising JSON breaks the HMAC) and uses a *different* secret
  (`RAZORPAY_WEBHOOK_SECRET`) than payment signatures. Handles `payment.captured` →
  commit and `payment.failed` → release.

Both verify paths guard on current `paymentStatus`, so commits never double-apply.

## Content is data, not code

Most "make a change" requests are database edits, not code edits:

- `Vertical` / `Category` — taxonomy is rows; a fifth vertical needs no migration.
- `Banner` (`HOME_HERO`, `HOME_TRIPTYCH` ×3, `CATEGORY_HEADER`, `PROMO_STRIP`) — hero
  and category imagery, ordered by `sortOrder`.
- `HomeSection` — the homepage is composed from these rows (`EDITORIAL`, `STATEMENT`,
  `PRODUCT_RAIL`, `CATEGORY_TILES`, `REVIEWS`, `TRUST`, `NEWSLETTER`), with a `config`
  Json escape hatch for per-kind extras. Reorder via `sortOrder`, hide via `isActive`.
- `Setting` — announcement text, shipping threshold, COD toggle, support contacts. Read
  through `getSettings()` in `src/lib/settings.ts`, which merges DB rows over
  `DEFAULT_SETTINGS`; add a key there, no migration.

Storefront pages use `export const revalidate = 60`, so content edits appear within a
minute without a deploy. `order/[orderNumber]` is `force-dynamic`.

## Conventions

- **Query shapes** live in `src/types/catalog.ts` (`cardProductSelect`,
  `fullProductInclude`). Extend those rather than writing ad-hoc `select`/`include`
  blocks — the derived `CardProduct` / `FullProduct` types flow to every consumer.
- **Styling** is Tailwind plus a small component layer in `src/app/globals.css`:
  `.wrap`, `.section` (the single vertical-rhythm knob), `.eyebrow`, `.btn` +
  `.btn-ink`/`.btn-line`/`.btn-gold`, `.arch-frame`, `.scallop`, `.card-surface`,
  `.reveal`. Colours exist twice — as CSS variables in `:root` and as
  `tailwind.config.ts` values — keep them in sync. The `--jaali` lattice is a base64
  inline SVG at ~0.05 alpha and is meant to be near-invisible.
- **Server-first.** Pages are async server components querying Prisma directly; add
  `"use client"` only for interactivity (cart, filters, gallery, reveal).
- **API routes** that touch Prisma/crypto set `export const runtime = "nodejs"`.
- **Order snapshots**: `OrderItem` denormalises product name, sku, and image so old
  invoices survive renames; `Order.shippingAddress` is a Json snapshot.
- **Identifiers** come from `src/lib/slug.ts`: `SHN-MEN-BRC-0042` skus,
  `SHN-DDMM-0031` order numbers.
- Image hosts must be added to `next.config.ts` `images.remotePatterns` or images 404.

## Not built yet

Admin panel (schema is ready — `AdminUser` with roles, every content model editable),
CSV import/export, order emails, search, wishlist, customer accounts. There is also no
cron releasing reservations on stale PENDING orders, so abandoned checkouts hold stock
until cleared by hand.

`reference-design.html` (2.8 MB) is a dead visual prototype — not part of the build,
never import from it.

See `README.md` for the change-recipes table and image-size spec, `DEPLOYMENT.md` for
Vercel/Neon/Cloudinary/Razorpay setup and the go-live checklist.
