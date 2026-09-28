#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
archive=${1:?Archive required}
stamp=${2:?Release ID required}
[[ "$stamp" =~ ^[0-9]{14}$ ]] || exit 1
base=/opt/makkah-event
release="$base/releases/$stamp"
site=/etc/nginx/sites-available/daeloffice-event
enabled=/etc/nginx/sites-enabled/daeloffice-event
backup="$base/backups/$stamp"
process="dael-event-$stamp"
mkdir -p "$backup" "$release"
exec 9>"$base/deploy.lock"
flock -n 9 || { echo 'Another deployment is running.'; exit 1; }
test -f "$base/app/.env.production.local"
nginx -t
# Refuse to overwrite a domain configured in another site's file.
for config in /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf; do
  [ -f "$config" ] || continue
  [ "$config" = "$enabled" ] && continue
  if grep -Eq '^[[:space:]]*server_name[[:space:]][^;]*\bdaeloffice\.com\b' "$config"; then
    echo "Domain already configured in $config. Deployment stopped before changes."
    exit 1
  fi
done
tar -xzf "$archive" -C "$release"
cp "$base/app/.env.production.local" "$release/.env.production.local"
cd "$release"
node --input-type=module <<'NODE'
import fs from 'node:fs';
const path='.env.production.local';
let text=fs.readFileSync(path,'utf8');
for(const [key,value] of Object.entries({APP_URL:'https://daeloffice.com',NEXT_PUBLIC_BASE_PATH:'',TRUST_PROXY:'true',EMAIL_PROVIDER:'resend'})) {
  text=text.replace(new RegExp('^'+key+'=.*(?:\\r?\\n|$)','gm'),'');
  text+='\n'+key+'='+value+'\n';
}
fs.writeFileSync(path,text,{mode:0o600});
NODE
npm ci
npm run typecheck
NEXT_PUBLIC_BASE_PATH= npm run build
# Back up SQL before running idempotent setup. Never recreate the database volume.
dbid=$(docker compose --project-directory "$base/app" --env-file "$base/app/.env.production.local" ps -q db)
test -n "$dbid"
if docker exec "$dbid" mariadb -uroot -Nse 'SELECT 1' >/dev/null 2>&1; then
  docker exec "$dbid" mariadb-dump -uroot --single-transaction makkah_event > "$backup/database.sql"
else
  docker exec "$dbid" sh -c 'MYSQL_PWD="$MARIADB_ROOT_PASSWORD" mariadb-dump -uroot --single-transaction makkah_event' > "$backup/database.sql"
fi
test -s "$backup/database.sql"
npm run db:setup:prod
port=
for candidate in $(seq 3101 3199); do
  if ! ss -H -lnt "sport = :$candidate" | grep -q .; then port=$candidate; break; fi
done
test -n "$port"
NODE_ENV=production NEXT_PUBLIC_BASE_PATH= PORT="$port" pm2 start npm --name "$process" --cwd "$release" -- start
ready=0
for attempt in $(seq 1 30); do
  if curl -fsS --max-time 3 "http://127.0.0.1:$port/api/health" > /dev/null; then ready=1; break; fi
  sleep 2
done
if [ "$ready" != 1 ]; then pm2 logs "$process" --lines 50 --nostream; exit 1; fi
cp -a /etc/nginx "$backup/nginx"
had_site=0
[ ! -f "$site" ] || { cp -p "$site" "$backup/previous-site"; had_site=1; }
had_enabled=0
[ ! -e "$enabled" ] || had_enabled=1
restore_site() {
  echo "Deployment failed. Restoring previous Nginx configuration. Backup: $backup"
  if [ "$had_site" = 1 ]; then cp -p "$backup/previous-site" "$site"; else rm -f "$site"; fi
  if [ "$had_enabled" = 0 ]; then rm -f "$enabled"; fi
  nginx -t && systemctl reload nginx
}
trap restore_site ERR
if ! command -v certbot >/dev/null; then
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y certbot
fi
mkdir -p /var/www/dael-acme/.well-known/acme-challenge
chmod 755 /var/www/dael-acme /var/www/dael-acme/.well-known /var/www/dael-acme/.well-known/acme-challenge
cert=/etc/letsencrypt/live/daeloffice.com
if [ ! -f "$cert/fullchain.pem" ] || ! openssl x509 -checkend 604800 -noout -in "$cert/fullchain.pem"; then
  cat > "$site" <<'NGINX'
server {
  listen 80;
  server_name daeloffice.com;
  location ^~ /.well-known/acme-challenge/ { root /var/www/dael-acme; }
  location / { return 503; }
}
NGINX
  chmod 644 "$site"
  ln -sfn "$site" "$enabled"
  nginx -t
  systemctl reload nginx
  certbot certonly --webroot -w /var/www/dael-acme -d daeloffice.com --cert-name daeloffice.com --non-interactive --agree-tos --register-unsafely-without-email
fi
cat > "$site" <<'NGINX'
server {
  listen 80;
  server_name daeloffice.com;
  location ^~ /.well-known/acme-challenge/ { root /var/www/dael-acme; }
  location / { return 301 https://daeloffice.com$request_uri; }
}
server {
  listen 443 ssl;
  server_name daeloffice.com;
  ssl_certificate /etc/letsencrypt/live/daeloffice.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/daeloffice.com/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  client_max_body_size 2m;
  location = /makkah { return 308 /$is_args$args; }
  location ~ ^/makkah/(.*)$ { return 308 /$1$is_args$args; }
  location / {
    proxy_pass http://127.0.0.1:APP_PORT;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 90s;
  }
}
NGINX
sed -i "s/APP_PORT/$port/" "$site"
chmod 644 "$site"
ln -sfn "$site" "$enabled"
nginx -t
systemctl reload nginx
curl -fsS --retry 8 --retry-delay 2 --retry-all-errors --max-time 20 --resolve daeloffice.com:443:127.0.0.1 https://daeloffice.com/api/health
curl -fsS --retry 8 --retry-delay 2 --retry-all-errors --max-time 20 https://daeloffice.com/api/health
curl -fsS --retry 8 --retry-delay 2 --retry-all-errors --max-time 20 https://daeloffice.com/ -o /dev/null
curl -fsS --retry 8 --retry-delay 2 --retry-all-errors --max-time 20 https://daeloffice.com/login -o /dev/null
trap - ERR
ln -sfn "$release" "$base/dael-current"
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
printf '#!/bin/sh\nnginx -t && systemctl reload nginx\n' > /etc/letsencrypt/renewal-hooks/deploy/dael-reload-nginx
chmod 755 /etc/letsencrypt/renewal-hooks/deploy/dael-reload-nginx
systemctl enable --now certbot.timer
pm2 startup systemd -u root --hp /root
pm2 save
printf '\nDEPLOYMENT_OK\nhttps://daeloffice.com\nhttps://daeloffice.com/login\nBackup: %s\nRelease: %s\n' "$backup" "$release"
printf 'Email delivery and real registration/QR scanning still require an end-to-end test.\n'
