<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

const QUIZ_HERO_API_VERSION = '1';
const QUIZ_HERO_MAX_IMAGE_UPLOAD_BYTES = 6291456;
const QUIZ_HERO_CONSENT_VERSION = '2026-06-30';
const QUIZ_HERO_USERNAME_MAX_LENGTH = 50;

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
        'question-feedback-save' => question_feedback_save(),
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
        'admin-question-import' => admin_question_import(),
        'admin-question-delete' => admin_question_delete(),
        'admin-category-save' => admin_category_save(),
        'admin-image-upload' => admin_image_upload(),
        'admin-media-list' => admin_media_list(),
        'admin-media-delete' => admin_media_delete(),
        'admin-users-list' => admin_users_list(),
        'admin-user-delete' => admin_user_delete(),
        'admin-question-feedback-list' => admin_question_feedback_list(),
        'admin-question-feedback-delete' => admin_question_feedback_delete(),
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
    emit_quiz_data(true, true);
}

function admin_data(): void
{
    require_method('GET');
    require_admin();
    emit_quiz_data(false, false);
}

function emit_quiz_data(bool $onlyActive, bool $onlyEnabledCategories): void
{
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION] + load_quiz_data($onlyActive, $onlyEnabledCategories));
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
        'hero' => ['key' => 'hero', 'label' => 'Quiz-Hero', 'url' => 'images/website/avatar/quizo.png'],
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

function send_account_mail(string $to, string $subject, string $message, ?string $htmlMessage = null): void
{
    $from = env_value('QUIZ_HERO_MAIL_FROM', 'helden@quiz-hero.de');
    $transport = env_value('QUIZ_HERO_MAIL_TRANSPORT', 'log');
    $encodedSubject = function_exists('mb_encode_mimeheader')
        ? mb_encode_mimeheader($subject, 'UTF-8')
        : $subject;
    $headers = [
        'From: Quiz-Hero <' . $from . '>',
        'Reply-To: ' . $from,
        'MIME-Version: 1.0',
        'X-Mailer: Quiz-Hero',
    ];
    $mailBody = $message;
    if ($htmlMessage !== null) {
        $boundary = 'quizhero-' . bin2hex(random_bytes(12));
        $headers[] = 'Content-Type: multipart/alternative; boundary="' . $boundary . '"';
        $mailBody = "--{$boundary}\r\n"
            . "Content-Type: text/plain; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: 8bit\r\n\r\n"
            . $message . "\r\n\r\n"
            . "--{$boundary}\r\n"
            . "Content-Type: text/html; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: 8bit\r\n\r\n"
            . $htmlMessage . "\r\n\r\n"
            . "--{$boundary}--";
    } else {
        $headers[] = 'Content-Type: text/plain; charset=UTF-8';
    }

    if ($transport === 'smtp') {
        if (smtp_send_account_mail($to, $from, $encodedSubject, $headers, $mailBody)) {
            return;
        }
        error_log('Quiz-Hero SMTP mail failed for ' . $to);
    } elseif ($transport === 'mail') {
        if (@mail($to, $encodedSubject, $mailBody, implode("\r\n", $headers))) {
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
        '[' . gmdate(DATE_ATOM) . "] To: {$to}\nSubject: {$subject}\n{$mailBody}\n\n",
        FILE_APPEND
    );
}

function smtp_send_account_mail(string $to, string $from, string $encodedSubject, array $headers, string $body): bool
{
    $host = trim((string) env_value('QUIZ_HERO_SMTP_HOST', ''));
    if ($host === '') {
        error_log('Quiz-Hero SMTP host is missing.');
        return false;
    }

    $port = (int) env_value('QUIZ_HERO_SMTP_PORT', '587');
    $secure = strtolower(trim((string) env_value('QUIZ_HERO_SMTP_SECURE', 'tls')));
    $username = trim((string) env_value('QUIZ_HERO_SMTP_USER', ''));
    $password = (string) env_value('QUIZ_HERO_SMTP_PASSWORD', '');
    $timeout = max(5, (int) env_value('QUIZ_HERO_SMTP_TIMEOUT', '15'));
    $server = $secure === 'ssl' ? 'ssl://' . $host : $host;
    $socket = @fsockopen($server, $port, $errno, $errstr, $timeout);
    if (!$socket) {
        error_log("Quiz-Hero SMTP connection failed: {$errno} {$errstr}");
        return false;
    }

    stream_set_timeout($socket, $timeout);

    try {
        smtp_expect($socket, [220]);
        smtp_command($socket, 'EHLO quiz-hero.de', [250]);

        if ($secure === 'tls' || $secure === 'starttls') {
            smtp_command($socket, 'STARTTLS', [220]);
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('SMTP STARTTLS konnte nicht aktiviert werden.');
            }
            smtp_command($socket, 'EHLO quiz-hero.de', [250]);
        }

        if ($username !== '') {
            smtp_command($socket, 'AUTH LOGIN', [334]);
            smtp_command($socket, base64_encode($username), [334], false);
            smtp_command($socket, base64_encode($password), [235], false);
        }

        smtp_command($socket, 'MAIL FROM:<' . smtp_address($from) . '>', [250]);
        smtp_command($socket, 'RCPT TO:<' . smtp_address($to) . '>', [250, 251]);
        smtp_command($socket, 'DATA', [354]);

        $messageHeaders = array_merge([
            'To: ' . smtp_address($to),
            'Subject: ' . $encodedSubject,
            'Date: ' . date(DATE_RFC2822),
            'Message-ID: <' . bin2hex(random_bytes(12)) . '@quiz-hero.de>',
        ], $headers);
        fwrite($socket, implode("\r\n", $messageHeaders) . "\r\n\r\n" . smtp_dot_stuff($body) . "\r\n.\r\n");
        smtp_expect($socket, [250]);
        smtp_command($socket, 'QUIT', [221]);
        fclose($socket);
        return true;
    } catch (Throwable $exception) {
        error_log('Quiz-Hero SMTP error: ' . $exception->getMessage());
        @fwrite($socket, "QUIT\r\n");
        fclose($socket);
        return false;
    }
}

