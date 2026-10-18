<?php
declare(strict_types=1);

function store_email_verification(PDO $pdo, int $userId, string $email): void
{
    $token = random_account_token();
    $stmt = $pdo->prepare('INSERT INTO quiz_email_verifications (user_id, token_hash, expires_at) VALUES (:user_id, :token_hash, DATE_ADD(NOW(), INTERVAL 24 HOUR))');
    $stmt->execute(['user_id' => $userId, 'token_hash' => hash('sha256', $token)]);

    $link = public_base_url() . '/login.html?verifyToken=' . urlencode($token);
    send_account_mail(
        $email,
        'Quiz-Hero Registrierung bestätigen',
        "Hallo,\n\nbitte bestätige deine Registrierung bei Quiz-Hero:\n{$link}\n\nDer Link ist 24 Stunden gültig.\n\nWenn du dich nicht registriert hast, ignoriere diese E-Mail.\n\nViele Grüße\nQuiz-Hero",
        account_verification_mail_html($link)
    );
}

function account_resend_verification(): void
{
    require_method('POST');
    rate_limit('account-resend-verification', 5, 900);
    $data = read_json_body();
    $email = normalize_email($data['email'] ?? '');
    if ($email === '') json_response(['ok' => false, 'error' => 'Bitte gültige E-Mail eingeben.'], 422);
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT id FROM quiz_users WHERE email = ? AND deleted_at IS NULL AND email_verified_at IS NULL FOR UPDATE');
        $stmt->execute([$email]);
        $id = $stmt->fetchColumn();
        if ($id !== false) {
            // Retain the previous usable link if delivery of the replacement fails.
            $pdo->prepare('DELETE FROM quiz_email_verifications WHERE user_id = ?')->execute([$id]);
            store_email_verification($pdo, (int) $id, $email);
        }
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('Verification resend failed.');
    }
    json_response(['ok' => true, 'message' => 'Falls ein unbestätigtes Konto existiert, wird eine Bestätigungsmail verschickt. Prüfe auch den Spamordner. Bei ausbleibender Mail versuche es später erneut.']);
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

    require_username_length($username);
    if ($email === '') {
        json_response(['ok' => false, 'error' => 'Bitte gib eine gültige E-Mail-Adresse ein.'], 422);
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
            'password_hash' => hash_account_password($password),
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
        notify_registration_created($username, $email);
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
        json_response(['ok' => false, 'error' => 'Bestätigungs-Token fehlt.'], 422);
    }

    $pdo = db();
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT * FROM quiz_email_verifications WHERE token_hash = :token_hash AND used_at IS NULL AND expires_at > NOW() FOR UPDATE');
    $stmt->execute(['token_hash' => hash('sha256', $token)]);
    $row = $stmt->fetch();
    if (!$row) {
        json_response(['ok' => false, 'error' => 'Der Bestätigungslink ist ungültig oder abgelaufen.'], 400);
    }

    $stmt = $pdo->prepare('SELECT id FROM quiz_users WHERE id = :id AND deleted_at IS NULL FOR UPDATE');
    $stmt->execute(['id' => $row['user_id']]);
    if (!$stmt->fetch()) {
        json_response(['ok' => false, 'error' => 'Der Bestätigungslink ist ungültig oder abgelaufen.'], 400);
    }
    $stmt = $pdo->prepare('UPDATE quiz_email_verifications SET used_at = NOW() WHERE id = :id');
    $stmt->execute(['id' => $row['id']]);
    $stmt = $pdo->prepare('UPDATE quiz_users SET email_verified_at = NOW() WHERE id = :id');
    $stmt->execute(['id' => $row['user_id']]);
    $session = issue_account_session($pdo, (int) $row['user_id']);
    $pdo->commit();
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'user' => $session['user'], 'csrfToken' => $session['csrfToken']]);
}

