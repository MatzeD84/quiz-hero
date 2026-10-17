<?php
declare(strict_types=1);

function admin_login(): void
{
    require_method('POST');
    rate_limit('admin-login-global', 40, 900);
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
    unset($_SESSION['quiz_hero_csrf']);
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
    if (!empty($_SESSION['quiz_hero_admin'])) require_admin();
    $admin = $_SESSION['quiz_hero_admin'] ?? null;
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'admin' => $admin, 'csrfToken' => $admin ? csrf_token() : null]);
}

function admin_users_list(): void
{
    require_method('GET');
    require_admin();
    $stmt = db()->query('SELECT u.id, u.username, u.email, u.profile_image_url, u.avatar_key, u.email_verified_at, u.created_at, u.last_seen_at, (SELECT COUNT(*) FROM quiz_results r WHERE r.user_id = u.id) AS result_count FROM quiz_users u WHERE u.deleted_at IS NULL ORDER BY u.created_at DESC, u.id DESC');
    $users = array_map(static fn(array $user): array => format_admin_user($user), $stmt->fetchAll());
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'users' => $users]);
}

function admin_user_delete(): void
{
    require_method('POST');
    require_admin_csrf();
    $data = read_json_body();
    $id = ensure_int($data['id'] ?? 0, 1, PHP_INT_MAX);
    $pdo = db();
    $stmt = $pdo->prepare('SELECT id FROM quiz_users WHERE id = :id AND deleted_at IS NULL');
    $stmt->execute(['id' => $id]);
    if (!$stmt->fetch()) {
        json_response(['ok' => false, 'error' => 'Spieler wurde nicht gefunden.'], 404);
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('UPDATE quiz_results SET user_id = NULL WHERE user_id = :id');
        $stmt->execute(['id' => $id]);
        $stmt = $pdo->prepare('DELETE FROM quiz_users WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $pdo->commit();
    } catch (Throwable $exception) {
        $pdo->rollBack();
        throw $exception;
    }

    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION]);
}
