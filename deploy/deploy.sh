#!/usr/bin/env bash
# =============================================================================
# Build and restart. Run as the app user, from the app directory.
#
#   bash deploy/deploy.sh              # normal update
#   bash deploy/deploy.sh --first-run  # also seeds and creates an admin
#
# Deliberately builds BEFORE restarting, so a broken build leaves the running
# site untouched.
# =============================================================================
set -euo pipefail

FIRST_RUN="${1:-}"
log() { printf "\n\033[1;35m==> %s\033[0m\n" "$*"; }

[[ -f package.json ]] || { echo "Run from the app root."; exit 1; }
[[ -f .env ]] || { echo "No .env file. Copy .env.example and fill it in."; exit 1; }

log "Fetching latest code"
git pull --ff-only

log "Installing dependencies"
# Full install, including dev dependencies: `next build` needs typescript and
# the @types packages, and sharp needs its install script to fetch binaries.
# Trying to trim this is the classic self-host build failure.
npm ci
npx prisma generate

log "Applying migrations"
if [[ -d prisma/migrations ]]; then
  npx prisma migrate deploy
else
  echo "  No migrations folder — using db push for the first setup."
  npx prisma db push
fi

if [[ "$FIRST_RUN" == "--first-run" ]]; then
  log "Seeding starter content"
  npx tsx prisma/seed.ts
fi

log "Building"
# Cap the heap so the build cannot swallow the whole box.
NODE_OPTIONS="--max-old-space-size=1536" npm run build:app

log "Restarting service"
if systemctl is-active --quiet shehnai; then
  sudo systemctl restart shehnai
  sleep 3
  systemctl is-active --quiet shehnai && echo "  Service is up." || { echo "  FAILED — journalctl -u shehnai -n 50"; exit 1; }
else
  echo "  Service not installed yet — see the setup script output."
fi

if [[ "$FIRST_RUN" == "--first-run" ]]; then
  cat <<EOF

Create your admin login now:

  npx tsx prisma/create-admin.ts you@shehnai.in "a-strong-password" "Your Name"

EOF
fi

log "Done"
