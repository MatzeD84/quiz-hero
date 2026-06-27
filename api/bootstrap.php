<?php

declare(strict_types=1);

const QUIZ_HERO_MAX_JSON_BYTES = 262144;
const QUIZ_HERO_RATE_LIMIT_DIR = 'quiz-hero-rate-limits';

function local_config(): array
{
    static $config = null;
    if (is_array($config)) {
        return $config;
    }

    $path = __DIR__ . '/config.local.php';
    if (!is_file($path)) {
        $config = [];
        return $config;
    }

    $loaded = require $path;
    $config = is_array($loaded) ? $loaded : [];
    return $config;
}

function quiz_hero_start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function env_value(string $key, ?string $default = null): ?string
{
    $value = getenv($key);
    if ($value === false || $value === '') {
        $config = local_config();
        return array_key_exists($key, $config) && $config[$key] !== ''
            ? (string) $config[$key]
            : $default;
    }
    return $value;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = env_value('QUIZ_HERO_DB_HOST', '127.0.0.1');
    $port = env_value('QUIZ_HERO_DB_PORT', '3306');
    $name = env_value('QUIZ_HERO_DB_NAME', 'quiz_hero');
    $user = env_value('QUIZ_HERO_DB_USER', 'quiz_hero');
    $pass = env_value('QUIZ_HERO_DB_PASSWORD', '');
    $charset = env_value('QUIZ_HERO_DB_CHARSET', 'utf8mb4');

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $host, $port, $name, $charset);
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}

function json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function client_ip(): string
{
    return (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
}

function rate_limit(string $scope, int $maxAttempts, int $windowSeconds): void
{
    $dir = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . QUIZ_HERO_RATE_LIMIT_DIR;
    if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) {
        return;
    }

    $key = hash('sha256', $scope . '|' . client_ip());
    $path = $dir . DIRECTORY_SEPARATOR . $key . '.json';
    $handle = fopen($path, 'c+');
    if ($handle === false) {
        return;
    }

    $locked = false;
    try {
        if (!flock($handle, LOCK_EX)) {
            return;
        }
        $locked = true;
        $raw = stream_get_contents($handle);
        $entries = is_string($raw) && $raw !== '' ? json_decode($raw, true) : [];
        if (!is_array($entries)) {
            $entries = [];
        }

        $now = time();
        $entries = array_values(array_filter($entries, static fn($timestamp): bool => is_int($timestamp) && $timestamp > ($now - $windowSeconds)));
        if (count($entries) >= $maxAttempts) {
            json_response(['ok' => false, 'error' => 'Zu viele Anfragen. Bitte warte kurz und versuche es erneut.'], 429);
        }

        $entries[] = $now;
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($entries));
    } finally {
        if ($locked) {
            flock($handle, LOCK_UN);
        }
        fclose($handle);
    }
}

function csrf_token(): string
{
    quiz_hero_start_session();
    if (empty($_SESSION['quiz_hero_csrf'])) {
        $_SESSION['quiz_hero_csrf'] = bin2hex(random_bytes(32));
    }
    return (string) $_SESSION['quiz_hero_csrf'];
}

function require_admin_csrf(): void
{
    require_admin();
    $token = (string) ($_SERVER['HTTP_X_QUIZ_HERO_CSRF'] ?? '');
    if ($token === '' || !hash_equals(csrf_token(), $token)) {
        json_response(['ok' => false, 'error' => 'Ungueltiges Sicherheits-Token. Bitte neu einloggen.'], 403);
    }
}

function token_secret(): string
{
    $secret = env_value('QUIZ_HERO_USER_TOKEN_SECRET')
        ?? env_value('QUIZ_HERO_ADMIN_PASSWORD_HASH')
        ?? env_value('QUIZ_HERO_ADMIN_PASSWORD')
        ?? env_value('QUIZ_HERO_DB_PASSWORD')
        ?? '';

    if ($secret === '') {
        $secret = 'quiz-hero-local-development-secret';
    }

    return $secret;
}

