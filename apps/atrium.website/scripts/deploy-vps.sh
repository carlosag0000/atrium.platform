#!/bin/sh
# Build www.atriumad.com and publish it to the Atrium VPS (replaces scripts/upload-hostinger.py once DNS points there).
# Files written by the site itself (uploads, CVs, cache) and the server-only config.php are never touched.
set -eu
cd "$(dirname "$0")/.."
HOST=root@2.24.194.204
KEY=~/.ssh/atrium_vps_ops
[ "${SKIP_BUILD:-}" = 1 ] || bash scripts/build-hostinger.sh
rm -f out/api/config.example.php
rsync -az --delete -e "ssh -i $KEY" \
  --exclude '/api/config.php' --exclude '/api/cache/' --exclude '/uploads/***' --exclude '/careers-api/uploads/***' --exclude '/careers-api/config.php' \
  out/ "$HOST:/opt/atriumsite/public/"
rsync -az -e "ssh -i $KEY" deploy/vps/ "$HOST:/opt/atriumsite/deploy/"
ssh -i $KEY $HOST 'cd /opt/atriumsite/deploy && docker compose up -d --build web >/dev/null 2>&1 && docker compose ps --format "{{.Name}} {{.Status}}"'
