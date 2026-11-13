#!/bin/sh
# Outgoing email for notifications (PHP mail() → msmtp). Configured from the SMTP_* variables in .env;
# without them mail() just reports failure and the dashboard keeps working.
if [ -n "${SMTP_HOST:-}" ] && [ -n "${SMTP_USER:-}" ]; then
  cat > /etc/msmtprc <<CONF
defaults
auth on
tls on
tls_trust_file /etc/ssl/certs/ca-certificates.crt
logfile /proc/self/fd/2
account default
host ${SMTP_HOST}
port ${SMTP_PORT:-587}
from ${SMTP_FROM:-no-reply@atriumad.com}
user ${SMTP_USER}
password ${SMTP_PASS:-}
CONF
  [ "${SMTP_PORT:-587}" = "465" ] && echo "tls_starttls off" >> /etc/msmtprc
  chown root:www-data /etc/msmtprc && chmod 640 /etc/msmtprc
fi
# Folders the site writes to
for d in /var/www/html/api/cache /var/www/html/uploads /var/www/html/careers-api/uploads; do
  mkdir -p "$d" && chown -R www-data:www-data "$d"
done
exec docker-php-entrypoint "$@"
