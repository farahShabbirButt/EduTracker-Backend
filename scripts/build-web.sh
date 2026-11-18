#!/usr/bin/env bash
# Builds the frontend into web/dist, which this server serves when WEB_DIST=web/dist.
# Render runs it as part of the build (npm run build:render). Both repos are public, so no key
# is needed. WEB_REF picks the frontend branch (default main); whatever it names goes live.
set -euo pipefail

WEB_REPO="${WEB_REPO:-https://github.com/farahShabbirButt/EduTracker.git}"
WEB_REF="${WEB_REF:-main}"

rm -rf web
git clone --depth 1 --branch "$WEB_REF" "$WEB_REPO" web
cd web
echo "Frontend $WEB_REF at $(git rev-parse --short HEAD)"
# Dev dependencies hold the build tools; Render sets NODE_ENV=production, which would skip them
npm ci --include=dev
# The API is on this same address
VITE_API_BASE_URL=/edu-tracker/api/v1 npm run build
