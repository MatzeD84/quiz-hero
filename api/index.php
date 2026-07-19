<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

const QUIZ_HERO_API_VERSION = '1';
const QUIZ_HERO_MAX_IMAGE_UPLOAD_BYTES = 25165824;
const QUIZ_HERO_CONSENT_VERSION = '2026-06-30';

$action = $_GET['action'] ?? 'public-data';
$apiVersion = trim((string) ($_GET['v'] ?? QUIZ_HERO_API_VERSION));

if ($apiVersion !== QUIZ_HERO_API_VERSION) {
    json_response([
        'ok' => false,
        'error' => 'Nicht unterstuetzte API-Version.',
        'supportedVersions' => [QUIZ_HERO_API_VERSION],
    ], 400);
}

try {
    match ($action) {
        'public-data' => public_data(),
        'save-result' => save_result(),
        'account-register' => account_register(),
        'account-verify-email' => account_verify_email(),
        'account-login' => account_login(),
        'account-dev-login' => account_dev_login(),
        'account-me' => account_me(),
        'account-update' => account_update(),
        'account-delete' => account_delete(),
        'account-request-password-reset' => account_request_password_reset(),
        'account-reset-password' => account_reset_password(),
        'admin-login' => admin_login(),
        'admin-logout' => admin_logout(),
        'admin-me' => admin_me(),
        'admin-data' => admin_data(),
        'seo-export' => seo_export(),
        'admin-question-save' => admin_question_save(),
        'admin-question-delete' => admin_question_delete(),
        'admin-category-save' => admin_category_save(),
        'admin-image-upload' => admin_image_upload(),
        default => json_response(['ok' => false, 'error' => 'Unbekannte API-Aktion.'], 404),
    };
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    json_response(['ok' => false, 'error' => 'Datenbankfehler. Bitte Konfiguration prüfen.'], 500);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    json_response(['ok' => false, 'error' => 'Serverfehler.'], 500);
}

function public_data(): void
{
    require_method('GET');
    emit_quiz_data(true);
}

function admin_data(): void
{
    require_method('GET');
    require_admin();
    emit_quiz_data(false);
}

function emit_quiz_data(bool $onlyActive): void
{
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION] + load_quiz_data($onlyActive, false));
}

function seo_export(): void
{
    require_method('GET');
    require_seo_export_token();
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'generatedAt' => gmdate(DATE_ATOM)] + load_quiz_data(true, true));
}

function load_quiz_data(bool $onlyActive, bool $onlyEnabledCategories): array
{
    $pdo = db();

    $categoriesStmt = $pdo->query('SELECT * FROM quiz_categories ORDER BY sort_order ASC, title ASC');
    $categoryRows = array_values(array_filter(
        $categoriesStmt->fetchAll(),
        static fn(array $category): bool => !$onlyEnabledCategories || (bool) $category['enabled']
    ));

    $questionSql = 'SELECT * FROM quiz_questions' . ($onlyActive ? ' WHERE active = 1' : '') . ' ORDER BY category_id ASC, sort_order ASC, id ASC';
    $questionRows = $pdo->query($questionSql)->fetchAll();
    $questionsByCategory = [];
    foreach ($questionRows as $questionRow) {
        $questionsByCategory[$questionRow['category_id']][] = format_question($questionRow);
    }

    $categories = array_map(
        static fn(array $category): array => format_category($category, $questionsByCategory[$category['id']] ?? []),
        $categoryRows
    );

    $tagsStmt = $pdo->query('SELECT * FROM quiz_tags ORDER BY sort_order ASC, title ASC');
    $tags = array_map(static fn(array $tag): array => [
        'id' => $tag['id'],
        'title' => $tag['title'],
        'description' => $tag['description'] ?? '',
        'icon' => $tag['icon'] ?? '',
        'enabled' => (bool) ($tag['enabled'] ?? true),
        'badge' => decode_json_field($tag['badge_json'] ?? null, ['active' => false, 'text' => '']),
    ], $tagsStmt->fetchAll());

    $feedbackStmt = $pdo->query('SELECT feedback_key, messages_json FROM quiz_feedback');
    $feedback = [];
    foreach ($feedbackStmt->fetchAll() as $entry) {
        $feedback[$entry['feedback_key']] = decode_json_field($entry['messages_json'] ?? null, []);
    }

    return ['categories' => $categories, 'tags' => $tags, 'feedback' => $feedback];
}

