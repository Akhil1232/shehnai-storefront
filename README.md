# Shehnai® — Storefront

Next.js 15 (App Router) · TypeScript · Prisma · PostgreSQL · Tailwind · Razorpay

---

## Quick start

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL at minimum
npm run db:push               # create the tables
npm run db:seed               # taxonomy + 14 products + homepage content
npm run admin:create -- you@shehnai.in "YourPassword123" "Your Name"
npm run dev                   # http://localhost:3000  ·  admin at /admin
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

| Logo | already in `public/logo.png` | 1.81:1 | Transparent PNG, 435 × 240 |

| Slot | Size | Ratio | Notes |
|---|---|---|---|
| Home hero banner (desktop) | 2400 × 1000 | 2.4:1 | Subject right-of-centre |
| Home hero banner (mobile) | 1080 × 1350 | 4:5 | Separate crop |
| Hero triptych panel | 900 × 1200 | 3:4 | Top ~30% is masked by the arch — keep empty |
| Category header | 1920 × 640 | 3:1 | One per vertical |
| Product image | 2000 × 2000 | 1:1 | Min 1200×1200 for zoom. 4–6 per SKU |
| Editorial main | 1200 × 1500 | 4:5 | |
| Editorial mini | 800 × 800 | 1:1 | Two per block |
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
| `npm run build` | Generates client, runs migrations, builds (managed platforms) |
| `npm run build:app` | Plain `next build` — used when self-hosting, where deploy.sh already migrated |
| `npm run admin:create` | Create or reset an admin login |

`npm run db:studio` is worth knowing: it gives you a working table editor for
products, stock and banners today, before the real admin panel exists.

---

## Admin panel — `/admin`

Sign in with the user created by `npm run admin:create`. Roles: OWNER, ADMIN,
STAFF (STAFF cannot delete products or change settings).

| Screen | What it does |
|---|---|
| Dashboard | 30-day revenue, orders awaiting dispatch, low-stock alerts, recent orders |
| Products | Search/filter, CSV export, full edit: spec sheet, SEO, status, badge |
| → variants | Per-SKU price, MRP, cost, low-stock threshold, reorder point, supplier |
| → images | Add, reorder, delete; required size shown on the field |
| Inventory | Live stock table, per-row adjust, movement ledger, bulk CSV stocktake |
| Orders | Filter by status, update fulfilment, carrier + tracking, CSV export |
| Banners | All placements with required dimensions shown inline |
| Home Sections | Edit "The Flagship Piece" / "The Bridal Edit" copy, product, images, order |
| Reviews | Publish / feature / delete |
| Settings | Announcement bar, shipping thresholds, COD toggle, contact details |

**Stock is only ever changed through the ledger.** Every adjustment writes a
`StockMovement` row with reason, note and who did it. Use "Set to" for a
stocktake — it records the correction rather than overwriting the number.

**Bulk stocktake at 300 SKUs:** Inventory → *Export for stocktake* → count on the
floor → paste `sku,counted_qty` rows back into the CSV box. Each becomes a
correcting movement, and unknown SKUs are reported rather than silently skipped.

---

## Mobile is a different layout, not a narrower one

Phones get less content and more whitespace on purpose:

| | Mobile | Desktop |
|---|---|---|
| Hero | Copy first, then **one** arch image | Three-panel triptych, then copy |
| Collections | Quiet list with hairline dividers | Four arch image tiles |
| Editorial | Single centred image | Main image + two mini thumbs |
| Category page | Typographic header, no banner | Full 3:1 banner |
| Trust strip | Words only | Icons + sub-copy |
| Product card | No badge tag or star row | Everything |
| Background | Scrolls with page, 120px tile | Fixed, 150px tile |

The rule of thumb: if an element is decorative rather than informative, it is
desktop-only. Search for `sm:hidden` and `max-sm:` to find every override.

---

## Not built yet

## Checkout flow

Deliberately short — two taps from a product page to the Razorpay modal:

```
Product page ──"Buy Now"──────────────► /checkout ──► Razorpay ──► /order/SHN-…
          └───"Add to Bag"──► drawer ──► /checkout ──► Razorpay ──► /order/SHN-…
```

There is no address step, no review step and no separate payment page. What
keeps it fast:

- **Buy Now** skips the bag entirely.
- **PIN code auto-fills city and state** via `api.postalpincode.in` — two fewer
  fields, and it catches typos before the parcel is packed.
- **The address is remembered** in `localStorage`, so a returning customer
  types nothing.
- **Order summary is collapsed** by default; quantity is editable inline, so
  nobody has to go back to the cart.
- **The pay button is pinned** to the bottom of the screen on mobile with the
  live total on it.

The `/cart` page still exists for people who want it, but it is no longer part
of the required path.

---

## Policy pages

Live at `/policies/shipping`, `/policies/returns`, `/policies/privacy` and
`/policies/terms`, with the text in `src/app/policies/[slug]/page.tsx`.

The stated policy is: **dispatch in 2–3 working days**, and **replacement only**
for damaged, wrong or missing items, with a **continuous unedited unboxing video
required** for every claim. No returns, no refunds.

Because that is a strict policy, it is stated *before* payment rather than
buried: on the product page under the buy box, in the cart drawer, on the cart
page, on the checkout screen, and again on the order confirmation as a reminder
to record the unboxing. All of it renders from one component —
`src/components/ui/PolicyNote.tsx` — so the wording only ever changes in one
place.

Razorpay will not activate an account until these four pages are live on the
domain.

---

## Not built yet

- Order confirmation emails (Resend or AWS SES)
- Product search, wishlist, customer accounts
- Policy page content (required before Razorpay activation)


To put this online:

- `DEPLOYMENT.md` — managed platform (Vercel + Supabase/Neon + Cloudinary)
- `DEPLOYMENT-VPS.md` — self-hosted on a single VPS, with scripts in `deploy/`

---

`reference-design.html` is the previous single-file prototype, kept for visual
reference only. It is not part of the build.
