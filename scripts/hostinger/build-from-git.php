<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') exit(1);
$root = dirname(__DIR__, 2);
if (!is_file($root . '/.hostinger-server')) {
    echo "Composer installed locally; no server deployment requested.\n";
    exit(0);
}
$target = json_decode(file_get_contents($root . '/deployment/hostinger.json'), true, 512, JSON_THROW_ON_ERROR);
$siteRoot = $target['siteRoot'];
if (!preg_match('#^/home/[a-z0-9]+/domains/[a-z0-9.-]+$#D', $siteRoot)) throw new RuntimeException('Invalid site root');
if (realpath($root) !== $siteRoot . '/shared/source') throw new RuntimeException('Unexpected repository location');
if ($target['environment'] !== 'staging') throw new RuntimeException('Production switch requires an explicit reviewed configuration change');
$node = '/opt/alt/alt-nodejs22/root/usr/bin/node';
if (!is_executable($node)) throw new RuntimeException('Node 22 is unavailable');
chdir($root);
function run_command(array $args): string {
    $command = implode(' ', array_map('escapeshellarg', $args));
    ob_start();
    passthru($command, $status);
    $output = ob_get_clean();
    if ($status !== 0) throw new RuntimeException('Build/deploy command failed: ' . $args[0] . "\n" . $output);
    return $output;
}
// Serialize the entire build as Hostinger may receive consecutive push notifications.
$lock = fopen($siteRoot . '/private/git-build.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) throw new RuntimeException('Another Git build is active; retry deployment after it completes');
$commit = trim(run_command(['git', 'rev-parse', 'HEAD']));
$version = substr($commit, 0, 12) . '-' . gmdate('YmdHis');
echo run_command([$node, '--test', 'tests/contracts.test.mjs']);
foreach (glob($root . '/api/*.php') as $php) echo run_command([PHP_BINARY, '-l', $php]);
foreach (['export-seo.php', 'release.sh', 'rollback.sh', 'check-release.php', 'verify-http.php'] as $helper) {
    copy(__DIR__ . '/' . $helper, $siteRoot . '/private/' . $helper);
    chmod($siteRoot . '/private/' . $helper, 0600);
}
@mkdir($root . '/.build', 0755, true);
$seo = run_command([PHP_BINARY, $siteRoot . '/private/export-seo.php']);
if (!(json_decode($seo, true, 512, JSON_THROW_ON_ERROR)['ok'] ?? false)) throw new RuntimeException('SEO export failed');
$seoFile = $root . '/.build/deployment-seo.json';
file_put_contents($seoFile, $seo);
foreach (['SITE_URL' => $target['siteUrl'], 'HOSTINGER_SITE_ROOT' => $siteRoot, 'DEPLOY_ENVIRONMENT' => $target['environment'], 'SEO_EXPORT_FILE' => $seoFile, 'ASSET_VERSION' => $version, 'DEPLOY_COMMIT' => $commit] as $key => $value) putenv($key . '=' . $value);
echo run_command([$node, 'scripts/build-hostinger.js']);
$archive = $siteRoot . '/private/' . $version . '.tar.gz';
echo run_command(['tar', '--format=ustar', '--mode=u+rwX,go+rX', '-czf', $archive, '-C', $root . '/.build/hostinger/public', '.']);
echo run_command(['bash', $siteRoot . '/private/release.sh', $version, hash_file('sha256', $archive)]);
try {
    echo run_command([PHP_BINARY, $siteRoot . '/private/verify-http.php', $version]);
} catch (Throwable $failure) {
    echo run_command(['bash', $siteRoot . '/private/rollback.sh', $version]);
    throw $failure;
}
echo "Hostinger Git deployment verified: $version\n";
