<?php

declare(strict_types=1);

const QUIZ_HERO_MAX_JSON_BYTES = 262144;

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
