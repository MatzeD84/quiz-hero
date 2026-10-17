<?php
declare(strict_types=1);
// Daily bounded cleanup. User accounts, questions, results and uploads are never deleted here.
if (PHP_SAPI !== 'cli') exit(1);
$site = dirname(__DIR__);
if (!preg_match('#^/home/[a-z0-9]+/domains/[a-z0-9.-]+$#D', $site)) exit(1);
$stamp = $site . '/private/last-maintenance';
if (is_file($stamp) && filemtime($stamp) > time() - 86400) exit(0);
$lock = fopen($site . '/private/deploy.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) exit(0);
$web = realpath($site . '/public_html');
if (!$web || basename($web) !== 'public') exit(0);
require dirname($web) . '/api/bootstrap.php';
foreach (['quiz_user_sessions','quiz_password_resets','quiz_email_verifications'] as $table) {
    db()->exec('DELETE FROM ' . $table . ' WHERE expires_at < UTC_TIMESTAMP() - INTERVAL 7 DAY LIMIT 5000');
}
db()->exec('DELETE FROM quiz_rounds WHERE created_at < UTC_TIMESTAMP() - INTERVAL 90 DAY LIMIT 5000');
$rateDir = sys_get_temp_dir() . '/' . QUIZ_HERO_RATE_LIMIT_DIR;
foreach (glob($rateDir . '/*.json') ?: [] as $file) {
    if (is_link($file) || filemtime($file) >= time() - 86400) continue;
    $handle = fopen($file, 'r+');
    if ($handle && flock($handle, LOCK_EX | LOCK_NB)) { unlink($file); flock($handle, LOCK_UN); }
    if ($handle) fclose($handle);
}
// Releases are immutable and recoverable from Git. Protect both active and rollback targets.
$protected = [realpath(dirname($web))];
if (is_file($site . '/private/previous-release')) {
    $previous = realpath(trim(file_get_contents($site . '/private/previous-release')));
    if ($previous) $protected[] = basename($previous) === 'public' ? dirname($previous) : $previous;
}
function remove_release_tree(string $directory, string $allowedRoot): void {
    $resolved = realpath($directory);
    if (!$resolved || !str_starts_with($resolved, $allowedRoot . '/') || is_link($directory)) throw new RuntimeException('Unsafe cleanup path');
    foreach (new FilesystemIterator($directory) as $entry) {
        if ($entry->isDir() && !$entry->isLink()) remove_release_tree($entry->getPathname(), $allowedRoot);
        else unlink($entry->getPathname());
    }
    rmdir($directory);
}
$releases = glob($site . '/releases/*', GLOB_ONLYDIR) ?: [];
usort($releases, static fn($a,$b) => filemtime($b) <=> filemtime($a));
foreach (array_slice($releases, 10) as $release) {
    if (in_array(realpath($release), $protected, true) || filemtime($release) >= time() - 7 * 86400) continue;
    remove_release_tree($release, $site . '/releases');
}
foreach (glob($site . '/private/*.tar.gz') ?: [] as $archive) {
    if (!is_link($archive) && filemtime($archive) < time() - 7 * 86400) unlink($archive);
}
file_put_contents($stamp, gmdate(DATE_ATOM));
echo "Daily maintenance complete; accounts, results and media preserved.\n";
