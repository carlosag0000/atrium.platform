#!/bin/sh
# Nightly backup of the website database on the VPS (14 days kept). Cron runs it with /bin/sh.
set -eu
cd /opt/atriumsite/deploy
mkdir -p /opt/atriumsite/backups
STAMP=$(date -u +%Y-%m-%d_%H%M)
umask 077
docker compose exec -T db sh -c 'exec mariadb-dump --single-transaction --routines --triggers -uroot -p"$MARIADB_ROOT_PASSWORD" atriumsite' | gzip > /opt/atriumsite/backups/atriumsite_$STAMP.sql.gz
find /opt/atriumsite/backups -name 'atriumsite_*.sql.gz' -mtime +14 -delete
echo "[$(date -u)] Backup: atriumsite_$STAMP.sql.gz"