function require_seo_export_token(): void
{
    $expected = env_value('QUIZ_HERO_SEO_EXPORT_TOKEN');
    if ($expected === null || $expected === '') {
        json_response(['ok' => false, 'error' => 'SEO-Export ist nicht konfiguriert.'], 503);
    }

    $provided = (string) ($_SERVER['HTTP_X_QUIZ_HERO_SEO_TOKEN'] ?? ($_GET['token'] ?? ''));
    if ($provided === '' || !hash_equals($expected, $provided)) {
        json_response(['ok' => false, 'error' => 'SEO-Export nicht erlaubt.'], 403);
    }
}

function hero_avatars(): array
{
    $path = dirname(__DIR__) . '/data/avatars.json';
    $defaults = [
        'hero' => ['key' => 'hero', 'label' => 'Quiz-Hero', 'url' => 'images/website/avatar/logo.png'],
    ];

    if (!is_file($path)) {
        return $defaults;
    }

    $contents = @file_get_contents($path);
    if ($contents === false) {
        return $defaults;
    }

    $data = json_decode($contents, true);
    if (!is_array($data)) {
        return $defaults;
    }

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
    }

    return $avatars !== [] ? $avatars : $defaults;
}

function normalize_avatar_key(?string $key): string
{
    $key = clean_string($key ?? '', 80);
    return array_key_exists($key, hero_avatars()) ? $key : 'hero';
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
    $username = mb_strtolower(trim((string) $username), 'UTF-8');
    $username = preg_replace('/[^a-z0-9_-]+/u', '-', $username) ?? '';
    $username = trim($username, '-_');
    return mb_substr($username, 0, 80, 'UTF-8');
}

function require_password_strength(string $password): void
{
    if (mb_strlen($password, 'UTF-8') < 10) {
        json_response(['ok' => false, 'error' => 'Das Passwort muss mindestens 10 Zeichen lang sein.'], 422);
    }
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

function issue_account_token(PDO $pdo, int $userId): array
{
    $stmt = $pdo->prepare('UPDATE quiz_users SET last_seen_at = NOW() WHERE id = :id');
    $stmt->execute(['id' => $userId]);
    $stmt = $pdo->prepare('SELECT * FROM quiz_users WHERE id = :id');
    $stmt->execute(['id' => $userId]);
    $user = $stmt->fetch();
    if (!$user) {
        json_response(['ok' => false, 'error' => 'Account wurde nicht gefunden.'], 404);
    }
    return format_account_user($user);
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
        'token' => create_user_token((int) $user['id']),
    ];
}

function require_account_from_payload(array $data): array
{
    $userId = ensure_int($data['userId'] ?? 0, 1, PHP_INT_MAX);
    require_user_token($userId, (string) ($data['userToken'] ?? ''));
    $stmt = db()->prepare('SELECT * FROM quiz_users WHERE id = :id AND deleted_at IS NULL');
    $stmt->execute(['id' => $userId]);
    $user = $stmt->fetch();
    if (!$user) {
        json_response(['ok' => false, 'error' => 'Account wurde nicht gefunden.'], 404);
    }
    return $user;
}

function random_account_token(): string
{
    return bin2hex(random_bytes(32));
}

function send_account_mail(string $to, string $subject, string $message): void
{
    $from = env_value('QUIZ_HERO_MAIL_FROM', 'helden@quiz-hero.de');
    $transport = env_value('QUIZ_HERO_MAIL_TRANSPORT', 'log');
    $headers = [
        'From: Quiz-Hero <' . $from . '>',
        'Reply-To: ' . $from,
        'Content-Type: text/plain; charset=UTF-8',
        'X-Mailer: Quiz-Hero',
    ];

    if ($transport === 'mail') {
        if (@mail($to, $subject, $message, implode("\r\n", $headers))) {
            return;
        }
        error_log('Quiz-Hero mail() failed for ' . $to);
    }

    $dir = dirname(__DIR__) . '/var';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    @file_put_contents(
        $dir . '/mail.log',
        '[' . gmdate(DATE_ATOM) . "] To: {$to}\nSubject: {$subject}\n{$message}\n\n",
        FILE_APPEND
    );
}

