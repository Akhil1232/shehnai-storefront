#!/usr/bin/env bash
# =============================================================================
# Deployment status.
#
#   cd ~/shehnai-storefront && sudo bash status.sh
#
# Checks all 12 stages, marks each done or pending, and prints the exact
# command for the first thing that still needs doing. Read-only — it changes
# nothing.
# =============================================================================
set -uo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
DOMAIN="${DOMAIN:-test.theshehnai.com}"
cd "$APP_DIR" 2>/dev/null || { echo "Cannot cd to $APP_DIR"; exit 1; }

G=$'\033[1;32m'; R=$'\033[1;31m'; Y=$'\033[1;33m'; B=$'\033[1;35m'; N=$'\033[0m'
FIRST_TODO=""
STAGE=0

pass() { printf "  ${G}✓${N} %-46s %s\n" "$1" "${2:-}"; }
fail() { printf "  ${R}✗${N} %-46s %s\n" "$1" "${2:-}"
         [[ -z "$FIRST_TODO" ]] && FIRST_TODO="$STAGE|$1|${3:-}"; }
skip() { printf "  ${Y}!${N} %-46s %s\n" "$1" "${2:-}"; }
sec()  { STAGE=$((STAGE+1)); printf "\n${B}%2d. %s${N}\n" "$STAGE" "$1"; }

# Reads a value from .env, stripping surrounding single or double quotes.
envval() {
  grep -m1 "^$1=" .env 2>/dev/null | cut -d= -f2- \
    | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}
code()   { curl -s -o /dev/null -w "%{http_code}" -m 6 "$1" 2>/dev/null; }

# nginx -t and iptables -S both need root. Without it they fail on permissions
# and get reported as broken config, which is misleading.
if [[ $EUID -ne 0 ]]; then
  printf "\n  ${Y}Run with sudo${N} — reading nginx config and iptables needs root,\n"
  printf "  otherwise those checks report false failures.\n\n      sudo bash status.sh\n\n"
  exit 1
fi

echo
echo "  App:    $APP_DIR"
echo "  Domain: $DOMAIN"

# ---------------------------------------------------------------------------
sec "System packages"
for c in node npm psql nginx; do
  if command -v $c >/dev/null; then pass "$c installed" "$($c --version 2>/dev/null | head -1 | cut -c1-24)"
  else fail "$c installed" "" "sudo bash deploy/setup-server.sh"; fi
done

# ---------------------------------------------------------------------------
sec "Project files and dependencies"
[[ -f package.json ]] && pass "package.json present" || fail "package.json present" "" "cd into the project root"
if [[ -d node_modules ]]; then pass "node_modules present"
else fail "node_modules present" "" "npm install"; fi
if [[ -x node_modules/.bin/next ]]; then pass "next binary present"
else fail "next binary present" "" "npm install"; fi
if [[ -x node_modules/.bin/tsx ]]; then pass "tsx present (needed for admin creation)"
else skip "tsx missing" "run: npm install --include=dev"; fi

# ---------------------------------------------------------------------------
sec "Environment (.env)"
if [[ -f .env ]]; then
  pass ".env exists" "$(stat -c '%a' .env)"
  [[ "$(stat -c '%a' .env)" == "600" ]] || skip ".env is not chmod 600" "chmod 600 .env"
  for k in DATABASE_URL DIRECT_URL AUTH_SECRET NEXT_PUBLIC_SITE_URL; do
    v="$(envval $k)"
    if [[ -z "$v" ]]; then fail "$k set" "" "add $k to .env"
    elif [[ "$v" == *change-me* || "$v" == *xxxx* ]]; then fail "$k set" "still a placeholder" "set a real value for $k in .env"
    else
      extra=""
      [[ "$k" == "AUTH_SECRET" && "${#v}" -lt 16 ]] && { fail "$k set" "too short (${#v} chars, need 16+)" "AUTH_SECRET=\"\$(openssl rand -base64 32)\""; continue; }
      if [[ "$k" == "NEXT_PUBLIC_SITE_URL" ]]; then
        if [[ "$v" == *localhost* || "$v" != *"$DOMAIN"* ]]; then
          fail "$k correct" "$v — should be https://$DOMAIN" \
               "sed -i 's|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=\"https://$DOMAIN\"|' .env && npm run build && sudo systemctl restart shehnai"
          continue
        fi
        extra="$v"
      fi
      pass "$k set" "$extra"
    fi
  done
  v="$(envval CRON_SECRET)"; [[ -n "$v" && "$v" != *change-me* ]] && pass "CRON_SECRET set" || skip "CRON_SECRET not set" "needed for the stock-release cron"
  v="$(envval RAZORPAY_KEY_ID)"
  case "$v" in
    rzp_test_*) pass "Razorpay keys" "TEST mode" ;;
    rzp_live_*) pass "Razorpay keys" "LIVE mode" ;;
    *)          skip "Razorpay keys" "not set — COD still works" ;;
  esac
