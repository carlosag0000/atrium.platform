# www.atriumad.com on the Atrium VPS: Apache + PHP 8.3 serving the static Next export and public/api/*.php.
# The site files are not baked in: /opt/atriumsite/public on the host is mounted at /var/www/html.
FROM php:8.3-apache
RUN apt-get update && apt-get install -y --no-install-recommends msmtp ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && docker-php-ext-install pdo_mysql \
 && a2enmod rewrite headers expires remoteip
COPY apache.conf /etc/apache2/sites-available/000-default.conf
COPY php.ini /usr/local/etc/php/conf.d/zz-atrium.ini
COPY entrypoint.sh /usr/local/bin/atrium-entrypoint
RUN chmod +x /usr/local/bin/atrium-entrypoint
ENTRYPOINT ["atrium-entrypoint"]
CMD ["apache2-foreground"]