function store_email_verification(PDO $pdo, int $userId, string $email): void
{
    $token = random_account_token();
    $stmt = $pdo->prepare('INSERT INTO quiz_email_verifications (user_id, token_hash, expires_at) VALUES (:user_id, :token_hash, DATE_ADD(NOW(), INTERVAL 24 HOUR))');
    $stmt->execute(['user_id' => $userId, 'token_hash' => hash('sha256', $token)]);

    $link = public_base_url() . '/login.html?verifyToken=' . urlencode($token);
    send_account_mail(
        $email,
        'Quiz-Hero Registrierung bestaetigen',
        "Hallo,\n\nbitte bestaetige deine Registrierung bei Quiz-Hero:\n{$link}\n\nWenn du dich nicht registriert hast, ignoriere diese E-Mail.\n\nViele Gruesse\nQuiz-Hero"
    );
}

function account_register(): void
{
    require_method('POST');
    rate_limit('account-register', 8, 900);
    $data = read_json_body();
    $username = normalize_username($data['username'] ?? '');
    $email = normalize_email($data['email'] ?? '');
    $password = (string) ($data['password'] ?? '');
    $avatarKey = normalize_avatar_key($data['avatarKey'] ?? '');
    $privacyAccepted = !empty($data['privacyAccepted']);

    if (mb_strlen($username, 'UTF-8') < 3) {
        json_response(['ok' => false, 'error' => 'Der Benutzername muss mindestens 3 Zeichen haben.'], 422);
    }
    if ($email === '') {
        json_response(['ok' => false, 'error' => 'Bitte gib eine gueltige E-Mail-Adresse ein.'], 422);
    }
    require_password_strength($password);
    if (!$privacyAccepted) {
        json_response(['ok' => false, 'error' => 'Bitte bestaetige die Datenschutz-Hinweise.'], 422);
    }

    $pdo = db();
    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare('INSERT INTO quiz_users (username, email, password_hash, profile_image_url, avatar_key, privacy_accepted_at, last_seen_at) VALUES (:username, :email, :password_hash, :profile_image_url, :avatar_key, NOW(), NOW())');
        $stmt->execute([
            'username' => $username,
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'profile_image_url' => avatar_url($avatarKey),
            'avatar_key' => $avatarKey,
        ]);
        $userId = (int) $pdo->lastInsertId();
        $stmt = $pdo->prepare('INSERT INTO quiz_account_consents (user_id, consent_key, consent_version, accepted_at, ip_hash, user_agent_hash) VALUES (:user_id, :consent_key, :consent_version, NOW(), :ip_hash, :user_agent_hash)');
        $stmt->execute([
            'user_id' => $userId,
            'consent_key' => 'privacy_notice',
            'consent_version' => QUIZ_HERO_CONSENT_VERSION,
            'ip_hash' => hash('sha256', client_ip()),
            'user_agent_hash' => hash('sha256', (string) ($_SERVER['HTTP_USER_AGENT'] ?? '')),
        ]);
        store_email_verification($pdo, $userId, $email);
        $pdo->commit();
    } catch (PDOException $exception) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        if ($exception->getCode() === '23000') {
            json_response(['ok' => false, 'error' => 'Benutzername oder E-Mail wird bereits verwendet.'], 409);
        }
        throw $exception;
    }

    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'message' => 'Registrierung gespeichert. Bitte bestaetige deine E-Mail.']);
}

function account_verify_email(): void
{
    require_method('POST');
    $data = read_json_body();
    $token = (string) ($data['token'] ?? '');
    if ($token === '') {
        json_response(['ok' => false, 'error' => 'Bestaetigungs-Token fehlt.'], 422);
    }

    $pdo = db();
    $stmt = $pdo->prepare('SELECT * FROM quiz_email_verifications WHERE token_hash = :token_hash AND used_at IS NULL AND expires_at > NOW()');
    $stmt->execute(['token_hash' => hash('sha256', $token)]);
    $row = $stmt->fetch();
    if (!$row) {
        json_response(['ok' => false, 'error' => 'Der Bestaetigungslink ist ungueltig oder abgelaufen.'], 400);
    }

    $pdo->beginTransaction();
    $stmt = $pdo->prepare('UPDATE quiz_email_verifications SET used_at = NOW() WHERE id = :id');
    $stmt->execute(['id' => $row['id']]);
    $stmt = $pdo->prepare('UPDATE quiz_users SET email_verified_at = NOW() WHERE id = :id');
    $stmt->execute(['id' => $row['user_id']]);
    $pdo->commit();

    $user = issue_account_token($pdo, (int) $row['user_id']);
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'user' => $user]);
}

