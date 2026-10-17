<?php
declare(strict_types=1);
/** Called by the Hostinger cron, separately from source deployment. Never changes DB data. */
if (PHP_SAPI !== 'cli') exit(1);
$site = dirname(__DIR__);
if (!preg_match('#^/home/[a-z0-9]+/domains/[a-z0-9.-]+$#D', $site)) throw new RuntimeException('Unexpected site root');
$lock = fopen($site . '/private/deploy.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) exit(0);
$web = realpath($site . '/public_html');
if (!$web || basename($web) !== 'public' || !str_starts_with($web, $site . '/releases/')) exit(0); // Older release layout.
$active = dirname($web);
$node = '/opt/alt/alt-nodejs22/root/usr/bin/node';
function content_command(array $args, ?string $cwd = null): string {
    $process = proc_open($args, [0=>['pipe','r'], 1=>['pipe','w'], 2=>['file', 'php://stderr', 'a']], $pipes, $cwd);
    if (!is_resource($process)) throw new RuntimeException('Cannot start content build');
    fclose($pipes[0]);
    $out = stream_get_contents($pipes[1]); fclose($pipes[1]);
    if (proc_close($process) !== 0) throw new RuntimeException('Content build failed: ' . basename($args[0]));
    return $out;
}
$export = json_decode(content_command([PHP_BINARY, $site . '/private/export-seo.php']), true, 512, JSON_THROW_ON_ERROR);
if (($export['ok'] ?? false) !== true) throw new RuntimeException('Content export failed');
unset($export['generatedAt']);
$hash = hash('sha256', json_encode($export, JSON_THROW_ON_ERROR));
$marker = $site . '/private/published-content';
if (is_file($marker) && trim(file_get_contents($marker)) === $hash) exit(0);
$versionInfo = json_decode(file_get_contents($web . '/version.json'), true, 512, JSON_THROW_ON_ERROR);
$version = substr($versionInfo['commit'] ?: 'content', 0, 12) . '-content-' . gmdate('YmdHis');
$candidate = $site . '/releases/' . $version;
if (file_exists($candidate)) exit(0);
$build = $site . '/private/content-build-' . $version;
mkdir($build, 0700);
file_put_contents($build . '/export.json', json_encode($export, JSON_THROW_ON_ERROR));
putenv('SITE_URL=' . $versionInfo['siteUrl']);
putenv('SEO_EXPORT_FILE=' . $build . '/export.json');
putenv('SEO_OUTPUT_DIR=' . $build . '/seo');
putenv('SEO_SOURCE=export');
echo content_command([$node, $active . '/scripts/build-seo-pages.js'], $active);
echo content_command([$node, $active . '/scripts/apply-asset-version.js', $versionInfo['version'], $build . '/seo'], $active);
// Hard links share immutable code/assets with the current release. Only generated files are replaced.
content_command(['cp', '-al', $active, $candidate]);
$newWeb = $candidate . '/public';
function remove_generated_tree(string $directory): void {
    if (is_link($directory)) throw new RuntimeException('Generated directory must not be a symlink');
    foreach (new FilesystemIterator($directory) as $entry) {
        if ($entry->isDir() && !$entry->isLink()) remove_generated_tree($entry->getPathname());
        else unlink($entry->getPathname());
    }
    rmdir($directory);
}
if (is_dir($newWeb . '/kategorie')) remove_generated_tree($newWeb . '/kategorie');
rename($build . '/seo/kategorie', $newWeb . '/kategorie');
foreach (['sitemap.xml','seo-manifest.json'] as $name) {
    if (file_exists($newWeb . '/' . $name)) unlink($newWeb . '/' . $name);
    rename($build . '/seo/' . $name, $newWeb . '/' . $name);
}
unlink($newWeb . '/.htaccess');
copy($candidate . '/content-policy.htaccess', $newWeb . '/.htaccess');
echo content_command([$node, $active . '/scripts/apply-csp-hashes.js', $newWeb], $active);
$versionInfo['version'] = $version;
$versionInfo['contentRevision'] = $hash;
$versionInfo['builtAt'] = gmdate(DATE_ATOM);
unlink($newWeb . '/version.json');
file_put_contents($newWeb . '/version.json', json_encode($versionInfo, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT));
echo content_command([PHP_BINARY, $site . '/private/check-release.php', $candidate]);
$next = $site . '/.public_html-content-next';
if (file_exists($next) || is_link($next)) throw new RuntimeException('Unfinished activation exists');
symlink($newWeb, $next);
rename($next, $site . '/public_html');
file_put_contents($site . '/private/previous-release', $web . "\n");
file_put_contents($site . '/private/current-release', $newWeb . "\n");
try {
    echo content_command([PHP_BINARY, $site . '/private/verify-http.php', $version]);
} catch (Throwable $failure) {
    symlink($web, $next); rename($next, $site . '/public_html');
    file_put_contents($site . '/private/current-release', $web . "\n");
    throw $failure;
}
file_put_contents($marker, $hash . "\n");
remove_generated_tree($build);
echo 'Published content ' . $hash . "\n";
