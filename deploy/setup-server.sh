#!/usr/bin/env bash
# =============================================================================
# One-time server provisioning for a fresh Ubuntu 24.04 VPS.
#
#   ssh root@YOUR_SERVER_IP
#   curl -fsSL https://raw.githubusercontent.com/YOU/shehnai/main/deploy/setup-server.sh -o setup.sh
#   bash setup.sh
#
# Creates the app user, swap, Node, PostgreSQL, Nginx, firewall.
# Run it once. Safe to re-run — every step is idempotent.
# =============================================================================
set -euo pipefail

APP_USER="shehnai"
APP_DIR="/home/${APP_USER}/app"
DB_NAME="shehnai"
DB_USER="shehnai"
NODE_MAJOR="22"

log() { printf "\n\033[1;35m==> %s\033[0m\n" "$*"; }

[[ $EUID -eq 0 ]] || { echo "Run as root."; exit 1; }

log "System packages"
apt-get update -qq
apt-get install -y -qq curl git ufw nginx postgresql postgresql-contrib \
  ca-certificates gnupg unzip fail2ban >/dev/null

# --- swap ---------------------------------------------------------------
# `next build` peaks around 1.5–2 GB. On a 2 GB box it will be killed by the
# OOM reaper without swap. This is the single most common self-host failure.
if ! swapon --show | grep -q swapfile; then
  log "Creating 2 GB swap"
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl -w vm.swappiness=10 >/dev/null
  echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
else
  log "Swap already present, skipping"
fi

log "Node.js ${NODE_MAJOR}"
if ! command -v node >/dev/null || [[ "$(node -v)" != v${NODE_MAJOR}* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
fi
node -v

log "Application user"
id -u "$APP_USER" >/dev/null 2>&1 || adduser --disabled-password --gecos "" "$APP_USER"
mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "/home/${APP_USER}"

log "PostgreSQL database"
DB_PASS="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
  sudo -u postgres psql -qc "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
  sudo -u postgres psql -qc "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
  sudo -u postgres psql -qc "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
  echo
  echo "  Database created. Put this in your .env — it is shown ONCE:"
  echo
  echo "  DATABASE_URL=\"postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public\""
  echo "  DIRECT_URL=\"postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public\""
  echo
else
  echo "  Role ${DB_USER} already exists — keeping the existing password."
fi

log "Allowing the app user to restart its own service"
# Narrowly scoped: this user can restart/status ONLY the shehnai unit,
# nothing else, and without a password so deploys stay non-interactive.
cat > /etc/sudoers.d/shehnai <<'SUDO'
shehnai ALL=(root) NOPASSWD: /bin/systemctl restart shehnai, /bin/systemctl status shehnai, /usr/bin/systemctl restart shehnai, /usr/bin/systemctl status shehnai
SUDO
chmod 440 /etc/sudoers.d/shehnai
visudo -cf /etc/sudoers.d/shehnai

log "Firewall"
ufw allow OpenSSH >/dev/null
ufw allow 'Nginx Full' >/dev/null
ufw --force enable >/dev/null
ufw status numbered

log "Locale and timezone"
timedatectl set-timezone Asia/Kolkata

systemctl enable --now postgresql nginx fail2ban >/dev/null

cat <<EOF

Done. Next:

  1. su - ${APP_USER}
  2. git clone YOUR_REPO_URL ${APP_DIR}
  3. cd ${APP_DIR} && cp .env.example .env && nano .env
     (paste the DATABASE_URL above; set AUTH_SECRET, CRON_SECRET, Razorpay keys)
  4. bash deploy/deploy.sh --first-run
  5. exit, then as root:
       cp ${APP_DIR}/deploy/shehnai.service /etc/systemd/system/
       cp ${APP_DIR}/deploy/nginx.conf /etc/nginx/sites-available/shehnai
       ln -sf /etc/nginx/sites-available/shehnai /etc/nginx/sites-enabled/shehnai
       rm -f /etc/nginx/sites-enabled/default
       # edit the nginx file and replace YOURDOMAIN
       nginx -t && systemctl reload nginx
       systemctl daemon-reload && systemctl enable --now shehnai
  6. certbot --nginx -d YOURDOMAIN -d www.YOURDOMAIN

EOF