function account_login(): void
{
    require_method('POST');
    $data = read_json_body();
    $identifier = mb_strtolower(clean_string($data['identifier'] ?? '', 190), 'UTF-8');
    $password = (string) ($data['password'] ?? '');
    rate_limit('account-login:' . $identifier, 10, 900);

    $stmt = db()->prepare('SELECT * FROM quiz_users WHERE deleted_at IS NULL AND (email = :email OR username = :username)');
    $stmt->execute(['email' => $identifier, 'username' => $identifier]);
    $user = $stmt->fetch();
    if (!$user || empty($user['password_hash']) || !password_verify($password, $user['password_hash'])) {
        json_response(['ok' => false, 'error' => 'Login-Daten sind ungueltig.'], 401);
    }
    if (empty($user['email_verified_at'])) {
        json_response(['ok' => false, 'error' => 'Bitte bestaetige zuerst deine E-Mail-Adresse.'], 403);
    }

    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'user' => issue_account_token(db(), (int) $user['id'])]);
}

function account_dev_login(): void
{
    require_method('POST');
    $enabled = env_value('QUIZ_HERO_ALLOW_DEV_ACCOUNT_LOGIN', 'false') === 'true';
    if (!$enabled) {
        json_response(['ok' => false, 'error' => 'Dev-Login ist nicht aktiviert.'], 403);
    }

    $pdo = db();
    $username = normalize_username(env_value('QUIZ_HERO_DEV_ACCOUNT_USER', 'localhero'));
    $email = normalize_email(env_value('QUIZ_HERO_DEV_ACCOUNT_EMAIL', 'localhero@example.test'));
    $avatarKey = normalize_avatar_key('hero');

    $stmt = $pdo->prepare('SELECT id FROM quiz_users WHERE username = :username');
    $stmt->execute(['username' => $username]);
    $existing = $stmt->fetch();
    if ($existing) {
        $userId = (int) $existing['id'];
        $stmt = $pdo->prepare('UPDATE quiz_users SET email_verified_at = COALESCE(email_verified_at, NOW()), deleted_at = NULL WHERE id = :id');
        $stmt->execute(['id' => $userId]);
    } else {
        $stmt = $pdo->prepare('INSERT INTO quiz_users (username, email, password_hash, profile_image_url, avatar_key, email_verified_at, privacy_accepted_at, last_seen_at) VALUES (:username, :email, :password_hash, :profile_image_url, :avatar_key, NOW(), NOW(), NOW())');
        $stmt->execute([
            'username' => $username,
            'email' => $email,
            'password_hash' => password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT),
            'profile_image_url' => avatar_url($avatarKey),
            'avatar_key' => $avatarKey,
        ]);
        $userId = (int) $pdo->lastInsertId();
    }

    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'user' => issue_account_token($pdo, $userId)]);
}

function account_me(): void
{
    require_method('POST');
    $user = require_account_from_payload(read_json_body());
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'user' => format_account_user($user)]);
}

function account_update(): void
{
    require_method('POST');
    $data = read_json_body();
    $user = require_account_from_payload($data);
    $username = normalize_username($data['username'] ?? $user['username']);
    $avatarKey = normalize_avatar_key($data['avatarKey'] ?? $user['avatar_key']);
    $password = (string) ($data['password'] ?? '');
    if (mb_strlen($username, 'UTF-8') < 3) {
        json_response(['ok' => false, 'error' => 'Der Benutzername muss mindestens 3 Zeichen haben.'], 422);
    }

    $params = [
        'id' => (int) $user['id'],
        'username' => $username,
        'avatar_key' => $avatarKey,
        'profile_image_url' => avatar_url($avatarKey),
    ];
    $passwordSql = '';
    if ($password !== '') {
        require_password_strength($password);
        $passwordSql = ', password_hash = :password_hash';
        $params['password_hash'] = password_hash($password, PASSWORD_DEFAULT);
    }

    try {
        $stmt = db()->prepare('UPDATE quiz_users SET username = :username, avatar_key = :avatar_key, profile_image_url = :profile_image_url' . $passwordSql . ' WHERE id = :id');
        $stmt->execute($params);
    } catch (PDOException $exception) {
        if ($exception->getCode() === '23000') {
            json_response(['ok' => false, 'error' => 'Der Benutzername ist bereits vergeben.'], 409);
        }
        throw $exception;
    }

    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'user' => issue_account_token(db(), (int) $user['id'])]);
}

