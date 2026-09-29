#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

base=/opt/makkah-event
cd "$base/app"
git fetch origin main
commit=$(git rev-parse origin/main)
stamp=$(date +%Y%m%d%H%M%S)
mkdir -p "$base/incoming"
archive="$base/incoming/makkah-$stamp.tar.gz"
script="$base/incoming/deploy-$stamp.sh"
git archive --format=tar.gz --output="$archive" "$commit"
git show "$commit:scripts/deploy-dael.sh" > "$script"
bash "$script" "$archive" "$stamp"

# Reset only after the new release is live and its health checks have passed.
cd "$base/dael-current"
flock -n "$base/deploy.lock" npm run accounts:reset:prod -- --apply
curl -fsS --max-time 20 https://daeloffice.com/api/health
curl -fsS --max-time 20 https://daeloffice.com/agenda.pdf -o /dev/null
printf '\nUPDATE_OK\nCommit: %s\nhttps://daeloffice.com\nhttps://daeloffice.com/agenda.pdf\n' "$commit"
