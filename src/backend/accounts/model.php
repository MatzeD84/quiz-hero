<?php
declare(strict_types=1);

function hero_avatars(): array
{
    $data=db()->query('SELECT avatar_key AS `key`,label,image_url AS url,unlock_rule AS unlockRule FROM quiz_avatars WHERE enabled=1 AND deleted_at IS NULL ORDER BY sort_order,avatar_key')->fetchAll();
    $avatars = [];
    foreach ($data as $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $key = clean_string((string) ($entry['key'] ?? ''), 80);
        $label = clean_string((string) ($entry['label'] ?? ''), 80);
        $url = clean_url((string) ($entry['url'] ?? ''), 500) ?: 'images/website/avatar/logo.png';
        if ($key === '' || $label === '') {
            continue;
        }
        $avatars[$key] = ['key' => $key, 'label' => $label, 'url' => $url];
        if (!empty($entry['unlockRule'])) $avatars[$key]['unlockRule']=$entry['unlockRule'];
    }

    return $avatars;
}

function normalize_avatar_key(?string $key): string
{
    $key = clean_string($key ?? '', 80);
    return array_key_exists($key, hero_avatars()) ? $key : 'hero';
}

function lock_avatar_catalog(PDO $pdo): void
{
    $pdo->query("SELECT avatar_key FROM quiz_avatars WHERE avatar_key='hero' FOR UPDATE")->fetchColumn();
}

function selectable_avatars(int $userId=0): array
{
    $owned=$userId?unlocked_avatar_keys(db(),$userId):[];
    return array_values(array_filter(hero_avatars(),static fn($avatar)=>empty($avatar['unlockRule'])||in_array($avatar['key'],$owned,true)));
}

function avatar_url(string $avatarKey): string
{
    $avatars = hero_avatars();
    return $avatars[$avatarKey]['url'] ?? $avatars['hero']['url'];
}

function normalize_email(?string $email): string
{
    $email = mb_strtolower(trim((string) $email), 'UTF-8');
    return filter_var($email, FILTER_VALIDATE_EMAIL) ? mb_substr($email, 0, 190, 'UTF-8') : '';
}

function normalize_username(?string $username): string
{
    $username = trim((string) $username);
    $username = preg_replace('/\p{C}+/u', '', $username) ?? '';
    $username = preg_replace('/\s+/u', ' ', $username) ?? '';
    return trim($username);
}

function require_username_length(string $username): void
{
    if (mb_strlen($username, 'UTF-8') < 3) {
        json_response(['ok' => false, 'error' => 'Der Benutzername muss mindestens 3 Zeichen haben.'], 422);
    }
    if (mb_strlen($username, 'UTF-8') > QUIZ_HERO_USERNAME_MAX_LENGTH) {
        json_response(['ok' => false, 'error' => 'Der Benutzername darf maximal ' . QUIZ_HERO_USERNAME_MAX_LENGTH . ' Zeichen lang sein.'], 422);
    }
}

function require_password_strength(string $password): void
{
    if (mb_strlen($password, 'UTF-8') < 10) {
        json_response(['ok' => false, 'error' => 'Das Passwort muss mindestens 10 Zeichen lang sein.'], 422);
    }
    $limit = account_password_algorithm() === PASSWORD_BCRYPT ? 72 : 1024;
    if (strlen($password) > $limit || str_contains($password, "\0")) {
        json_response(['ok' => false, 'error' => "Das Passwort ist zu lang oder enthält ein ungültiges Zeichen (maximal {$limit} UTF-8-Bytes)."], 422);
    }
}

function account_password_algorithm(): string
{
    return defined('PASSWORD_ARGON2ID') && in_array('argon2id', password_algos(), true) ? PASSWORD_ARGON2ID : PASSWORD_BCRYPT;
}

function hash_account_password(string $password): string
{
    require_password_strength($password);
    return password_hash($password, account_password_algorithm());
}

function public_base_url(): string
{
    $configured = rtrim((string) env_value('SITE_URL', ''), '/');
    if ($configured !== '') {
        return $configured;
    }
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = (string) ($_SERVER['HTTP_HOST'] ?? 'localhost:8080');
    return $https . '://' . $host;
}

function issue_account_session(PDO $pdo, int $userId): array
{
    $stmt = $pdo->prepare('UPDATE quiz_users SET last_seen_at = NOW() WHERE id = :id');
    $stmt->execute(['id' => $userId]);
    $stmt = $pdo->prepare('SELECT * FROM quiz_users WHERE id = :id');
    $stmt->execute(['id' => $userId]);
    $user = $stmt->fetch();
    if (!$user) {
        json_response(['ok' => false, 'error' => 'Account wurde nicht gefunden.'], 404);
    }
    return [
        'user' => format_account_user($user),
        'csrfToken' => issue_user_session($userId),
    ];
}

function format_account_user(array $user): array
{
    $avatarKey = normalize_avatar_key($user['avatar_key'] ?? '');
    return [
        'id' => (int) $user['id'],
        'username' => $user['username'] ?? '',
        'name' => $user['username'] ?? '',
        'email' => $user['email'] ?? '',
        'avatarKey' => $avatarKey,
        'profileImageUrl' => avatar_url($avatarKey),
        'emailVerified' => !empty($user['email_verified_at']),
        'unlockedAvatarKeys' => unlocked_avatar_keys(db(),(int)$user['id']),
        'availableAvatars' => selectable_avatars((int)$user['id']),
    ];
}

function format_admin_user(array $user): array
{
    $avatarKey = normalize_avatar_key($user['avatar_key'] ?? '');
    $profileImageUrl = trim((string) ($user['profile_image_url'] ?? ''));
    if (trim((string) ($user['avatar_key'] ?? '')) === '' || $profileImageUrl === '') {
        $profileImageUrl = avatar_url($avatarKey);
    }
    return [
        'id' => (int) $user['id'],
        'username' => $user['username'] ?? '',
        'email' => $user['email'] ?? '',
        'avatarKey' => $avatarKey,
        'profileImageUrl' => $profileImageUrl,
        'emailVerified' => !empty($user['email_verified_at']),
        'createdAt' => isset($user['created_at']) ? date(DATE_ATOM, strtotime((string) $user['created_at'])) : '',
        'lastSeenAt' => isset($user['last_seen_at']) && $user['last_seen_at'] !== null ? date(DATE_ATOM, strtotime((string) $user['last_seen_at'])) : '',
        'resultCount' => (int) ($user['result_count'] ?? 0),
        'canReset' => test_reset_allowed($user),
    ];
}

function require_account(bool $requireCsrf = true): array
{
    return require_user_session($requireCsrf);
}

function random_account_token(): string
{
    return bin2hex(random_bytes(32));
}
