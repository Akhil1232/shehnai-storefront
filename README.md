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

## Storefront design — how the styling works

**Everything is Tailwind. There are no component CSS classes.**

That is a deliberate rule, and it exists because breaking it broke the site
once already. The previous build kept a stylesheet of component classes
(`.pcard`, `.btn`, `.ico-btn`…) *after* `@tailwind utilities`. Same specificity,
later in the file — so every component class silently beat every Tailwind
utility. `className="ico-btn lg:hidden"` never hid anything, and the mobile
menu button rendered on top of the desktop nav.

### Where things live

| File | Holds |
|---|---|
| `tailwind.config.ts` | **The single source of truth.** Colours, fonts, breakpoints, radii, shadows, spacing, z-index layers. |
| `src/lib/styles.ts` | Named class recipes (`btn.primary`, `wrap`, `input`, `card`). Plain strings, so per-use utilities still win. |
| `src/app/globals.css` | ~90 lines. CSS variables, base element defaults, the body background. **No component classes.** |

To retheme the site, edit `colors` in `tailwind.config.ts`. To change how every
button looks, edit `btn` in `styles.ts`. Nothing else needs touching.

### Two rules that keep it from tangling

**1. Never add a component class to `globals.css`.** If a rule would beat a
utility, it belongs in a component's `className` instead.

**1b. Tune the page texture with one number.** The jaali lattice is painted by
`body::before` as a fixed layer behind all content. Its strength is
`--texture` in `globals.css`, currently **0.06**.

The number is measured, not guessed — it is how far a pattern line drifts from
the page colour in RGB:

| `--texture` | drift | reads as |
|---|---|---|
| 0.13 | 20 | too busy — an earlier build shipped this and the type suffered |
| 0.08 | 12 | strongest value still comfortable under body copy |
| **0.06** | **9** | **current — texture clearly present, type stays clean** |
| 0.04 | 6 | nearly invisible |

Past 0.08 the copy starts to fight the background. The layer is `z-index: -1`
and `pointer-events: none`, so it sits under everything and never blocks a
click. `html` carries the gradient rather than `body`, which is what lets the
negative layer paint above it.

**2. Never guess a z-index.** The layers are named and ordered in the config:

```
bar (30) < header (40) < buybar (45) < tabbar (50) < backdrop (60) < panel (70) < toast (80)
```

Use `z-panel`, not `z-[70]`. The floating buy bar is anchored at
`bottom-tabbar` so it sits *above* the mobile tab bar rather than under it, and
the footer carries `pb-tabbar` so the tab bar never covers the last row of
links.

### Verifying before you ship

```bash
npm run verify        # tokens + logic + typecheck
npm run preflight     # the above, plus a real `next build`
```

**Run `npm run preflight` before every deploy.** It reproduces exactly what the
hosting build does, so type errors surface in seconds locally instead of after a
two-minute cloud build.

`verify` runs `prisma generate` before `tsc`, because TypeScript cannot check
any Prisma call until the client has been generated — on a fresh checkout,
skipping that step makes the typecheck fail for the wrong reasons.

`npm run check:classes` is the important one. Tailwind fails **silently**: a
typo like `text-marron`, an undefined layer like `z-9999`, or an off-scale
value like `gap-99` all produce no CSS and no error — the page just looks
wrong. The checker reads `tailwind.config.ts` and fails the build if any token
in a `className` does not resolve.

`npm run check:logic` covers the non-visual behaviour: money conversion,
price-band parsing, shipping thresholds, checkout validation, cart maths, and
that the z-index layers still ascend.

### The flow

Deliberately conventional — the patterns Indian shoppers already know:

- **Search everywhere.** Persistent bar on desktop, full-screen overlay on
  mobile, live suggestions from `/api/search`.
- **Bottom tab bar on mobile** — Home / Shop / Search / Saved / Bag.
- **Breadcrumbs** on every listing and product page.
- **One component per job at every width.** Category cards reflow 2-up to 4-up
  rather than becoming a different component.
- **Filters update in place** via URL search params — checkboxes with live
  counts, removable chips, bottom sheet on mobile.
- **PDP** collapses long copy into accordions and floats a buy bar once the
  main button scrolls away.
- **Step bar** (Bag → Address & Payment → Done) on cart, checkout and
  confirmation.
- **Every dead end has an exit** — empty bag, empty wishlist, no search
  results, no filter matches, 404.

### Product imagery

`ProductMedia` decides how every product is pictured: the uploaded photograph
if there is one, otherwise a generated SVG concept render from
`src/components/ui/JewelArt.tsx`, chosen deterministically from the category.

This is why the seed ships **no image URLs** — a fresh install looks like one
coherent catalogue instead of a wall of broken placeholders, and the client can
add products before the photoshoot. Upload a real photo from the admin and it
takes over automatically.

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