function account_delete(): void
{
    require_method('POST');
    $data = read_json_body();
    $user = require_account_from_payload($data);
    $confirm = (string) ($data['confirm'] ?? '');
    if ($confirm !== 'DELETE') {
        json_response(['ok' => false, 'error' => 'Bitte bestaetige die Loeschung mit DELETE.'], 422);
    }

    $pdo = db();
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('UPDATE quiz_results SET user_id = NULL WHERE user_id = :id');
    $stmt->execute(['id' => (int) $user['id']]);
    $stmt = $pdo->prepare('UPDATE quiz_users SET username = NULL, email = NULL, password_hash = NULL, profile_image_url = NULL, avatar_key = NULL, deleted_at = NOW() WHERE id = :id');
    $stmt->execute(['id' => (int) $user['id']]);
    $pdo->commit();

    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION]);
}

function account_request_password_reset(): void
{
    require_method('POST');
    rate_limit('account-password-reset', 8, 900);
    $data = read_json_body();
    $email = normalize_email($data['email'] ?? '');
    if ($email !== '') {
        $pdo = db();
        $stmt = $pdo->prepare('SELECT id FROM quiz_users WHERE email = :email AND deleted_at IS NULL');
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();
        if ($user) {
            $token = random_account_token();
            $stmt = $pdo->prepare('INSERT INTO quiz_password_resets (user_id, token_hash, expires_at) VALUES (:user_id, :token_hash, DATE_ADD(NOW(), INTERVAL 1 HOUR))');
            $stmt->execute(['user_id' => (int) $user['id'], 'token_hash' => hash('sha256', $token)]);
            $link = public_base_url() . '/login.html?resetToken=' . urlencode($token);
            send_account_mail(
                $email,
                'Quiz-Hero Passwort zuruecksetzen',
                "Hallo,\n\nhier kannst du dein Quiz-Hero Passwort zuruecksetzen:\n{$link}\n\nDer Link ist 1 Stunde gueltig.\n\nViele Gruesse\nQuiz-Hero"
            );
        }
    }
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'message' => 'Falls die E-Mail bekannt ist, wurde ein Reset-Link verschickt.']);
}

function account_reset_password(): void
{
    require_method('POST');
    $data = read_json_body();
    $token = (string) ($data['token'] ?? '');
    $password = (string) ($data['password'] ?? '');
    require_password_strength($password);

    $pdo = db();
    $stmt = $pdo->prepare('SELECT * FROM quiz_password_resets WHERE token_hash = :token_hash AND used_at IS NULL AND expires_at > NOW()');
    $stmt->execute(['token_hash' => hash('sha256', $token)]);
    $row = $stmt->fetch();
    if (!$row) {
        json_response(['ok' => false, 'error' => 'Der Reset-Link ist ungueltig oder abgelaufen.'], 400);
    }

    $pdo->beginTransaction();
    $stmt = $pdo->prepare('UPDATE quiz_password_resets SET used_at = NOW() WHERE id = :id');
    $stmt->execute(['id' => $row['id']]);
    $stmt = $pdo->prepare('UPDATE quiz_users SET password_hash = :password_hash WHERE id = :id');
    $stmt->execute(['id' => $row['user_id'], 'password_hash' => password_hash($password, PASSWORD_DEFAULT)]);
    $pdo->commit();

    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'user' => issue_account_token($pdo, (int) $row['user_id'])]);
}

