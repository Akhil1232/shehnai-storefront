# Self-hosting on a VPS

The alternative to `DEPLOYMENT.md` (managed platforms). Everything runs on one
box: Next.js, PostgreSQL, Nginx.

For an India-facing store this is often the *better* option — a Mumbai or
Bangalore VPS beats Singapore-hosted managed Postgres on latency, and costs a
fraction of it.

---

## What you need

**A VPS with root access.** Not shared cPanel hosting — this is a long-running
Node process plus a real PostgreSQL server, and shared Node runtimes generally
cannot complete a `next build`.

| | Minimum | Comfortable |
|---|---|---|
| RAM | 2 GB (+2 GB swap) | 4 GB |
| vCPU | 1 | 2 |
| Disk | 25 GB SSD | 50 GB |
| OS | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |

**1 GB will not work.** `next build` peaks near 1.5 GB and the kernel will kill
it. The setup script adds 2 GB of swap for exactly this reason, but 2 GB of real
RAM is the sane floor.

Providers with an Indian region: DigitalOcean (Bangalore), AWS Lightsail
(Mumbai), Hostinger VPS (Mumbai), Azure (Pune/Chennai). Hetzner is cheaper but
has no India presence — fine if your customers are elsewhere, not ideal here.

Budget: **₹500–1,200/month** all in.

---

## Setup

### 1. Provision

```bash
ssh root@YOUR_SERVER_IP
curl -fsSL https://raw.githubusercontent.com/YOU/shehnai/main/deploy/setup-server.sh -o setup.sh
bash setup.sh
```

Installs Node 22, PostgreSQL, Nginx, fail2ban, the firewall and 2 GB of swap;
creates the `shehnai` user and database; sets the timezone to Asia/Kolkata.

**Copy the `DATABASE_URL` it prints. It is shown once.**

### 2. Deploy the app

```bash
su - shehnai
git clone YOUR_REPO_URL ~/app
cd ~/app
cp .env.example .env
nano .env          # paste DATABASE_URL, set AUTH_SECRET, CRON_SECRET, Razorpay keys
bash deploy/deploy.sh --first-run
npx tsx prisma/create-admin.ts you@shehnai.in "a-strong-password" "Your Name"
```

With local PostgreSQL, `DIRECT_URL` is the same as `DATABASE_URL` — there is no
connection pooler in front of it.

Generate the secrets properly:

```bash
openssl rand -base64 32   # AUTH_SECRET
openssl rand -hex 24      # CRON_SECRET
```

### 3. Service and web server

```bash
exit   # back to root

cp /home/shehnai/app/deploy/shehnai.service /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now shehnai
systemctl status shehnai

cp /home/shehnai/app/deploy/nginx.conf /etc/nginx/sites-available/shehnai
sed -i 's/YOURDOMAIN/shehnai.in/g' /etc/nginx/sites-available/shehnai
ln -sf /etc/nginx/sites-available/shehnai /etc/nginx/sites-enabled/shehnai
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

### 4. Domain and HTTPS

Point DNS at the server:

| Type | Name | Value |
|---|---|---|
| A | `@` | `YOUR_SERVER_IP` |
| A | `www` | `YOUR_SERVER_IP` |

Then, once it resolves:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d shehnai.in -d www.shehnai.in
```

Certbot edits the Nginx file to add TLS and the `:80 → :443` redirect, and
installs its own renewal timer.

### 5. Cron

```bash
cp /home/shehnai/app/deploy/backup.sh /usr/local/bin/shehnai-backup
chmod +x /usr/local/bin/shehnai-backup
crontab -e     # paste deploy/crontab.example, replace YOURDOMAIN
```

Three jobs: release abandoned-checkout stock every 15 minutes, back up the
database nightly, renew TLS.

---

## Day-to-day

| Task | Command |
|---|---|
| Deploy an update | `su - shehnai && cd ~/app && bash deploy/deploy.sh` |
| Watch logs | `journalctl -u shehnai -f` |
| Restart | `systemctl restart shehnai` |
| Database shell | `sudo -u postgres psql shehnai` |
| Manual backup | `/usr/local/bin/shehnai-backup` |
| Disk / memory | `df -h` · `free -h` |

`deploy.sh` builds *before* restarting, so a broken build leaves the running
site untouched.

---

## Restoring a backup

Test this **once, now**, while it doesn't matter:

```bash
sudo -u postgres createdb shehnai_restore_test
gunzip -c /var/backups/shehnai/shehnai_2026-07-26_0230.sql.gz \
  | sudo -u postgres psql shehnai_restore_test
sudo -u postgres psql shehnai_restore_test -c 'SELECT count(*) FROM "Product";'
sudo -u postgres dropdb shehnai_restore_test
```

A backup you have never restored is not a backup.

Also uncomment one of the off-server copy lines at the bottom of `backup.sh`.
A backup on the same disk as the database does not survive the failure it
exists to protect against.

---

## What self-hosting costs you

Being straight about it — these are now your job:

- **Security updates.** `unattended-upgrades` handles most of it; reboot for
  kernel patches.
- **Uptime.** Nothing pages you at 2 a.m. Add a free monitor (UptimeRobot,
  BetterStack) pointing at your domain.
- **Backups.** Automated above, but verifying them is manual.
- **Scaling.** One box handles a few hundred concurrent visitors comfortably.
  Beyond that you resize the VPS — a reboot, not a re-architecture.
- **Postgres tuning.** Defaults are fine at this catalogue size. Revisit past
  ~50k orders.

In exchange: roughly a tenth of the cost, data physically in India, no vendor
terms to comply with, and no cold starts.

---

## Troubleshooting

**Build killed / `JavaScript heap out of memory`** — no swap, or too little RAM.
Check `free -h` and `swapon --show`. Re-run the setup script.

**502 Bad Gateway** — the Node process is down. `journalctl -u shehnai -n 50`.
Usually a bad `.env` value.

**Razorpay webhooks failing signature checks** — something is modifying the raw
body. The supplied Nginx config sets `proxy_request_buffering off` on `/api/`
for this reason; don't add body-rewriting modules there.

**Images not optimising** — `sharp` failed to install. `npm install sharp` and
rebuild.

**`prisma migrate deploy` hangs** — usually PostgreSQL isn't running.
`systemctl status postgresql`.

**Stock stuck in `reservedQty`** — the release cron isn't running. Test it by
hand: `curl -H "x-cron-secret: $CRON_SECRET" https://yourdomain/api/cron/release-reservations`
