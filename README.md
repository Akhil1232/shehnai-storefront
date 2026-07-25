# Shehnai® — Storefront

Next.js 15 (App Router) · TypeScript · Prisma · PostgreSQL · Tailwind · Razorpay

---

## Quick start

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL at minimum
npm run db:push               # create the tables
npm run db:seed               # taxonomy + 14 products + homepage content
npm run dev                   # http://localhost:3000
```

You need a Postgres URL before anything works. The fastest free option is
[Neon](https://neon.tech) — create a project, copy both the pooled and direct
connection strings into `DATABASE_URL` and `DIRECT_URL`.

---

## Where things live

```
prisma/
  schema.prisma          THE data model. Every table, every field. Start here.
  seed.ts                Starter content. Re-runnable.

src/
  app/
    layout.tsx           Shell: fonts, header, footer, cart drawer
    page.tsx             Homepage — composes sections read from the database
    globals.css          Design tokens (colours, jaali, arch frame, buttons)
    collections/[vertical]/   Listing page with filters
    product/[slug]/           Product detail page
    cart/  checkout/  order/[orderNumber]/
    api/
      checkout/create    Builds the order, reserves stock, opens Razorpay
      checkout/verify    Confirms the signature, commits stock
      webhooks/razorpay  Backstop when the customer closes the tab
      newsletter

  lib/
    prisma.ts            Database client (singleton)
    money.ts             ALL money is integer paise. Read this file first.
    inventory.ts         The only safe way to change stock. Read this too.
    razorpay.ts          Signature verification
    settings.ts          Site config stored in the DB, not in code
    slug.ts              SKU + order number formats

  components/            Grouped by area: layout / home / product / collection / ui
  store/cart.ts          Client cart (localStorage). Display prices only.
  types/catalog.ts       Shared Prisma query shapes — change a shape once, here
```

---

## Two rules that keep this from breaking

**1. Money is always integer paise.**
`₹1,899` is stored as `189900`. Never a float, never rupees. Razorpay speaks
paise too, so nothing converts at the payment boundary. Display with
`formatINR()` from `lib/money.ts`.

**2. Never write `stockQty` directly.**
Always call `applyStockMovement()` from `lib/inventory.ts`. It writes a ledger
row and updates the running total inside one transaction. The ledger is what
lets you answer "why does the system think we have 3 when the drawer has 5?"
six months from now.

```
stockQty     units physically on the shelf
reservedQty  units promised to orders not yet shipped
available    stockQty - reservedQty      <- what the storefront shows
```

The lifecycle: `reserveStock()` at checkout → `commitReservation()` when payment
clears → `releaseReservation()` if it fails or is cancelled. This is what stops
two people buying the same one-of-a-kind piece during a festival rush.

---

## How to change common things

| I want to… | Do this |
|---|---|
| Change a colour | `src/app/globals.css`, `:root` block. Tailwind classes follow. |
| Make the background pattern stronger/weaker | `--jaali` in `globals.css` — it's an inline SVG, edit the `opacity` values inside it. Currently ~0.05, deliberately near-invisible. |
| Change spacing between sections | The `.section` class in `globals.css`. One number, whole site. |
| Add a field to products | Add to `Product` in `schema.prisma` → `npm run db:migrate` → use it. |
| Add a new vertical | It's a database row, not code. Insert into `Vertical`. |
| Reorder the homepage | `HomeSection.sortOrder`. No deploy. |
| Move Murti to the centre of the hero | `Banner.sortOrder = 1` on that panel. Position 1 of 3 is the centre. |
| Change announcement text / shipping threshold | `Setting` table, read via `lib/settings.ts`. |
| Add a payment method | `PaymentMethod` enum + a branch in `api/checkout/create`. |

---

## Image sizes

The admin panel will show these inline on each upload field. Until then:

| Slot | Size | Ratio | Notes |
|---|---|---|---|
| Home hero banner (desktop) | 2400 × 1000 | 2.4:1 | Subject right-of-centre |
| Home hero banner (mobile) | 1080 × 1350 | 4:5 | Separate crop |
| Hero triptych panel | 900 × 1200 | 3:4 | Top ~30% is masked by the arch — keep empty |
| Category header | 1920 × 640 | 3:1 | One per vertical |
| Product image | 2000 × 2000 | 1:1 | Min 1200×1200 for zoom. 4–6 per SKU |
| Editorial main | 1200 × 1500 | 4:5 | |
| Editorial mini | 800 × 800 | 1:1 | Two per block |
| Logo | SVG or 800 × 260 | — | Transparent PNG |
| Social share (OG) | 1200 × 630 | 1.91:1 | |

WebP preferred, under 250 KB each. Upload at full size — Cloudinary and
`next/image` derive every smaller size automatically.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run db:push` | Sync schema without a migration (dev only) |
| `npm run db:migrate` | Create a proper migration (use this once live) |
| `npm run db:studio` | Browse/edit the database in a GUI — a stopgap admin panel |
| `npm run db:seed` | Load starter content |
| `npm run build` | Generates client, runs migrations, builds |

`npm run db:studio` is worth knowing: it gives you a working table editor for
products, stock and banners today, before the real admin panel exists.

---

## Not built yet

- **Admin panel** — the schema is fully ready for it (`AdminUser` with roles,
  every content model editable). This is the next piece.
- **CSV import/export** for bulk product and stock updates. Essential before
  you load 300 SKUs by hand.
- Order emails, search, wishlist, customer accounts, policy page content.

See `DEPLOYMENT.md` to put this online.

---

`reference-design.html` is the previous single-file prototype, kept for visual
reference only. It is not part of the build.