function save_result(): void
{
    require_method('POST');
    rate_limit('save-result', 60, 300);
    $data = read_json_body();
    $userId = ensure_int($data['userId'] ?? 0, 1, PHP_INT_MAX);
    require_user_token($userId, (string) ($data['userToken'] ?? ''));
    $score = ensure_int($data['score'] ?? 0, 0, 100000);
    $maxScore = ensure_int($data['maxScore'] ?? 0, 0, 100000);
    $solved = ensure_int($data['solved'] ?? 0, 0, 100000);
    $total = ensure_int($data['total'] ?? 0, 0, 100000);
    $categoryId = clean_string($data['categoryId'] ?? '', 120) ?: null;
    $tagId = clean_string($data['tagId'] ?? '', 120) ?: null;

    $pdo = db();
    $stmt = $pdo->prepare('INSERT INTO quiz_results (user_id, category_id, tag_id, score, max_score, solved, total_questions) VALUES (:user_id, :category_id, :tag_id, :score, :max_score, :solved, :total_questions)');
    $stmt->execute([
        'user_id' => $userId,
        'category_id' => $categoryId,
        'tag_id' => $tagId,
        'score' => $score,
        'max_score' => $maxScore,
        'solved' => $solved,
        'total_questions' => $total,
    ]);

    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION]);
}

function admin_login(): void
{
    require_method('POST');
    quiz_hero_start_session();
    $data = read_json_body();
    $username = clean_string($data['username'] ?? '', 120);
    $password = (string) ($data['password'] ?? '');
    rate_limit('admin-login:' . $username, 8, 900);

    $expectedUser = env_value('QUIZ_HERO_ADMIN_USER', 'admin');
    $hash = env_value('QUIZ_HERO_ADMIN_PASSWORD_HASH');
    $plain = env_value('QUIZ_HERO_ADMIN_PASSWORD');
    $passwordOk = $hash ? password_verify($password, $hash) : ($plain !== null && hash_equals($plain, $password));

    if (!hash_equals((string) $expectedUser, $username) || !$passwordOk) {
        json_response(['ok' => false, 'error' => 'Admin-Zugangsdaten sind ungültig.'], 401);
    }

    session_regenerate_id(true);
    $_SESSION['quiz_hero_admin'] = ['username' => $expectedUser, 'loggedInAt' => time()];
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'admin' => ['username' => $expectedUser], 'csrfToken' => csrf_token()]);
}

function admin_logout(): void
{
    require_method('POST');
    require_admin_csrf();
    $_SESSION = [];
    session_destroy();
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION]);
}

function admin_me(): void
{
    require_method('GET');
    quiz_hero_start_session();
    $admin = $_SESSION['quiz_hero_admin'] ?? null;
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'admin' => $admin, 'csrfToken' => $admin ? csrf_token() : null]);
}

function admin_question_save(): void
{
    require_method('POST');
    require_admin_csrf();
    $data = read_json_body();
    $question = normalize_question_payload($data);
    $pdo = db();

    if (!empty($data['id'])) {
        $stmt = $pdo->prepare('UPDATE quiz_questions SET category_id = :category_id, question = :question, answers_json = :answers_json, correct_index = :correct_index, difficulty = :difficulty, question_type = :question_type, image_url = :image_url, tags_json = :tags_json, background_knowledge = :background_knowledge, active = :active, sort_order = :sort_order WHERE id = :id');
        $question['id'] = ensure_int($data['id'], 1, PHP_INT_MAX);
    } else {
        $stmt = $pdo->prepare('INSERT INTO quiz_questions (category_id, question, answers_json, correct_index, difficulty, question_type, image_url, tags_json, background_knowledge, active, sort_order) VALUES (:category_id, :question, :answers_json, :correct_index, :difficulty, :question_type, :image_url, :tags_json, :background_knowledge, :active, :sort_order)');
    }
    $stmt->execute($question);

    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'id' => !empty($question['id']) ? $question['id'] : (int) $pdo->lastInsertId()]);
}

function admin_question_delete(): void
{
    require_method('POST');
    require_admin_csrf();
    $data = read_json_body();
    $id = ensure_int($data['id'] ?? 0, 1, PHP_INT_MAX);
    $stmt = db()->prepare('DELETE FROM quiz_questions WHERE id = :id');
    $stmt->execute(['id' => $id]);
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION]);
}