function base64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function base64url_decode(string $value): string|false
{
    $base64 = strtr($value, '-_', '+/');
    $padding = strlen($base64) % 4;
    if ($padding !== 0) {
        $base64 .= str_repeat('=', 4 - $padding);
    }
    $padded = $base64;
    return base64_decode($padded, true);
}

function create_user_token(int $userId): string
{
    $payload = base64url_encode(json_encode(['userId' => $userId, 'issuedAt' => time()], JSON_THROW_ON_ERROR));
    $signature = hash_hmac('sha256', $payload, token_secret());
    return $payload . '.' . $signature;
}

function require_user_token(int $userId, string $token): void
{
    $parts = explode('.', $token, 2);
    if (count($parts) !== 2) {
        json_response(['ok' => false, 'error' => 'Ungueltiges User-Token. Bitte neu einloggen.'], 401);
    }

    [$payload, $signature] = $parts;
    $expected = hash_hmac('sha256', $payload, token_secret());
    if (!hash_equals($expected, $signature)) {
        json_response(['ok' => false, 'error' => 'Ungueltiges User-Token. Bitte neu einloggen.'], 401);
    }

    $decoded = base64url_decode($payload);
    $data = is_string($decoded) ? json_decode($decoded, true) : null;
    if (!is_array($data) || (int) ($data['userId'] ?? 0) !== $userId) {
        json_response(['ok' => false, 'error' => 'Ungueltiges User-Token. Bitte neu einloggen.'], 401);
    }

    $issuedAt = (int) ($data['issuedAt'] ?? 0);
    if ($issuedAt < time() - 15552000) {
        json_response(['ok' => false, 'error' => 'User-Token ist abgelaufen. Bitte neu einloggen.'], 401);
    }
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    if (strlen($raw) > QUIZ_HERO_MAX_JSON_BYTES) {
        json_response(['ok' => false, 'error' => 'Die Anfrage ist zu groß.'], 413);
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        json_response(['ok' => false, 'error' => 'Ungültiges JSON.'], 400);
    }
    return $data;
}

function require_method(string $method): void
{
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        json_response(['ok' => false, 'error' => 'Methode nicht erlaubt.'], 405);
    }
}

function require_admin(): void
{
    quiz_hero_start_session();
    if (empty($_SESSION['quiz_hero_admin'])) {
        json_response(['ok' => false, 'error' => 'Admin-Login erforderlich.'], 401);
    }
}

function slugify(string $value): string
{
    $value = mb_strtolower(trim($value), 'UTF-8');
    $map = ['ä' => 'ae', 'ö' => 'oe', 'ü' => 'ue', 'ß' => 'ss'];
    $value = strtr($value, $map);
    $value = preg_replace('/[^a-z0-9]+/u', '-', $value) ?? '';
    $value = trim($value, '-');
    return $value !== '' ? $value : bin2hex(random_bytes(4));
}

function clean_string(?string $value, int $maxLength): string
{
    $clean = trim((string) $value);
    $clean = preg_replace('/\s+/u', ' ', $clean) ?? '';
    return mb_substr($clean, 0, $maxLength, 'UTF-8');
}

function clean_url(?string $value, int $maxLength = 500): string
{
    $url = trim((string) $value);
    if ($url === '') {
        return '';
    }
    if (!filter_var($url, FILTER_VALIDATE_URL) && !str_starts_with($url, 'images/')) {
        return '';
    }
    return mb_substr($url, 0, $maxLength, 'UTF-8');
}

function ensure_int($value, int $min, int $max): int
{
    $int = filter_var($value, FILTER_VALIDATE_INT);
    if ($int === false || $int < $min || $int > $max) {
        json_response(['ok' => false, 'error' => 'Ungültiger Zahlenwert.'], 422);
    }
    return (int) $int;
}

function decode_json_field(?string $value, $fallback)
{
    if ($value === null || $value === '') {
        return $fallback;
    }
    $decoded = json_decode($value, true);
    return $decoded === null ? $fallback : $decoded;
}