function smtp_address(string $email): string
{
    $email = normalize_email($email);
    if ($email === '') {
        throw new RuntimeException('Ungültige SMTP-Adresse.');
    }
    return $email;
}

function smtp_command($socket, string $command, array $expectedCodes, bool $appendLineBreak = true): void
{
    fwrite($socket, $command . ($appendLineBreak ? "\r\n" : "\r\n"));
    smtp_expect($socket, $expectedCodes);
}

function smtp_expect($socket, array $expectedCodes): void
{
    $response = '';
    $code = 0;
    while (($line = fgets($socket, 515)) !== false) {
        $response .= $line;
        if (preg_match('/^(\d{3})\s/', $line, $matches)) {
            $code = (int) $matches[1];
            break;
        }
    }
    if (!in_array($code, $expectedCodes, true)) {
        throw new RuntimeException('Unerwartete SMTP-Antwort: ' . trim($response));
    }
}

function smtp_dot_stuff(string $body): string
{
    $body = preg_replace("/\r\n|\r|\n/", "\r\n", $body) ?? $body;
    return preg_replace('/^\./m', '..', $body) ?? $body;
}

function account_verification_mail_html(string $link): string
{
    $safeLink = htmlspecialchars($link, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $logoUrl = htmlspecialchars(public_base_url() . '/images/website/avatar/logo.png', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    return <<<HTML
<!doctype html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quiz-Hero Registrierung bestätigen</title>
</head>
<body style="margin:0;padding:0;background:#eef4f6;color:#222;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef4f6;margin:0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #c9dbe5;border-radius:8px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:28px 28px 12px;">
              <img src="{$logoUrl}" alt="Quiz-Hero" width="84" height="84" style="display:block;border:0;width:84px;height:84px;object-fit:contain;">
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;text-align:center;">
              <h1 style="margin:0 0 12px;font-size:28px;line-height:1.15;color:#222;font-weight:800;">Willkommen bei Quiz-Hero</h1>
              <p style="margin:0 0 22px;font-size:16px;line-height:1.55;color:#5f666b;">Bestätige kurz deine E-Mail-Adresse, dann ist dein Account bereit.</p>
              <a href="{$safeLink}" style="display:inline-block;background:#3f3f3f;color:#ffffff;text-decoration:none;font-size:17px;font-weight:700;padding:14px 22px;border-radius:4px;">E-Mail bestätigen</a>
              <p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#747b80;">Der Link ist 24 Stunden gültig. Wenn du dich nicht registriert hast, kannst du diese E-Mail ignorieren.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;background:#f6fafb;border-top:1px solid #dbe8ee;">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#747b80;">Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#226184;word-break:break-all;">{$safeLink}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

function account_password_reset_mail_html(string $link): string
{
    $safeLink = htmlspecialchars($link, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $logoUrl = htmlspecialchars(public_base_url() . '/images/website/avatar/logo.png', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    return <<<HTML
<!doctype html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quiz-Hero Passwort zurücksetzen</title>
</head>
<body style="margin:0;padding:0;background:#eef4f6;color:#222;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef4f6;margin:0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #c9dbe5;border-radius:8px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:28px 28px 12px;">
              <img src="{$logoUrl}" alt="Quiz-Hero" width="84" height="84" style="display:block;border:0;width:84px;height:84px;object-fit:contain;">
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;text-align:center;">
              <h1 style="margin:0 0 12px;font-size:28px;line-height:1.15;color:#222;font-weight:800;">Passwort zurücksetzen</h1>
              <p style="margin:0 0 22px;font-size:16px;line-height:1.55;color:#5f666b;">Du hast ein neues Passwort für deinen Quiz-Hero Account angefordert. Lege es über den Button neu fest.</p>
              <a href="{$safeLink}" style="display:inline-block;background:#3f3f3f;color:#ffffff;text-decoration:none;font-size:17px;font-weight:700;padding:14px 22px;border-radius:4px;">Passwort neu festlegen</a>
              <p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#747b80;">Der Link ist 1 Stunde gültig. Wenn du das nicht warst, kannst du diese E-Mail ignorieren.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;background:#f6fafb;border-top:1px solid #dbe8ee;">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#747b80;">Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#226184;word-break:break-all;">{$safeLink}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

function account_registration_notice_mail_html(string $username, string $email): string
{
    $safeUsername = htmlspecialchars($username, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeEmail = htmlspecialchars($email, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeCreatedAt = htmlspecialchars(date('d.m.Y H:i'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $logoUrl = htmlspecialchars(public_base_url() . '/images/website/avatar/logo.png', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    return <<<HTML
<!doctype html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neue Quiz-Hero Registrierung</title>
</head>
<body style="margin:0;padding:0;background:#eef4f6;color:#222;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef4f6;margin:0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #c9dbe5;border-radius:8px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:28px 28px 12px;">
              <img src="{$logoUrl}" alt="Quiz-Hero" width="84" height="84" style="display:block;border:0;width:84px;height:84px;object-fit:contain;">
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 30px;text-align:left;">
              <h1 style="margin:0 0 14px;font-size:26px;line-height:1.15;color:#222;font-weight:800;text-align:center;">Neue Registrierung</h1>
              <p style="margin:0 0 18px;font-size:16px;line-height:1.55;color:#5f666b;text-align:center;">Ein neuer Quiz-Hero Account wurde angelegt.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6fafb;border:1px solid #dbe8ee;border-radius:8px;">
                <tr>
                  <td style="padding:14px 16px;font-size:14px;line-height:1.5;color:#747b80;">Username</td>
                  <td style="padding:14px 16px;font-size:14px;line-height:1.5;color:#222;font-weight:700;text-align:right;">{$safeUsername}</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;border-top:1px solid #dbe8ee;font-size:14px;line-height:1.5;color:#747b80;">E-Mail</td>
                  <td style="padding:14px 16px;border-top:1px solid #dbe8ee;font-size:14px;line-height:1.5;color:#222;font-weight:700;text-align:right;">{$safeEmail}</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;border-top:1px solid #dbe8ee;font-size:14px;line-height:1.5;color:#747b80;">Zeitpunkt</td>
                  <td style="padding:14px 16px;border-top:1px solid #dbe8ee;font-size:14px;line-height:1.5;color:#222;font-weight:700;text-align:right;">{$safeCreatedAt}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

function notify_registration_created(string $username, string $email): void
{
    $recipient = normalize_email(env_value('QUIZ_HERO_REGISTRATION_NOTIFY_EMAIL', env_value('QUIZ_HERO_MAIL_FROM', '')));
    if ($recipient === '') {
        return;
    }

    send_account_mail(
        $recipient,
        'Neue Quiz-Hero Registrierung',
        "Hallo,\n\nes hat sich ein neuer User bei Quiz-Hero registriert.\n\nUsername: {$username}\nE-Mail: {$email}\nZeitpunkt: " . date('d.m.Y H:i') . "\n\nViele Grüße\nQuiz-Hero",
        account_registration_notice_mail_html($username, $email)
    );
}

function account_deleted_mail_html(string $username): string
{
    $safeUsername = htmlspecialchars($username !== '' ? $username : 'Quiz-Hero', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeDeletedAt = htmlspecialchars(date('d.m.Y H:i'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $logoUrl = htmlspecialchars(public_base_url() . '/images/website/avatar/logo.png', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    return <<<HTML
<!doctype html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quiz-Hero Account gelöscht</title>
</head>
<body style="margin:0;padding:0;background:#eef4f6;color:#222;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef4f6;margin:0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #c9dbe5;border-radius:8px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:28px 28px 12px;">
              <img src="{$logoUrl}" alt="Quiz-Hero" width="84" height="84" style="display:block;border:0;width:84px;height:84px;object-fit:contain;">
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 30px;text-align:center;">
              <h1 style="margin:0 0 12px;font-size:26px;line-height:1.15;color:#222;font-weight:800;">Account gelöscht</h1>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#5f666b;">Hallo {$safeUsername}, dein Quiz-Hero Account wurde gelöscht.</p>
              <p style="margin:0;font-size:14px;line-height:1.55;color:#747b80;">Deine persönlichen Accountdaten wurden entfernt. Deine bisherigen Quiz-Ergebnisse bleiben nur anonymisiert erhalten.</p>
              <p style="margin:18px 0 0;font-size:13px;line-height:1.5;color:#747b80;">Zeitpunkt: {$safeDeletedAt}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;background:#f6fafb;border-top:1px solid #dbe8ee;text-align:center;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#747b80;">Wenn du deinen Account nicht selbst gelöscht hast, antworte bitte auf diese E-Mail.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

function send_account_deleted_mail(string $email, string $username): void
{
    $recipient = normalize_email($email);
    if ($recipient === '') {
        return;
    }

    $displayName = $username !== '' ? $username : 'Quiz-Hero';
    send_account_mail(
        $recipient,
        'Quiz-Hero Account gelöscht',
        "Hallo {$displayName},\n\ndein Quiz-Hero Account wurde gelöscht.\n\nDeine persönlichen Accountdaten wurden entfernt. Deine bisherigen Quiz-Ergebnisse bleiben nur anonymisiert erhalten.\n\nZeitpunkt: " . date('d.m.Y H:i') . "\n\nWenn du deinen Account nicht selbst gelöscht hast, antworte bitte auf diese E-Mail.\n\nViele Grüße\nQuiz-Hero",
        account_deleted_mail_html($username)
    );
}

function notify_question_feedback_created(string $question, array $types, string $comment, ?int $userId): void
{
    $recipient = normalize_email(env_value('QUIZ_HERO_FEEDBACK_NOTIFY_EMAIL', env_value('QUIZ_HERO_SMTP_USER', env_value('QUIZ_HERO_REGISTRATION_NOTIFY_EMAIL', env_value('QUIZ_HERO_MAIL_FROM', '')))));
    if ($recipient === '') {
        return;
    }

    $typeText = implode(', ', array_map('question_feedback_type_label', $types));
    $userText = $userId !== null ? 'User-ID: ' . $userId : 'Nicht angemeldet';
    $subject = 'Neues Quiz-Hero Frage-Feedback';
    $message = "Hallo,\n\nes wurde Feedback zu einer Quiz-Frage gesendet.\n\nFrage: {$question}\nTyp: {$typeText}\nKommentar: " . ($comment !== '' ? $comment : '-') . "\nUser: {$userText}\nZeitpunkt: " . date('d.m.Y H:i') . "\n\nViele Grüße\nQuiz-Hero";
    send_account_mail($recipient, $subject, $message, question_feedback_mail_html($question, $types, $comment, $userText));
}

function question_feedback_mail_html(string $question, array $types, string $comment, string $userText): string
{
    $safeQuestion = htmlspecialchars($question, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeTypes = htmlspecialchars(implode(', ', array_map('question_feedback_type_label', $types)), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeComment = htmlspecialchars($comment !== '' ? $comment : '-', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeUserText = htmlspecialchars($userText, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeCreatedAt = htmlspecialchars(date('d.m.Y H:i'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $logoUrl = htmlspecialchars(public_base_url() . '/images/website/avatar/logo.png', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    return <<<HTML
<!doctype html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neues Quiz-Hero Feedback</title>
</head>
<body style="margin:0;padding:0;background:#eef4f6;color:#222;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef4f6;margin:0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #c9dbe5;border-radius:8px;overflow:hidden;">
          <tr><td align="center" style="padding:28px 28px 12px;"><img src="{$logoUrl}" alt="Quiz-Hero" width="84" height="84" style="display:block;border:0;width:84px;height:84px;object-fit:contain;"></td></tr>
          <tr>
            <td style="padding:0 32px 30px;text-align:left;">
              <h1 style="margin:0 0 14px;font-size:26px;line-height:1.15;color:#222;font-weight:800;text-align:center;">Neues Frage-Feedback</h1>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#747b80;">Zeitpunkt: {$safeCreatedAt}</p>
              <p style="margin:0 0 10px;font-size:14px;line-height:1.55;color:#747b80;">Frage</p>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#222;font-weight:700;">{$safeQuestion}</p>
              <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#747b80;">Meldungstyp</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#222;">{$safeTypes}</p>
              <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#747b80;">Kommentar</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#222;">{$safeComment}</p>
              <p style="margin:0;font-size:13px;line-height:1.5;color:#747b80;">{$safeUserText}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

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
    $stmt = $pdo->prepare('SELECT * FROM quiz_email_verifications WHERE token_hash = :token_hash AND used_at IS NULL AND expires_at > NOW()');
    $stmt->execute(['token_hash' => hash('sha256', $token)]);
    $row = $stmt->fetch();
    if (!$row) {
        json_response(['ok' => false, 'error' => 'Der Bestätigungslink ist ungültig oder abgelaufen.'], 400);
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
        json_response(['ok' => false, 'error' => 'Login-Daten sind ungültig.'], 401);
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
    require_username_length($username);

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
        json_response(['ok' => false, 'error' => 'Bitte bestätige die Löschung mit DELETE.'], 422);
    }
    $deletedEmail = (string) ($user['email'] ?? '');
    $deletedUsername = (string) ($user['username'] ?? '');

    $pdo = db();
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('UPDATE quiz_results SET user_id = NULL WHERE user_id = :id');
    $stmt->execute(['id' => (int) $user['id']]);
    $stmt = $pdo->prepare('UPDATE quiz_users SET username = NULL, email = NULL, password_hash = NULL, profile_image_url = NULL, avatar_key = NULL, deleted_at = NOW() WHERE id = :id');
    $stmt->execute(['id' => (int) $user['id']]);
    $pdo->commit();
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
            send_account_mail(
                $email,
                'Quiz-Hero Passwort zurücksetzen',
                "Hallo,\n\nhier kannst du dein Quiz-Hero Passwort zurücksetzen:\n{$link}\n\nDer Link ist 1 Stunde gültig. Wenn du das nicht warst, kannst du diese E-Mail ignorieren.\n\nViele Grüße\nQuiz-Hero",
                account_password_reset_mail_html($link)
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
        json_response(['ok' => false, 'error' => 'Der Reset-Link ist ungültig oder abgelaufen.'], 400);
    }

    $pdo->beginTransaction();
    $stmt = $pdo->prepare('UPDATE quiz_password_resets SET used_at = NOW() WHERE id = :id');
    $stmt->execute(['id' => $row['id']]);
    $stmt = $pdo->prepare('UPDATE quiz_users SET password_hash = :password_hash WHERE id = :id');
    $stmt->execute(['id' => $row['user_id'], 'password_hash' => password_hash($password, PASSWORD_DEFAULT)]);
    $pdo->commit();

    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'user' => issue_account_token($pdo, (int) $row['user_id'])]);
}

function question_feedback_save(): void
{
    require_method('POST');
    rate_limit('question-feedback', 20, 300);
    $data = read_json_body();
    $questionId = ensure_int($data['questionId'] ?? 0, 1, PHP_INT_MAX);
    $types = normalize_question_feedback_types($data['types'] ?? []);
    $comment = clean_string($data['comment'] ?? '', 2000);
    if ($types === [] && $comment === '') {
        json_response(['ok' => false, 'error' => 'Bitte wähle mindestens einen Feedback-Typ oder schreibe einen Kommentar.'], 422);
    }

    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, question FROM quiz_questions WHERE id = :id');
    $stmt->execute(['id' => $questionId]);
    $question = $stmt->fetch();
    if (!$question) {
        json_response(['ok' => false, 'error' => 'Frage wurde nicht gefunden.'], 404);
    }

    $userId = null;
    if (!empty($data['userId']) && !empty($data['userToken'])) {
        $user = require_account_from_payload($data);
        $userId = (int) $user['id'];
    }

    $stmt = $pdo->prepare('INSERT INTO quiz_question_feedback (question_id, user_id, types_json, comment, user_agent_hash) VALUES (:question_id, :user_id, :types_json, :comment, :user_agent_hash)');
    $stmt->execute([
        'question_id' => $questionId,
        'user_id' => $userId,
        'types_json' => json_encode($types, JSON_UNESCAPED_UNICODE),
        'comment' => $comment !== '' ? $comment : null,
        'user_agent_hash' => hash('sha256', (string) ($_SERVER['HTTP_USER_AGENT'] ?? '')),
    ]);

    notify_question_feedback_created((string) $question['question'], $types, $comment, $userId);
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION]);
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

function admin_users_list(): void
{
    require_method('GET');
    require_admin();
    $stmt = db()->query('SELECT u.id, u.username, u.email, u.profile_image_url, u.avatar_key, u.email_verified_at, u.created_at, u.last_seen_at, (SELECT COUNT(*) FROM quiz_results r WHERE r.user_id = u.id) AS result_count FROM quiz_users u WHERE u.deleted_at IS NULL ORDER BY u.created_at DESC, u.id DESC');
    $users = array_map(static fn(array $user): array => format_admin_user($user), $stmt->fetchAll());
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'users' => $users]);
}

function admin_question_feedback_list(): void
{
    require_method('GET');
    require_admin();
    $stmt = db()->query('SELECT f.id, f.question_id, f.types_json, f.comment, f.created_at, q.question, q.category_id, u.username, u.email FROM quiz_question_feedback f INNER JOIN quiz_questions q ON q.id = f.question_id LEFT JOIN quiz_users u ON u.id = f.user_id ORDER BY f.created_at DESC, f.id DESC LIMIT 200');
    $items = array_map(static function (array $row): array {
        return [
            'id' => (int) $row['id'],
            'questionId' => (int) $row['question_id'],
            'question' => $row['question'] ?? '',
            'categoryId' => $row['category_id'] ?? '',
            'types' => decode_json_field($row['types_json'] ?? null, []),
            'comment' => $row['comment'] ?? '',
            'createdAt' => isset($row['created_at']) ? date(DATE_ATOM, strtotime((string) $row['created_at'])) : '',
            'user' => $row['username'] || $row['email'] ? [
                'username' => $row['username'] ?? '',
                'email' => $row['email'] ?? '',
            ] : null,
        ];
    }, $stmt->fetchAll());
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'feedback' => $items]);
}

function admin_question_feedback_delete(): void
{
    require_method('POST');
    require_admin_csrf();
    $data = read_json_body();
    $id = ensure_int($data['id'] ?? 0, 1, PHP_INT_MAX);
    $stmt = db()->prepare('DELETE FROM quiz_question_feedback WHERE id = :id');
    $stmt->execute(['id' => $id]);
    if ($stmt->rowCount() === 0) {
        json_response(['ok' => false, 'error' => 'Feedback wurde nicht gefunden.'], 404);
    }
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION]);
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

function admin_question_import(): void
{
    require_method('POST');
    require_admin_csrf();
    $data = read_json_body();
    $rawQuestions = $data['questions'] ?? null;
    if (!is_array($rawQuestions)) {
        json_response(['ok' => false, 'error' => 'Import erwartet ein Array "questions".'], 422);
    }
    if (count($rawQuestions) === 0) {
        json_response(['ok' => false, 'error' => 'Die Importdatei enthält keine Fragen.'], 422);
    }
    if (count($rawQuestions) > 200) {
        json_response(['ok' => false, 'error' => 'Maximal 200 Fragen pro Import.'], 422);
    }

    $pdo = db();
    $categoryIds = array_fill_keys($pdo->query('SELECT id FROM quiz_categories')->fetchAll(PDO::FETCH_COLUMN), true);
    $existingKeys = [];
    foreach ($pdo->query('SELECT question FROM quiz_questions')->fetchAll(PDO::FETCH_COLUMN) as $questionText) {
        $existingKeys[question_duplicate_key((string) $questionText)] = true;
    }

    $seenImportKeys = [];
    $validQuestions = [];
    $results = [];
    foreach (array_values($rawQuestions) as $index => $entry) {
        $result = validate_import_question($entry, $index, $categoryIds, $existingKeys, $seenImportKeys);
        if ($result['valid']) {
            $validQuestions[] = $result['payload'];
        }
        unset($result['payload']);
        $results[] = $result;
    }

    if ($validQuestions === []) {
        json_response([
            'ok' => false,
            'apiVersion' => QUIZ_HERO_API_VERSION,
            'error' => 'Keine gültige Frage zum Importieren gefunden.',
            'results' => $results,
        ], 422);
    }

    $stmt = $pdo->prepare('INSERT INTO quiz_questions (category_id, question, answers_json, correct_index, difficulty, question_type, image_url, tags_json, background_knowledge, active, sort_order) VALUES (:category_id, :question, :answers_json, :correct_index, :difficulty, :question_type, :image_url, :tags_json, :background_knowledge, :active, :sort_order)');
    $categoryStmt = $pdo->prepare('INSERT IGNORE INTO quiz_categories (id, title, description, seo_description, icon, enabled, badge_json, sort_order) VALUES (:id, :title, "", "", NULL, 1, :badge_json, 100)');
    $pdo->beginTransaction();
    try {
        foreach ($validQuestions as $question) {
            if (!isset($categoryIds[$question['category_id']])) {
                $categoryStmt->execute([
                    'id' => $question['category_id'],
                    'title' => $question['category_id'],
                    'badge_json' => json_encode(['active' => false, 'text' => ''], JSON_UNESCAPED_UNICODE),
                ]);
                $categoryIds[$question['category_id']] = true;
            }
            $stmt->execute($question);
        }
        $pdo->commit();
    } catch (Throwable $exception) {
        $pdo->rollBack();
        throw $exception;
    }

    json_response([
        'ok' => true,
        'apiVersion' => QUIZ_HERO_API_VERSION,
        'importedCount' => count($validQuestions),
        'skippedCount' => count($rawQuestions) - count($validQuestions),
        'results' => $results,
    ]);
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
        json_response(['ok' => false, 'error' => 'Das Bild ist zu groß. Maximal erlaubt sind 6 MB.'], 413);
    }

    $context = clean_string($_POST['context'] ?? 'question', 40);
    $rawCategoryId = clean_string($_POST['categoryId'] ?? '', 120);
    if ($rawCategoryId === '' && $context === 'category') {
        $rawCategoryId = clean_string($_POST['categoryTitle'] ?? '', 120);
    }
    if ($rawCategoryId === '' && $context === 'media') {
        $rawCategoryId = 'media';
    }
    if ($rawCategoryId === '') {
        json_response(['ok' => false, 'error' => 'Kategorie fehlt.'], 422);
    }
    $categoryId = slugify($rawCategoryId);

    if (!in_array($context, ['category', 'media'], true)) {
        $stmt = db()->prepare('SELECT id FROM quiz_categories WHERE id = :id');
        $stmt->execute(['id' => $categoryId]);
        if (!$stmt->fetch()) {
            json_response(['ok' => false, 'error' => 'Kategorie wurde nicht gefunden.'], 422);
        }
    }

    $file = $_FILES['image'] ?? null;
    if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        json_response(['ok' => false, 'error' => 'Bitte wähle eine Bilddatei aus.'], 422);
    }

    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        json_response(['ok' => false, 'error' => upload_error_message((int) $file['error'])], 400);
    }

    $size = (int) ($file['size'] ?? 0);
    if ($size <= 0 || $size > QUIZ_HERO_MAX_IMAGE_UPLOAD_BYTES) {
        json_response(['ok' => false, 'error' => 'Das Bild darf maximal 6 MB groß sein.'], 413);
    }

    $tmpName = (string) ($file['tmp_name'] ?? '');
    if ($tmpName === '' || !is_uploaded_file($tmpName)) {
        json_response(['ok' => false, 'error' => 'Upload konnte nicht verarbeitet werden.'], 400);
    }

    $imageInfo = @getimagesize($tmpName);
    if ($imageInfo === false) {
        json_response(['ok' => false, 'error' => 'Die Datei ist kein gültiges Bild.'], 422);
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
    $uploadFolder = match ($context) {
        'category' => 'categories/' . $categoryId,
        'media' => 'media',
        default => $categoryId,
    };
    $categoryDir = $baseDir . '/' . $uploadFolder;
    if (!is_dir($categoryDir) && !mkdir($categoryDir, 0755, true) && !is_dir($categoryDir)) {
        json_response(['ok' => false, 'error' => 'Upload-Ordner konnte nicht erstellt werden.'], 500);
    }

    $originalName = pathinfo((string) ($file['name'] ?? 'quiz-bild'), PATHINFO_FILENAME);
    $safeName = slugify($originalName);
    $extension = $allowed[$mime];
    if (uploaded_image_name_exists($categoryDir, $safeName)) {
        json_response(['ok' => false, 'error' => 'In dieser Kategorie gibt es bereits ein Bild mit diesem Dateinamen. Bitte benenne die Datei um oder entferne das vorhandene Bild.'], 409);
    }

    $filename = sprintf('%s-%s.%s', $safeName, bin2hex(random_bytes(6)), $extension);
    $target = $categoryDir . '/' . $filename;
    if (file_exists($target)) {
        json_response(['ok' => false, 'error' => 'In dieser Kategorie gibt es bereits ein Bild mit diesem Dateinamen. Bitte benenne die Datei um.'], 409);
    }

    if (!move_uploaded_file($tmpName, $target)) {
        json_response(['ok' => false, 'error' => 'Bild konnte nicht gespeichert werden.'], 500);
    }

    @chmod($target, 0644);

    $relativePath = sprintf('images/uploads/%s/%s', $uploadFolder, $filename);
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

function admin_media_list(): void
{
    require_method('GET');
    require_admin();
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'media' => list_uploaded_media()]);
}

function admin_media_delete(): void
{
    require_method('POST');
    require_admin_csrf();
    $data = read_json_body();
    $path = normalize_uploaded_media_path((string) ($data['path'] ?? ''));
    if ($path === '') {
        json_response(['ok' => false, 'error' => 'Bildpfad fehlt.'], 422);
    }

    $media = list_uploaded_media();
    $entry = null;
    foreach ($media as $item) {
        if ($item['path'] === $path) {
            $entry = $item;
            break;
        }
    }
    if (!$entry) {
        json_response(['ok' => false, 'error' => 'Bild wurde nicht gefunden.'], 404);
    }
    if (!empty($entry['used'])) {
        json_response(['ok' => false, 'error' => 'Bild wird noch verwendet und kann nicht geloescht werden.'], 409);
    }

    $root = realpath(dirname(__DIR__) . '/images/uploads');
    $target = realpath(dirname(__DIR__) . '/' . $path);
    if ($root === false || $target === false || !str_starts_with($target, $root . DIRECTORY_SEPARATOR)) {
        json_response(['ok' => false, 'error' => 'Ungültiger Bildpfad.'], 400);
    }
    if (!is_file($target) || !unlink($target)) {
        json_response(['ok' => false, 'error' => 'Bild konnte nicht geloescht werden.'], 500);
    }

    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION]);
}

function list_uploaded_media(): array
{
    $baseDir = dirname(__DIR__) . '/images/uploads';
    $references = load_media_references();
    $items = [];
    $indexed = [];

    if (is_dir($baseDir)) {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($baseDir, FilesystemIterator::SKIP_DOTS)
        );
        foreach ($iterator as $file) {
            if (!$file instanceof SplFileInfo || !$file->isFile()) {
                continue;
            }
            $item = build_media_item($file->getPathname(), $references);
            if (!$item) {
                continue;
            }
            $items[] = $item;
            $indexed[$item['path']] = true;
        }
    }

    foreach (array_keys($references) as $relative) {
        if (isset($indexed[$relative])) {
            continue;
        }
        $absolute = dirname(__DIR__) . '/' . $relative;
        if (!is_file($absolute)) {
            continue;
        }
        $item = build_media_item($absolute, $references);
        if ($item) {
            $items[] = $item;
        }
    }

    usort($items, static fn(array $a, array $b): int => strcmp($a['filename'], $b['filename']));
    return $items;
}

function build_media_item(string $path, array $references): ?array
{
    $mime = detect_mime_type($path);
    if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
        return null;
    }
    $relative = str_replace('\\', '/', substr($path, strlen(dirname(__DIR__)) + 1));
    if (!str_starts_with($relative, 'images/')) {
        return null;
    }
    $info = @getimagesize($path) ?: [];
    $usage = $references[$relative] ?? [];
    $categories = array_values(array_unique(array_filter(array_map(
        static fn(array $ref): string => (string) ($ref['categoryId'] ?? ''),
        $usage
    ))));
    $tags = array_values(array_unique(array_merge(...array_map(
        static fn(array $ref): array => $ref['tags'] ?? [],
        $usage ?: [[]]
    ))));
    sort($categories);
    sort($tags);

    return [
        'path' => $relative,
        'filename' => basename($relative),
        'folder' => dirname($relative) === '.' ? '' : dirname($relative),
        'url' => '../' . $relative,
        'mimeType' => $mime,
        'size' => filesize($path) ?: 0,
        'modifiedAt' => date(DATE_ATOM, filemtime($path) ?: time()),
        'width' => (int) ($info[0] ?? 0),
        'height' => (int) ($info[1] ?? 0),
        'used' => count($usage) > 0,
        'usage' => $usage,
        'categories' => $categories,
        'tags' => $tags,
        'deletable' => str_starts_with($relative, 'images/uploads/') && count($usage) === 0,
    ];
}

function load_media_references(): array
{
    $references = [];
    $pdo = db();
    $questions = $pdo->query('SELECT id, category_id, question, image_url, tags_json FROM quiz_questions WHERE image_url IS NOT NULL AND image_url <> ""')->fetchAll();
    foreach ($questions as $question) {
        $path = normalize_local_image_path((string) ($question['image_url'] ?? ''));
        if ($path === '') {
            continue;
        }
        $references[$path][] = [
            'type' => 'question',
            'id' => (int) $question['id'],
            'title' => clean_string($question['question'] ?? '', 140),
            'categoryId' => $question['category_id'],
            'tags' => decode_json_field($question['tags_json'] ?? null, []),
        ];
    }

    $categories = $pdo->query('SELECT id, title, icon FROM quiz_categories WHERE icon IS NOT NULL AND icon <> ""')->fetchAll();
    foreach ($categories as $category) {
        $path = normalize_local_image_path((string) ($category['icon'] ?? ''));
        if ($path === '') {
            continue;
        }
        $references[$path][] = [
            'type' => 'category',
            'id' => $category['id'],
            'title' => $category['title'],
            'categoryId' => $category['id'],
            'tags' => [],
        ];
    }

    return $references;
}

function normalize_local_image_path(string $path): string
{
    $path = trim(str_replace('\\', '/', $path));
    if ($path === '' || preg_match('/^https?:\/\//i', $path)) {
        return '';
    }
    $path = preg_replace('/[?#].*$/', '', $path) ?? '';
    $path = ltrim($path, '/');
    if (str_starts_with($path, '../')) {
        $path = substr($path, 3);
    }
    if (!str_starts_with($path, 'images/')) {
        return '';
    }
    if (str_contains($path, '../')) {
        return '';
    }
    return $path;
}

function normalize_uploaded_media_path(string $path): string
{
    $path = normalize_local_image_path($path);
    if ($path === '' || !str_starts_with($path, 'images/uploads/')) {
        return '';
    }
    return $path;
}

function uploaded_image_name_exists(string $directory, string $safeName): bool
{
    $patterns = [
        $directory . '/' . $safeName . '-*.jpg',
        $directory . '/' . $safeName . '-*.png',
        $directory . '/' . $safeName . '-*.webp',
        $directory . '/' . $safeName . '.jpg',
        $directory . '/' . $safeName . '.png',
        $directory . '/' . $safeName . '.webp',
    ];

    foreach ($patterns as $pattern) {
        if (glob($pattern, GLOB_NOSORT)) {
            return true;
        }
    }

    return false;
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
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Das Bild ist zu groß.',
        UPLOAD_ERR_PARTIAL => 'Das Bild wurde nur teilweise hochgeladen.',
        UPLOAD_ERR_NO_TMP_DIR => 'Server-Upload-Ordner fehlt.',
        UPLOAD_ERR_CANT_WRITE => 'Bild konnte nicht auf dem Server gespeichert werden.',
        UPLOAD_ERR_EXTENSION => 'Upload wurde von einer PHP-Erweiterung gestoppt.',
        default => 'Upload fehlgeschlagen.',
    };
}

function question_duplicate_key(string $question): string
{
    $question = mb_strtolower(trim($question), 'UTF-8');
    $question = preg_replace('/\s+/u', ' ', $question) ?? $question;
    return $question;
}

function normalize_import_tags(mixed $tags): string
{
    if (is_array($tags)) {
        return implode(',', array_map(static fn($tag): string => (string) $tag, $tags));
    }
    return (string) $tags;
}

function validate_import_question(mixed $entry, int $index, array $categoryIds, array $existingKeys, array &$seenImportKeys): array
{
    $number = $index + 1;
    $errors = [];
    $warnings = [];
    if (!is_array($entry)) {
        return [
            'index' => $index,
            'valid' => false,
            'question' => '',
            'categoryId' => '',
            'errors' => ["Eintrag {$number} ist kein Objekt."],
            'warnings' => [],
            'payload' => null,
        ];
    }

    $categoryId = slugify((string) ($entry['categoryId'] ?? $entry['category'] ?? ''));
    $questionText = clean_string($entry['question'] ?? '', 1000);
    $answers = is_array($entry['answers'] ?? null)
        ? array_values(array_map(static fn($answer): string => clean_string((string) $answer, 255), $entry['answers']))
        : [];
    $answers = array_values(array_filter($answers, static fn(string $answer): bool => $answer !== ''));
    $correctRaw = $entry['correct'] ?? 0;
    $correct = filter_var($correctRaw, FILTER_VALIDATE_INT);
    $difficulty = clean_string($entry['difficulty'] ?? 'easy', 20);
    $tags = array_values(array_filter(array_map(static fn($tag): string => slugify((string) $tag), explode(',', normalize_import_tags($entry['tags'] ?? $entry['tag'] ?? '')))));
    $imageUrl = clean_url($entry['imageUrl'] ?? $entry['image'] ?? '', 500);
    $sortOrder = filter_var($entry['sortOrder'] ?? 100, FILTER_VALIDATE_INT);

    if ($categoryId === '') {
        $errors[] = 'Kategorie fehlt.';
    } elseif (!isset($categoryIds[$categoryId])) {
        $warnings[] = "Kategorie '{$categoryId}' existiert noch nicht und wird automatisch angelegt.";
    }
    if ($questionText === '') {
        $errors[] = 'Fragetext fehlt.';
    }
    if (count($answers) !== 4) {
        $errors[] = 'Es muessen genau vier nicht leere Antworten vorhanden sein.';
    }
    if ($correct === false || $correct < 0 || $correct > 3) {
        $errors[] = 'correct muss eine Zahl zwischen 0 und 3 sein.';
        $correct = 0;
    }
    if (!in_array($difficulty, ['easy', 'medium', 'hero'], true)) {
        $warnings[] = "Unbekannte Schwierigkeit '{$difficulty}' wurde auf easy gesetzt.";
        $difficulty = 'easy';
    }
    if ($sortOrder === false || $sortOrder < 0 || $sortOrder > 100000) {
        $warnings[] = 'Ungültige Sortierung wurde auf 100 gesetzt.';
        $sortOrder = 100;
    }
    if ($questionText !== '') {
        $duplicateKey = question_duplicate_key($questionText);
        if (isset($existingKeys[$duplicateKey])) {
            $errors[] = 'Diese Frage existiert bereits.';
        } elseif (isset($seenImportKeys[$duplicateKey])) {
            $errors[] = 'Diese Frage kommt mehrfach in der Importdatei vor.';
        } else {
            $seenImportKeys[$duplicateKey] = true;
        }
    }

    $payload = null;
    if ($errors === []) {
        $payload = [
            'category_id' => $categoryId,
            'question' => $questionText,
            'answers_json' => json_encode($answers, JSON_UNESCAPED_UNICODE),
            'correct_index' => $correct,
            'difficulty' => $difficulty,
            'question_type' => $imageUrl !== '' ? 'image' : 'text',
            'image_url' => $imageUrl ?: null,
            'tags_json' => json_encode($tags, JSON_UNESCAPED_UNICODE),
            'background_knowledge' => clean_string($entry['backgroundKnowledge'] ?? $entry['background'] ?? '', 2000) ?: null,
            'active' => array_key_exists('active', $entry) ? (!empty($entry['active']) ? 1 : 0) : 1,
            'sort_order' => $sortOrder,
        ];
    }

    return [
        'index' => $index,
        'valid' => $errors === [],
        'question' => $questionText,
        'categoryId' => $categoryId,
        'errors' => $errors,
        'warnings' => $warnings,
        'payload' => $payload,
    ];
}

function question_feedback_type_label(string $type): string
{
    return match ($type) {
        'wrong-answer' => 'Antwort falsch',
        'unclear-question' => 'Frage unklar',
        'image-mismatch' => 'Bild passt nicht',
        'spelling' => 'Rechtschreibung',
        'other' => 'Sonstiges',
        default => $type,
    };
}

function normalize_question_feedback_types(mixed $types): array
{
    if (!is_array($types)) {
        return [];
    }
    $allowed = ['wrong-answer', 'unclear-question', 'image-mismatch', 'spelling', 'other'];
    $normalized = [];
    foreach ($types as $type) {
        $type = clean_string((string) $type, 40);
        if (in_array($type, $allowed, true) && !in_array($type, $normalized, true)) {
            $normalized[] = $type;
        }
    }
    return $normalized;
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
    $tags = array_values(array_filter(array_map(static fn($tag): string => slugify((string) $tag), explode(',', normalize_import_tags($data['tags'] ?? '')))));

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
        'sortOrder' => (int) $category['sort_order'],
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
        'createdAt' => isset($question['created_at']) ? date(DATE_ATOM, strtotime((string) $question['created_at'])) : '',
        'updatedAt' => isset($question['updated_at']) ? date(DATE_ATOM, strtotime((string) $question['updated_at'])) : '',
    ];
}