function admin_category_save(): void
{
    require_method('POST');
    require_admin_csrf();
    $data = read_json_body();
    $title = clean_string($data['title'] ?? '', 120);
    $id = slugify((string) ($data['id'] ?? $title));
    if ($title === '') {
        json_response(['ok' => false, 'error' => 'Kategorie-Titel fehlt.'], 422);
    }
    $payload = [
        'id' => $id,
        'title' => $title,
        'description' => clean_string($data['description'] ?? '', 255),
        'seo_description' => clean_string($data['seoDescription'] ?? '', 2000),
        'icon' => clean_url($data['icon'] ?? '', 500) ?: null,
        'enabled' => !empty($data['enabled']) ? 1 : 0,
        'badge_json' => json_encode(['active' => !empty($data['badgeActive']), 'text' => clean_string($data['badgeText'] ?? 'Neu', 40)], JSON_UNESCAPED_UNICODE),
        'sort_order' => ensure_int($data['sortOrder'] ?? 100, 0, 100000),
    ];
    $stmt = db()->prepare('INSERT INTO quiz_categories (id, title, description, seo_description, icon, enabled, badge_json, sort_order) VALUES (:id, :title, :description, :seo_description, :icon, :enabled, :badge_json, :sort_order) ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), seo_description = VALUES(seo_description), icon = VALUES(icon), enabled = VALUES(enabled), badge_json = VALUES(badge_json), sort_order = VALUES(sort_order)');
    $stmt->execute($payload);
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'id' => $id]);
}

function admin_image_upload(): void
{
    require_method('POST');
    require_admin_csrf();
    rate_limit('admin-image-upload', 40, 300);

    $contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($contentLength > 0 && $contentLength > QUIZ_HERO_MAX_IMAGE_UPLOAD_BYTES + 1048576) {
        json_response(['ok' => false, 'error' => 'Das Bild ist zu gross. Maximal erlaubt sind 24 MB.'], 413);
    }

    $rawCategoryId = clean_string($_POST['categoryId'] ?? '', 120);
    if ($rawCategoryId === '') {
        json_response(['ok' => false, 'error' => 'Kategorie fehlt.'], 422);
    }
    $categoryId = slugify($rawCategoryId);

    $stmt = db()->prepare('SELECT id FROM quiz_categories WHERE id = :id');
    $stmt->execute(['id' => $categoryId]);
    if (!$stmt->fetch()) {
        json_response(['ok' => false, 'error' => 'Kategorie wurde nicht gefunden.'], 422);
    }

    $file = $_FILES['image'] ?? null;
    if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        json_response(['ok' => false, 'error' => 'Bitte waehle eine Bilddatei aus.'], 422);
    }

    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        json_response(['ok' => false, 'error' => upload_error_message((int) $file['error'])], 400);
    }

    $size = (int) ($file['size'] ?? 0);
    if ($size <= 0 || $size > QUIZ_HERO_MAX_IMAGE_UPLOAD_BYTES) {
        json_response(['ok' => false, 'error' => 'Das Bild darf maximal 24 MB gross sein.'], 413);
    }

    $tmpName = (string) ($file['tmp_name'] ?? '');
    if ($tmpName === '' || !is_uploaded_file($tmpName)) {
        json_response(['ok' => false, 'error' => 'Upload konnte nicht verarbeitet werden.'], 400);
    }

    $imageInfo = @getimagesize($tmpName);
    if ($imageInfo === false) {
        json_response(['ok' => false, 'error' => 'Die Datei ist kein gueltiges Bild.'], 422);
    }

    $mime = detect_mime_type($tmpName);
    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];
    if (!isset($allowed[$mime])) {
        json_response(['ok' => false, 'error' => 'Erlaubt sind JPG, PNG und WebP. SVG/HTML/PHP sind nicht erlaubt.'], 422);
    }

    $baseDir = dirname(__DIR__) . '/images/uploads';
    $categoryDir = $baseDir . '/' . $categoryId;
    if (!is_dir($categoryDir) && !mkdir($categoryDir, 0755, true) && !is_dir($categoryDir)) {
        json_response(['ok' => false, 'error' => 'Upload-Ordner konnte nicht erstellt werden.'], 500);
    }

    $originalName = pathinfo((string) ($file['name'] ?? 'quiz-bild'), PATHINFO_FILENAME);
    $safeName = slugify($originalName);
    $extension = $allowed[$mime];
    $filename = sprintf('%s-%s.%s', $safeName, bin2hex(random_bytes(6)), $extension);
    $target = $categoryDir . '/' . $filename;

    if (!move_uploaded_file($tmpName, $target)) {
        json_response(['ok' => false, 'error' => 'Bild konnte nicht gespeichert werden.'], 500);
    }

    @chmod($target, 0644);

    $relativePath = sprintf('images/uploads/%s/%s', $categoryId, $filename);
    json_response([
        'ok' => true,
        'apiVersion' => QUIZ_HERO_API_VERSION,
        'path' => $relativePath,
        'mimeType' => $mime,
        'size' => $size,
        'width' => (int) ($imageInfo[0] ?? 0),
        'height' => (int) ($imageInfo[1] ?? 0),
    ]);
}

