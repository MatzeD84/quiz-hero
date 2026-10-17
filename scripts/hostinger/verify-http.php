<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') exit(1);
$config = require __DIR__ . '/config.php';
$version = $argv[1] ?? '';
$auth = json_decode(file_get_contents(__DIR__ . '/healthcheck-auth.json'), true, 512, JSON_THROW_ON_ERROR);
$origin = rtrim($config['SITE_URL'], '/');
function request(string $url, ?array $auth): array {
    $curl = curl_init($url);
    curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_HTTPHEADER => ['Cache-Control: no-cache'], CURLOPT_FOLLOWLOCATION => false]);
    if ($auth) curl_setopt($curl, CURLOPT_USERPWD, $auth['user'] . ':' . $auth['password']);
    $body = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    if ($body === false) throw new RuntimeException('HTTP check failed: ' . curl_error($curl));
    curl_close($curl);
    return [$status, $body];
}
if ($auth['enabled'] && request($origin . '/?check=' . rawurlencode($version), null)[0] !== 401) throw new RuntimeException('Staging gate missing');
$credentials = $auth['enabled'] ? $auth : null;
$versionMatches = false;
for ($attempt = 0; $attempt < 6; $attempt++) {
    [$status, $body] = request($origin . '/version.json?check=' . rawurlencode($version) . '&nonce=' . bin2hex(random_bytes(6)), $credentials);
    if ($status === 200 && (json_decode($body, true)['version'] ?? '') === $version) { $versionMatches = true; break; }
    if ($attempt < 5) sleep(1);
}
if (!$versionMatches) throw new RuntimeException('Published version mismatch');
[$status, $body] = request($origin . '/api/index.php?action=public-data&v=1', $credentials);
if ($status !== 200 || !(json_decode($body, true)['ok'] ?? false)) throw new RuntimeException('Published API failed');
[$status, $body] = request($origin . '/', $credentials);
if ($status !== 200 || !str_contains($body, 'Quiz-Hero')) throw new RuntimeException('Published homepage failed');
[$status] = request($origin . '/.deploy-source/composer.json', $credentials);
if (!in_array($status, [403, 404], true)) throw new RuntimeException('Git source directory is publicly reachable');
echo "Published version, homepage, API and access policy verified\n";
