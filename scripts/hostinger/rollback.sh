#!/usr/bin/env bash
set -euo pipefail
site_root=$(cd "$(dirname "$0")/.." && pwd -P)
[[ "$site_root" =~ ^/home/[a-z0-9]+/domains/[a-z0-9.-]+$ ]] || exit 2
exec 9>"$site_root/private/deploy.lock"
flock -n 9 || exit 1
target=$(cat "$site_root/private/previous-release")
[[ "$target" == "$site_root/releases/"* && -d "$target" && -f "$target/index.html" ]] || exit 1
current=$(readlink "$site_root/public_html")
if [[ -n "${1:-}" && "$(basename "${current%/public}")" != "$1" ]]; then echo 'A different release is active; refusing rollback'; exit 1; fi
ln -s "$target" "$site_root/.public_html-rollback"
mv -Tf "$site_root/.public_html-rollback" "$site_root/public_html"
printf '%s\n' "$current" > "$site_root/private/previous-release"
printf '%s\n' "$target" > "$site_root/private/current-release"
echo 'Previous file release restored. Database and uploads unchanged.'
