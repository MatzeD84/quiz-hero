#!/usr/bin/env bash
set -euo pipefail
umask 022
site_root=$(cd "$(dirname "$0")/.." && pwd -P)
[[ "$site_root" =~ ^/home/[a-z0-9]+/domains/[a-z0-9.-]+$ ]] || exit 2
version=${1:?release version required}
digest=${2:?archive SHA256 required}
[[ "$version" =~ ^[a-zA-Z0-9_-]{7,80}$ && "$digest" =~ ^[a-f0-9]{64}$ ]] || exit 2
exec 9>"$site_root/private/deploy.lock"
flock -n 9 || { echo 'Another deployment is running'; exit 1; }
archive="$site_root/private/$version.tar.gz"
echo "$digest  $archive" | sha256sum -c -
release="$site_root/releases/$version"
[[ ! -e "$release" ]] || { echo 'Release already exists; use rollback for an existing release'; exit 1; }
mkdir -p "$release" "$site_root/shared/uploads"
if tar -tzf "$archive" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then echo 'Unsafe archive paths'; exit 1; fi
tar --no-same-owner --no-same-permissions -xzf "$archive" -C "$release"
web="$release/public"
[[ -f "$web/index.html" && -f "$release/api/index.php" && -f "$web/version.json" && -f "$web/.htaccess" ]] || exit 1
[[ ! -e "$web/images/uploads" && ! -e "$release/.env" && ! -e "$release/.git" && ! -e "$release/.private" ]] || exit 1
if [[ ! -f "$site_root/shared/.uploads-initialized" ]]; then
    if [[ -d "$site_root/public_html/images/uploads" ]]; then
        rsync -a "$site_root/public_html/images/uploads/" "$site_root/shared/uploads/"
    fi
    touch "$site_root/shared/.uploads-initialized"
fi
ln -s "$site_root/shared/uploads" "$web/images/uploads"
if [[ -d "$site_root/shared/source/.git" ]]; then
    ln -s "$site_root/shared/source" "$web/.deploy-source"
fi
find "$release/api" "$release/src" "$web/api" -type f -name '*.php' -exec php -l {} \; >/dev/null
php "$site_root/private/check-release.php" "$release"
if [[ -L "$site_root/public_html" ]]; then
    readlink "$site_root/public_html" > "$site_root/private/previous-release"
else
    legacy="$site_root/releases/legacy-$(date -u +%Y%m%d%H%M%S)"
    mv "$site_root/public_html" "$legacy"
    printf '%s\n' "$legacy" > "$site_root/private/previous-release"
fi
ln -s "$web" "$site_root/.public_html-next"
mv -Tf "$site_root/.public_html-next" "$site_root/public_html"
printf '%s\n' "$web" > "$site_root/private/current-release"
echo "Release activated: $version"