else
  fail ".env exists" "" "cp .env.example .env && nano .env"
fi

# ---------------------------------------------------------------------------
sec "Database"
if systemctl is-active --quiet postgresql 2>/dev/null; then pass "postgresql running"
else fail "postgresql running" "" "sudo systemctl start postgresql"; fi

DBN="$(envval DATABASE_URL | sed -n 's|.*/\([^?]*\).*|\1|p')"
if [[ -n "$DBN" ]] && sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DBN'" 2>/dev/null | grep -q 1; then
  pass "database '$DBN' exists"
  T=$(sudo -u postgres psql -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'" "$DBN" 2>/dev/null || echo 0)
  [[ "$T" -gt 10 ]] && pass "schema applied" "$T tables" || fail "schema applied" "$T tables" "npm run db:push"
  P=$(sudo -u postgres psql -tAc 'SELECT count(*) FROM "Product"' "$DBN" 2>/dev/null || echo 0)
  [[ "$P" -gt 0 ]] && pass "catalogue seeded" "$P products" || fail "catalogue seeded" "empty" "npm run db:seed"
  A=$(sudo -u postgres psql -tAc 'SELECT count(*) FROM "AdminUser"' "$DBN" 2>/dev/null || echo 0)
  [[ "$A" -gt 0 ]] && pass "admin user exists" "$A" \
    || fail "admin user exists" "none — this is why /admin bounces you" \
            "npx tsx prisma/create-admin.ts you@theshehnai.com \"StrongPassword\" \"Your Name\""
else
  fail "database reachable" "" "check DATABASE_URL in .env"
fi

# ---------------------------------------------------------------------------
sec "Build"
if [[ -d .next ]]; then
  pass ".next present" "built $(date -r .next '+%d %b %H:%M' 2>/dev/null)"
  if [[ -n "$(find src -newer .next -name '*.tsx' -o -newer .next -name '*.ts' 2>/dev/null | head -1)" ]]; then
    skip "source is newer than the build" "npm run build"
  fi
else
  fail ".next present" "" "npm run build"
fi

# ---------------------------------------------------------------------------
sec "Application service"
if systemctl is-active --quiet shehnai 2>/dev/null; then
  pass "shehnai service active"
  systemctl is-enabled --quiet shehnai 2>/dev/null && pass "enabled at boot" || skip "not enabled at boot" "sudo systemctl enable shehnai"
  BIND=$(ss -tlnp 2>/dev/null | grep -m1 ':3000' | awk '{print $4}')
  case "$BIND" in
    127.0.0.1:3000) pass "listening on loopback only" "$BIND" ;;
    *:3000)         skip "listening on all interfaces" "$BIND — add --hostname 127.0.0.1" ;;
    *)              fail "listening on :3000" "" "sudo systemctl restart shehnai" ;;
  esac
  C=$(code http://127.0.0.1:3000/); [[ "$C" =~ ^(200|30.)$ ]] && pass "responds on :3000" "HTTP $C" || fail "responds on :3000" "HTTP $C" "journalctl -u shehnai -n 40"
else
  fail "shehnai service active" "" "sudo bash deploy/install-service.sh"
fi

# ---------------------------------------------------------------------------
sec "Web server"
systemctl is-active --quiet nginx 2>/dev/null && pass "nginx running" || fail "nginx running" "" "sudo systemctl start nginx"
nginx -t >/dev/null 2>&1 && pass "nginx config valid" || fail "nginx config valid" "" "sudo nginx -t"
[[ -L /etc/nginx/sites-enabled/shehnai ]] && pass "site enabled" || fail "site enabled" "" "see RUNBOOK step 7"
[[ -e /etc/nginx/sites-enabled/default ]] && skip "default site still enabled" "sudo rm /etc/nginx/sites-enabled/default" || pass "default site removed"
C=$(code http://127.0.0.1/); [[ "$C" =~ ^(200|30.)$ ]] && pass "nginx proxies to the app" "HTTP $C" || fail "nginx proxies to the app" "HTTP $C" "sudo nginx -t"

# ---------------------------------------------------------------------------
sec "Firewall"
POS_REJECT=$(iptables -S INPUT 2>/dev/null | grep -n -- "-j REJECT" | head -1 | cut -d: -f1)
POS_80=$(iptables -S INPUT 2>/dev/null | grep -n -- "--dport 80 -j ACCEPT" | head -1 | cut -d: -f1)
if [[ -n "$POS_80" && -n "$POS_REJECT" ]]; then
  [[ "$POS_80" -lt "$POS_REJECT" ]] && pass "port 80 ACCEPT before REJECT" "80 at $POS_80, REJECT at $POS_REJECT" \
    || fail "port 80 ACCEPT before REJECT" "80 at $POS_80 is BELOW REJECT at $POS_REJECT — never matches" \
            "sudo iptables -D INPUT -j REJECT --reject-with icmp-host-prohibited && sudo iptables -A INPUT -j REJECT --reject-with icmp-host-prohibited"
elif [[ -n "$POS_80" ]]; then pass "port 80 accepted" "no REJECT in chain"
else fail "port 80 accepted" "" "sudo iptables -I INPUT 5 -p tcp -m state --state NEW --dport 80 -j ACCEPT"; fi
command -v netfilter-persistent >/dev/null \
  && pass "rules persist across reboot" \
  || fail "rules persist across reboot" "NOT saved — a reboot reverts everything" "sudo apt install -y iptables-persistent"

# ---------------------------------------------------------------------------
sec "DNS and HTTPS"
RES=$(getent hosts "$DOMAIN" | awk '{print $1}' | head -1)
[[ -n "$RES" ]] && pass "$DOMAIN resolves" "$RES" || fail "$DOMAIN resolves" "" "add an A record for $DOMAIN"
if [[ -d "/etc/letsencrypt/live/$DOMAIN" ]]; then
  EXP=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" 2>/dev/null | cut -d= -f2)
  pass "TLS certificate installed" "expires $EXP"
  C=$(code "https://$DOMAIN/"); [[ "$C" =~ ^(200|30.)$ ]] && pass "https reachable" "HTTP $C" || skip "https returned $C" "test from outside the server"
else
  fail "TLS certificate" "" "sudo certbot --nginx -d $DOMAIN --redirect"
fi
if [[ "$DOMAIN" == test.* || "$DOMAIN" == staging.* ]]; then
  curl -sI "http://127.0.0.1/" 2>/dev/null | grep -qi "x-robots-tag" \
    && pass "staging is noindex" || skip "staging is indexable" "add X-Robots-Tag noindex to the nginx site"
fi

# ---------------------------------------------------------------------------
sec "Scheduled jobs"
CT=$(crontab -l 2>/dev/null; sudo crontab -l 2>/dev/null)
grep -q "release-reservations" <<<"$CT" && pass "stock-release cron installed" \
  || fail "stock-release cron installed" "abandoned carts will lock stock" "see RUNBOOK step 11"
grep -q "shehnai-backup" <<<"$CT" && pass "database backup cron installed" \
  || fail "database backup cron installed" "" "see RUNBOOK step 11"

# ---------------------------------------------------------------------------
sec "Payments"
case "$(envval RAZORPAY_KEY_ID)" in
  rzp_live_*) pass "Razorpay in LIVE mode" ;;
  rzp_test_*) skip "Razorpay in TEST mode" "fine for staging; COD works for real orders" ;;
  *)          skip "Razorpay not configured" "COD-only until keys are added" ;;
esac
[[ -n "$(envval RAZORPAY_WEBHOOK_SECRET)" ]] && pass "webhook secret set" \
  || skip "webhook secret not set" "required, or paid orders stay PENDING"

# ---------------------------------------------------------------------------
printf "\n${B}NEXT STEP${N}\n"
if [[ -z "$FIRST_TODO" ]]; then
  echo "  Nothing outstanding. Everything checked out."
else
  IFS='|' read -r s w c <<<"$FIRST_TODO"
  echo "  Stage $s — $w"
  [[ -n "$c" ]] && printf "\n      %s\n" "$c"
  echo
  echo "  Fix that, then run this script again."
fi
echo
