#!/usr/bin/env bash
# =============================================================================
# Nightly PostgreSQL backup with rotation.
#
#   sudo cp deploy/backup.sh /usr/local/bin/shehnai-backup
#   sudo chmod +x /usr/local/bin/shehnai-backup
#
# A backup you have never restored is not a backup. Test it once:
#   createdb shehnai_test && gunzip -c <file> | psql shehnai_test
# =============================================================================
set -euo pipefail

DB_NAME="${DB_NAME:-shehnai}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/shehnai}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y-%m-%d_%H%M)"

mkdir -p "$BACKUP_DIR"

sudo -u postgres pg_dump --no-owner --no-privileges "$DB_NAME" \
  | gzip -9 > "${BACKUP_DIR}/${DB_NAME}_${STAMP}.sql.gz"

# Fail loudly if the dump came out suspiciously small — a silent 0-byte
# backup is worse than no backup, because you will trust it.
SIZE=$(stat -c%s "${BACKUP_DIR}/${DB_NAME}_${STAMP}.sql.gz")
if [[ "$SIZE" -lt 1024 ]]; then
  echo "ERROR: backup is only ${SIZE} bytes — check PostgreSQL." >&2
  exit 1
fi

find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime "+${KEEP_DAYS}" -delete

echo "$(date -Is)  backup ok  ${SIZE} bytes  ${BACKUP_DIR}/${DB_NAME}_${STAMP}.sql.gz"

# ---- Optional: copy off the server -----------------------------------------
# A backup sitting on the same disk as the database does not survive the
# failure it exists to protect against. Uncomment one:
#
# rclone copy "${BACKUP_DIR}/${DB_NAME}_${STAMP}.sql.gz" remote:shehnai-backups/
# aws s3 cp "${BACKUP_DIR}/${DB_NAME}_${STAMP}.sql.gz" s3://your-bucket/shehnai/