function account_login(): void
{
    require_method('POST');
    rate_limit('account-login-global', 40, 900);
    $data = read_json_body();
    $identifier = mb_strtolower(clean_string($data['identifier'] ?? '', 190), 'UTF-8');
    $password = (string) ($data['password'] ?? '');
    rate_limit('account-login:' . $identifier, 10, 900);

    db()->beginTransaction();
    $stmt = db()->prepare('SELECT * FROM quiz_users WHERE deleted_at IS NULL AND (email = :email OR username = :username) FOR UPDATE');
    $stmt->execute(['email' => $identifier, 'username' => $identifier]);
    $user = $stmt->fetch();
    if (!$user || empty($user['password_hash']) || !password_verify($password, $user['password_hash'])) {
        json_response(['ok' => false, 'error' => 'Login-Daten sind ungültig.'], 401);
    }
    if (empty($user['email_verified_at'])) {
        json_response(['ok' => false, 'code' => 'EMAIL_NOT_VERIFIED', 'error' => 'Bitte bestätige zuerst deine E-Mail-Adresse. Öffne dafür den Link in deiner Bestätigungsmail.'], 403);
    }

    $session = issue_account_session(db(), (int) $user['id']);
    db()->commit();
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'user' => $session['user'], 'csrfToken' => $session['csrfToken']]);
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

    $stmt = $pdo->prepare('SELECT id FROM quiz_users WHERE username = :username OR email = :email');
    $stmt->execute(['username' => $username, 'email' => $email]);
    $existing = $stmt->fetch();
    if ($existing) {
        $userId = (int) $existing['id'];
        $stmt = $pdo->prepare('UPDATE quiz_users SET username = :username, email = :email, avatar_key = :avatar_key, profile_image_url = :profile_image_url, email_verified_at = COALESCE(email_verified_at, NOW()), privacy_accepted_at = COALESCE(privacy_accepted_at, NOW()), deleted_at = NULL WHERE id = :id');
        $stmt->execute([
            'id' => $userId,
            'username' => $username,
            'email' => $email,
            'avatar_key' => $avatarKey,
            'profile_image_url' => avatar_url($avatarKey),
        ]);
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

    $session = issue_account_session($pdo, $userId);
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'user' => $session['user'], 'csrfToken' => $session['csrfToken']]);
}

function account_me(): void
{
    require_method('POST');
    read_json_body();
    $user = require_account(false);
    $token = current_user_token();
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'user' => format_account_user($user), 'csrfToken' => user_csrf_token($token)]);
}

function account_logout(): void
{
    require_method('POST');
    read_json_body();
    $token = current_user_token();
    require_user_csrf($token);
    revoke_current_user_session($token);
    clear_user_session_cookie();
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION]);
}

function account_update(): void
{
    require_method('POST');
    $data = read_json_body();
    db()->beginTransaction();
    $user = require_account();
    $username = normalize_username($data['username'] ?? $user['username']);
    $avatarKey = normalize_avatar_key($data['avatarKey'] ?? $user['avatar_key']);
    $password = (string) ($data['password'] ?? '');
    require_username_length($username);

    $params = [
        'id' => (int) $user['id'],
        'username' => $username,
        'avatar_key' => $avatarKey,
        'profile_image_url' => avatar_url($avatarKey),
    ];
    $passwordSql = '';
    if ($password !== '') {
        require_current_password($user, $data);
        require_password_strength($password);
        $passwordSql = ', password_hash = :password_hash';
        $params['password_hash'] = hash_account_password($password);
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

    if ($password !== '') {
        revoke_user_sessions((int) $user['id']);
        $stmt = db()->prepare('UPDATE quiz_password_resets SET used_at = NOW() WHERE user_id = :id AND used_at IS NULL');
        $stmt->execute(['id' => $user['id']]);
    }
    $stmt = db()->prepare('SELECT * FROM quiz_users WHERE id = :id');
    $stmt->execute(['id' => $user['id']]);
    $updated = format_account_user($stmt->fetch());
    $csrfToken = user_csrf_token(current_user_token());
    if ($password !== '') {
        $csrfToken = issue_user_session((int) $user['id']);
    }
    db()->commit();
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'user' => $updated, 'csrfToken' => $csrfToken]);
}