function detect_mime_type(string $path): string
{
    if (class_exists('finfo')) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($path);
        if (is_string($mime) && $mime !== '') {
            return $mime;
        }
    }

    return (string) (mime_content_type($path) ?: '');
}

function upload_error_message(int $error): string
{
    return match ($error) {
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Das Bild ist zu gross.',
        UPLOAD_ERR_PARTIAL => 'Das Bild wurde nur teilweise hochgeladen.',
        UPLOAD_ERR_NO_TMP_DIR => 'Server-Upload-Ordner fehlt.',
        UPLOAD_ERR_CANT_WRITE => 'Bild konnte nicht auf dem Server gespeichert werden.',
        UPLOAD_ERR_EXTENSION => 'Upload wurde von einer PHP-Erweiterung gestoppt.',
        default => 'Upload fehlgeschlagen.',
    };
}

function normalize_question_payload(array $data): array
{
    $answers = array_values(array_filter(array_map(static fn($answer): string => clean_string((string) $answer, 255), $data['answers'] ?? []), static fn(string $answer): bool => $answer !== ''));
    if (count($answers) !== 4) {
        json_response(['ok' => false, 'error' => 'Bitte genau vier Antworten ausfüllen.'], 422);
    }
    $correct = ensure_int($data['correct'] ?? 0, 0, 3);
    $difficulty = clean_string($data['difficulty'] ?? 'easy', 20);
    if (!in_array($difficulty, ['easy', 'medium', 'hero'], true)) {
        $difficulty = 'easy';
    }
    $imageUrl = clean_url($data['imageUrl'] ?? '', 500);
    $type = $imageUrl !== '' ? 'image' : 'text';
    $tags = array_values(array_filter(array_map(static fn($tag): string => slugify((string) $tag), explode(',', (string) ($data['tags'] ?? '')))));

    return [
        'category_id' => slugify((string) ($data['categoryId'] ?? '')),
        'question' => clean_string($data['question'] ?? '', 1000),
        'answers_json' => json_encode($answers, JSON_UNESCAPED_UNICODE),
        'correct_index' => $correct,
        'difficulty' => $difficulty,
        'question_type' => $type,
        'image_url' => $imageUrl ?: null,
        'tags_json' => json_encode($tags, JSON_UNESCAPED_UNICODE),
        'background_knowledge' => clean_string($data['backgroundKnowledge'] ?? '', 2000) ?: null,
        'active' => !empty($data['active']) ? 1 : 0,
        'sort_order' => ensure_int($data['sortOrder'] ?? 100, 0, 100000),
    ];
}

function format_category(array $category, array $questions): array
{
    return [
        'id' => $category['id'],
        'title' => $category['title'],
        'enabled' => (bool) $category['enabled'],
        'icon' => $category['icon'] ?? '',
        'description' => $category['description'] ?? '',
        'seoDescription' => $category['seo_description'] ?? '',
        'questionsFile' => null,
        'badge' => decode_json_field($category['badge_json'] ?? null, ['active' => false, 'text' => '']),
        'questions' => $questions,
    ];
}

function format_question(array $question): array
{
    return [
        'id' => (int) $question['id'],
        'categoryId' => $question['category_id'],
        'question' => $question['question'],
        'answers' => decode_json_field($question['answers_json'] ?? null, []),
        'correct' => (int) $question['correct_index'],
        'difficulty' => $question['difficulty'],
        'type' => $question['question_type'],
        'imageUrl' => $question['image_url'] ?? '',
        'tag' => decode_json_field($question['tags_json'] ?? null, []),
        'backgroundKnowledge' => $question['background_knowledge'] ?? '',
        'active' => (bool) $question['active'],
        'sortOrder' => (int) $question['sort_order'],
    ];
}
