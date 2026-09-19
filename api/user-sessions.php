<?php

declare(strict_types=1);

// Only hashes are persisted. The opaque session value is confined to an HttpOnly cookie.
const USER_SESSION_COOKIE = 'quiz_hero_session';
const USER_SESSION_LIFETIME = 604800; // Seven days, never extended by account-me.
const USER_SESSION_IDLE_TIMEOUT = 86400;

function create_user_token(int $userId): string
{
    $token = bin2hex(random_bytes(32));
    $stmt = db()->prepare('INSERT INTO quiz_user_sessions (token_hash, user_id, expires_at, last_seen_at) VALUES (:hash, :id, :expires, UTC_TIMESTAMP())');
    $stmt->execute([
        'hash' => hash('sha256', $token),
        'id' => $userId,
        'expires' => gmdate('Y-m-d H:i:s', time() + USER_SESSION_LIFETIME),
    ]);
    return $token;
}

function user_cookie_is_secure(): bool
{
    $configuredUrl = (string) env_value('SITE_URL', '');
    if ($configuredUrl !== '') {
        return strtolower((string) parse_url($configuredUrl, PHP_URL_SCHEME)) === 'https';
    }
    return !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
}

function set_user_session_cookie(string $token): void
{
    setcookie(USER_SESSION_COOKIE, $token, [
        'expires' => time() + USER_SESSION_LIFETIME,
        'path' => '/',
        'secure' => user_cookie_is_secure(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function clear_user_session_cookie(): void
{
    setcookie(USER_SESSION_COOKIE, '', [
        'expires' => 1,
        'path' => '/',
        'secure' => user_cookie_is_secure(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function current_user_token(bool $required = true): ?string
{
    $token = (string) ($_COOKIE[USER_SESSION_COOKIE] ?? '');
    if (preg_match('/^[a-f0-9]{64}$/D', $token)) {
        return $token;
    }
    if ($required) {
        reject_user_session();
    }
    return null;
}

function user_csrf_token(string $sessionToken): string
{
    return hash_hmac('sha256', 'quiz-hero-user-csrf-v1', $sessionToken);
}

function require_user_csrf(string $sessionToken): void
{
    $provided = (string) ($_SERVER['HTTP_X_QUIZ_HERO_CSRF'] ?? '');
    if ($provided === '' || !hash_equals(user_csrf_token($sessionToken), $provided)) {
        json_response(['ok' => false, 'error' => 'Ungültiges Sicherheits-Token. Bitte lade die Seite neu.'], 403);
    }
}

function require_user_session(bool $requireCsrf = false): array
{
    $token = current_user_token();
    if ($requireCsrf) {
        require_user_csrf($token);
    }

    $sql = 'SELECT u.* FROM quiz_user_sessions s JOIN quiz_users u ON u.id = s.user_id WHERE s.token_hash = :hash AND s.expires_at > UTC_TIMESTAMP() AND s.last_seen_at > :idle AND u.deleted_at IS NULL AND u.email_verified_at IS NOT NULL';
    if (db()->inTransaction()) {
        $sql .= ' FOR UPDATE';
    }
    $hash = hash('sha256', $token);
    $stmt = db()->prepare($sql);
    $stmt->execute(['hash' => $hash, 'idle' => gmdate('Y-m-d H:i:s', time() - USER_SESSION_IDLE_TIMEOUT)]);
    $user = $stmt->fetch();
    if (!$user) {
        reject_user_session();
    }

    $stmt = db()->prepare('UPDATE quiz_user_sessions SET last_seen_at = UTC_TIMESTAMP() WHERE token_hash = :hash');
    $stmt->execute(['hash' => $hash]);
    return $user;
}

function issue_user_session(int $userId): string
{
    $token = create_user_token($userId);
    set_user_session_cookie($token);
    return user_csrf_token($token);
}

function reject_user_session(): never
{
    clear_user_session_cookie();
    json_response(['ok' => false, 'code' => 'SESSION_EXPIRED', 'error' => 'Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.'], 401);
}

function revoke_current_user_session(string $token): void
{
    $stmt = db()->prepare('DELETE FROM quiz_user_sessions WHERE token_hash = :hash');
    $stmt->execute(['hash' => hash('sha256', $token)]);
}

function revoke_user_sessions(int $userId): void
{
    $stmt = db()->prepare('DELETE FROM quiz_user_sessions WHERE user_id = :id');
    $stmt->execute(['id' => $userId]);
}

function require_current_password(array $user, array $data): void
{
    rate_limit('account-reauth:' . $user['id'], 10, 900);
    if (!password_verify((string) ($data['currentPassword'] ?? ''), (string) ($user['password_hash'] ?? ''))) {
        json_response(['ok' => false, 'error' => 'Bitte bestätige die Änderung mit deinem aktuellen Passwort.'], 403);
    }
}
