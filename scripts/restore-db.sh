#!/usr/bin/env bash
# Puts a backup made by backup-db.sh back into a database. Everything in that database's
# EduTracker schema is replaced by the backup, so it asks first.
#
#   DATABASE_URL='<connection string>' bash scripts/restore-db.sh backups/edutracker-<date>.dump
#
# To check a backup without touching the live data, restore it into a new, empty Neon branch
# or database first.
set -euo pipefail

FILE="${1:-}"
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "Give the backup file, e.g. bash scripts/restore-db.sh backups/edutracker-2026-11-18-0930.dump" >&2
  exit 1
fi
if [ -z "${DATABASE_URL:-}" ]; then
  echo "Set DATABASE_URL to the database to restore into." >&2
  exit 1
fi

SCHEMA=$(printf '%s' "$DATABASE_URL" | sed -n 's/.*[?&]schema=\([^&]*\).*/\1/p')
SCHEMA=${SCHEMA:-edu_tracker}
URL=$(printf '%s' "$DATABASE_URL" | sed -E 's/([?&])schema=[^&]*&?/\1/; s/[?&]$//')
HOST=$(printf '%s' "$URL" | sed -E 's#^[a-z]+://([^@]*@)?([^/:?]+).*#\2#')

echo "This replaces everything in schema \"$SCHEMA\" on $HOST with $FILE."
read -r -p "Type the host name ($HOST) to go ahead: " ANSWER
if [ "$ANSWER" != "$HOST" ]; then
  echo "Not restored." >&2
  exit 1
fi

pg_restore --dbname="$URL" --clean --if-exists --no-owner --no-acl --single-transaction "$FILE"
echo "Restored $FILE into $HOST. Restart the Render service so it reconnects."
