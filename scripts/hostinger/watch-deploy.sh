#!/usr/bin/env bash
set -euo pipefail
umask 077
site_root=$(cd "$(dirname "$0")/.." && pwd -P)
[[ "$site_root" =~ ^/home/[a-z0-9]+/domains/[a-z0-9.-]+$ ]] || exit 2
exec 8>"$site_root/private/worker.lock"
flock -n 8 || exit 0
cd "$site_root/shared/source"
commit=$(git rev-parse HEAD)
[[ "$commit" =~ ^[a-f0-9]{40}$ ]] || exit 2
if [[ -f "$site_root/private/deployed-commit" && "$(cat "$site_root/private/deployed-commit")" == "$commit" ]]; then exit 0; fi
if [[ -f "$site_root/private/failed-commit" && "$(cat "$site_root/private/failed-commit")" == "$commit" ]]; then exit 0; fi
snapshot="$site_root/private/builds/$commit"
mkdir -p "$snapshot"
git archive "$commit" | tar -x -C "$snapshot"
printf '%s\n' "$commit" > "$snapshot/.deploy-commit"
touch "$snapshot/.hostinger-server"
printf '\nBuild requested: %s (%s)\n' "$commit" "$(date -u +%FT%TZ)" >> "$site_root/private/git-build.log"
if php -d disable_functions= "$snapshot/scripts/hostinger/build-from-git.php" >> "$site_root/private/git-build.log" 2>&1; then
    echo 'Hostinger deployment completed'
else
    printf '%s\n' "$commit" > "$site_root/private/failed-commit"
    echo 'Hostinger deployment failed; previous release stays active. See private/git-build.log'
    exit 1
fi
