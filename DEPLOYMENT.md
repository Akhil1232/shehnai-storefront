# Deployment

Target stack, chosen for zero server maintenance and a genuinely free start:

| Piece | Service | Cost to begin |
|---|---|---|
| Hosting | Vercel | Free (Hobby) |
| Database | Neon Postgres | Free (0.5 GB — plenty for 400 SKUs) |
| Images | Cloudinary | Free (25 GB bandwidth/mo) |
| Payments | Razorpay | 2% per transaction, no monthly fee |
| Domain | Any registrar | ~₹900/year |

Realistically ₹0/month until you have meaningful traffic, then ~₹1,700/month
when Vercel Pro becomes necessary.

---

## 1. Database (Neon)

1. Create an account at [neon.tech](https://neon.tech) → new project, region
   **AWS ap-southeast-1 (Singapore)** — closest to India.
2. From the dashboard copy two connection strings:
   - **Pooled** → `DATABASE_URL`
   - **Direct** → `DIRECT_URL`

Prisma needs both: the app runs through the pooler, migrations must not.

---

## 2. Images (Cloudinary)

1. Sign up at [cloudinary.com](https://cloudinary.com).
2. Dashboard → copy Cloud Name, API Key, API Secret into `.env`.
3. Settings → Upload → add an **unsigned upload preset** named `shehnai`
   (the admin panel will use it).

Upload originals at full size. Never resize by hand — request a size in the URL
and Cloudinary generates and caches it:

```
https://res.cloudinary.com/<cloud>/image/upload/w_800,h_800,c_fill,q_auto,f_auto/<public_id>
```

---

## 3. Razorpay

1. Sign up at [razorpay.com](https://razorpay.com) and complete KYC — allow
   2–4 working days. Keep using `rzp_test_*` keys meanwhile.
2. Settings → API Keys → generate. Note that `RAZORPAY_KEY_ID` goes in **twice**:
   once server-side and once as `NEXT_PUBLIC_RAZORPAY_KEY_ID` for the browser
   modal. Only the **secret** must never be prefixed with `NEXT_PUBLIC_`.
3. Settings → Webhooks → Add:
   - URL: `https://YOURDOMAIN/api/webhooks/razorpay`
   - Secret: any long random string, also set as `RAZORPAY_WEBHOOK_SECRET`
   - Events: `payment.captured`, `payment.failed`

The webhook is not optional. Without it, a customer who closes the tab straight
after paying leaves an order stuck as PENDING with stock still reserved.

---

## 4. Deploy

```bash
git init && git add -A && git commit -m "Shehnai storefront"
gh repo create shehnai-store --private --source=. --push
```

Then at [vercel.com/new](https://vercel.com/new): import the repo, and before
the first build add every variable from `.env.example` under
**Settings → Environment Variables**.

The build command already runs `prisma generate && prisma migrate deploy`, so
schema changes apply on deploy automatically.

Seed the production database once, from your machine:

```bash
DATABASE_URL="<neon-pooled>" DIRECT_URL="<neon-direct>" npm run db:seed
```

---

## 5. Domain

Vercel → Settings → Domains → add `shehnai.in`. At your registrar:

| Type | Name | Value |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

HTTPS is automatic. Propagation takes up to 24h, usually minutes.

Finally set `NEXT_PUBLIC_SITE_URL=https://shehnai.in` and redeploy, or OG tags
and Razorpay redirects will point at localhost.

---

## Going live — checklist

- [ ] Razorpay switched from test keys to live keys
- [ ] Webhook URL points at the real domain, secret matches
- [ ] One real ₹1 order placed end-to-end, then refunded
- [ ] Stock actually decremented after that order (check `StockMovement`)
- [ ] `NEXT_PUBLIC_SITE_URL` is the live domain
- [ ] Real product photos replacing the seed placeholders
- [ ] Policy pages written (shipping, returns, privacy, terms) — Razorpay
      requires these live before activating your account
- [ ] Neon backups enabled

---

## Common problems

**`prisma migrate` hangs or errors on Vercel** — you're using the pooled URL for
migrations. `DIRECT_URL` must be the direct connection.

**Images show as broken** — the hostname isn't in `next.config.ts` under
`images.remotePatterns`. Add it and redeploy.

**Payment succeeds but the order stays PENDING** — the webhook isn't firing.
Check Razorpay → Webhooks → delivery logs. Usually a secret mismatch.

**"Only N left" when stock looks fine** — abandoned checkouts left reservations
behind. Add a cron to release reservations on orders PENDING for over 30
minutes; until then clear them in `npm run db:studio`.
