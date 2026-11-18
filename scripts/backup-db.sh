#!/usr/bin/env bash
# Saves a full copy of the EduTracker database to backups/edutracker-<date>.dump on this
# computer. Run it weekly and before any big import. Needs PostgreSQL's pg_dump, version 17 or
# newer (Neon runs PostgreSQL 17).
#
#   DATABASE_URL='<Neon connection string>' bash scripts/backup-db.sh
#
# The backups/ folder is gitignored: a backup holds every student's details and marks, and this
# repo is public. Keep backups somewhere private, e.g. a school Google Drive.
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Set DATABASE_URL to the database to back up (the Neon connection string)." >&2
  exit 1
fi

# Prisma's ?schema= isn't a PostgreSQL setting; take it out and back up just that schema
SCHEMA=$(printf '%s' "$DATABASE_URL" | sed -n 's/.*[?&]schema=\([^&]*\).*/\1/p')
SCHEMA=${SCHEMA:-edu_tracker}
URL=$(printf '%s' "$DATABASE_URL" | sed -E 's/([?&])schema=[^&]*&?/\1/; s/[?&]$//')

cd "$(dirname "$0")/.."
mkdir -p backups
FILE="backups/edutracker-$(date +%Y-%m-%d-%H%M).dump"

pg_dump --dbname="$URL" --schema="$SCHEMA" --format=custom --no-owner --no-acl --file="$FILE"
echo "Saved $FILE ($(du -h "$FILE" | cut -f1)). Copy it somewhere private."