function account_delete(): void
{
    require_method('POST');
    $data = read_json_body();
    db()->beginTransaction();
    $user = require_account();
    require_current_password($user, $data);
    $confirm = (string) ($data['confirm'] ?? '');
    if ($confirm !== 'DELETE') {
        json_response(['ok' => false, 'error' => 'Bitte bestätige die Löschung mit DELETE.'], 422);
    }
    $deletedEmail = (string) ($user['email'] ?? '');
    $deletedUsername = (string) ($user['username'] ?? '');

    $pdo = db();
    revoke_user_sessions((int) $user['id']);
    $pdo->prepare('DELETE FROM quiz_question_results WHERE user_id = ?')->execute([(int) $user['id']]);
    $pdo->prepare('DELETE FROM quiz_rounds WHERE user_id = ?')->execute([(int) $user['id']]);
    $stmt = $pdo->prepare('UPDATE quiz_results SET user_id = NULL WHERE user_id = :id');
    $stmt->execute(['id' => (int) $user['id']]);
    $stmt = $pdo->prepare('UPDATE quiz_users SET username = NULL, email = NULL, password_hash = NULL, profile_image_url = NULL, avatar_key = NULL, deleted_at = NOW() WHERE id = :id');
    $stmt->execute(['id' => (int) $user['id']]);
    $pdo->commit();
    clear_user_session_cookie();
    send_account_deleted_mail($deletedEmail, $deletedUsername);

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
            try {
                send_account_mail(
                $email,
                'Quiz-Hero Passwort zurücksetzen',
                "Hallo,\n\nhier kannst du dein Quiz-Hero Passwort zurücksetzen:\n{$link}\n\nDer Link ist 1 Stunde gültig. Wenn du das nicht warst, kannst du diese E-Mail ignorieren.\n\nViele Grüße\nQuiz-Hero",
                account_password_reset_mail_html($link)
            );
            } catch (Throwable $exception) {
                $pdo->prepare('DELETE FROM quiz_password_resets WHERE token_hash = ?')->execute([hash('sha256', $token)]);
                error_log('Quiz-Hero password reset delivery failed.');
            }
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
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT * FROM quiz_password_resets WHERE token_hash = :token_hash AND used_at IS NULL AND expires_at > NOW() FOR UPDATE');
    $stmt->execute(['token_hash' => hash('sha256', $token)]);
    $row = $stmt->fetch();
    if (!$row) {
        json_response(['ok' => false, 'error' => 'Der Reset-Link ist ungültig oder abgelaufen.'], 400);
    }

    $stmt = $pdo->prepare('SELECT id FROM quiz_users WHERE id = :id AND deleted_at IS NULL FOR UPDATE');
    $stmt->execute(['id' => $row['user_id']]);
    if (!$stmt->fetch()) {
        $pdo->rollBack();
        json_response(['ok' => false, 'error' => 'Der Reset-Link ist ungültig oder abgelaufen.'], 400);
    }
    $stmt = $pdo->prepare('UPDATE quiz_password_resets SET used_at = NOW() WHERE id = :id');
    $stmt->execute(['id' => $row['id']]);
    $stmt = $pdo->prepare('UPDATE quiz_users SET password_hash = :password_hash WHERE id = :id');
    $stmt->execute(['id' => $row['user_id'], 'password_hash' => hash_account_password($password)]);
    revoke_user_sessions((int) $row['user_id']);
    $stmt = $pdo->prepare('UPDATE quiz_password_resets SET used_at = NOW() WHERE user_id = :id AND used_at IS NULL');
    $stmt->execute(['id' => $row['user_id']]);
    $session = issue_account_session($pdo, (int) $row['user_id']);
    $pdo->commit();

    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'user' => $session['user'], 'csrfToken' => $session['csrfToken']]);
}
