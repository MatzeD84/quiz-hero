<?php

declare(strict_types=1);

// Only hashes are persisted. Legacy, self-contained tokens are deliberately rejected.
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

function require_user_token(int $userId, string $token): void
{
    if (!preg_match('/^[a-f0-9]{64}$/D', $token)) {
        reject_user_session();
    }
    $stmt = db()->prepare('SELECT s.token_hash FROM quiz_user_sessions s JOIN quiz_users u ON u.id = s.user_id WHERE s.token_hash = :hash AND s.user_id = :id AND s.expires_at > UTC_TIMESTAMP() AND s.last_seen_at > :idle AND u.deleted_at IS NULL AND u.email_verified_at IS NOT NULL' . (db()->inTransaction() ? ' FOR UPDATE' : ''));
    $hash = hash('sha256', $token);
    $stmt->execute(['hash' => $hash, 'id' => $userId, 'idle' => gmdate('Y-m-d H:i:s', time() - USER_SESSION_IDLE_TIMEOUT)]);
    if (!$stmt->fetch()) {
        reject_user_session();
    }
    $stmt = db()->prepare('UPDATE quiz_user_sessions SET last_seen_at = UTC_TIMESTAMP() WHERE token_hash = :hash');
    $stmt->execute(['hash' => $hash]);
}

function reject_user_session(): never
{
    json_response(['ok' => false, 'code' => 'SESSION_EXPIRED', 'error' => 'Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.'], 401);
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
